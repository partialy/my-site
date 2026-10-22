import { z } from 'zod';
import { ApiError } from '../api/api-error';
import { ApiCode } from '../api/codes';
import { DictionaryRepository, type DictionaryItem, type DictionaryType } from '../repositories/dictionary.repository';
import { createPublicId, publicIdSchema } from '../shared/public-id';

const identifier = z.string().trim().min(1).max(80)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/, '只能以字母开头，包含字母、数字、下划线或连字符');
const dictionaryValue = z.string().trim().min(1).max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, '只能包含字母、数字、下划线或连字符');
const color = z.enum(['default', 'blue', 'green', 'orange', 'red', 'purple', 'cyan', 'gold']);

export const dictionaryIdSchema = publicIdSchema;
export const dictionaryCodesSchema = z.strictObject({
  codes: z.string().min(1).max(2000).transform((text) => text.split(',').map((code) => code.trim()))
    .pipe(z.array(identifier).min(1).max(30)),
});
export const createDictionarySchema = z.strictObject({
  code: identifier,
  name: z.string().trim().min(1).max(100),
  remark: z.string().trim().max(500),
  isPublic: z.boolean(),
  enabled: z.boolean(),
});
export const updateDictionarySchema = createDictionarySchema.omit({ code: true });
export const createDictionariesSchema = z.strictObject({ items: z.array(createDictionarySchema).min(1).max(20) });
export const createDictionaryItemSchema = z.strictObject({
  label: z.string().trim().min(1).max(100),
  value: dictionaryValue,
  sort: z.number().int().min(0).max(1_000_000),
  enabled: z.boolean(),
  color,
});
export const updateDictionaryItemSchema = createDictionaryItemSchema.omit({ value: true });
export const createDictionaryItemsSchema = z.strictObject({ items: z.array(createDictionaryItemSchema).min(1).max(20) });

export type CreateDictionaryInput = z.infer<typeof createDictionarySchema>;
export type UpdateDictionaryInput = z.infer<typeof updateDictionarySchema>;
export type CreateDictionaryItemInput = z.infer<typeof createDictionaryItemSchema>;
export type UpdateDictionaryItemInput = z.infer<typeof updateDictionaryItemSchema>;

function isUniqueConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export class DictionaryService {
  private types: DictionaryType[] = [];
  private byCode = new Map<string, DictionaryType>();

  constructor(private readonly repository: DictionaryRepository) {
    this.reload();
  }

  private reload(): void {
    this.types = this.repository.list();
    this.byCode = new Map(this.types.map((type) => [type.code, type]));
  }

  list(): DictionaryType[] {
    return this.types;
  }

  getOptions(codes: string[], publicOnly: boolean): Record<string, Pick<DictionaryType, 'code' | 'name' | 'items'>> {
    const result = Object.create(null) as Record<string, Pick<DictionaryType, 'code' | 'name' | 'items'>>;
    for (const code of new Set(codes)) {
      const type = this.byCode.get(code);
      if (type?.enabled && (!publicOnly || type.isPublic)) {
        result[code] = { code: type.code, name: type.name, items: type.items.filter((item) => item.enabled) };
      }
    }
    return result;
  }

  private getType(uuid: string): DictionaryType {
    const type = this.types.find((item) => item.uuid === uuid);
    if (!type) throw new ApiError(404, ApiCode.NotFound, '字典类型不存在');
    return type;
  }

  private getItem(typeUuid: string, itemUuid: string): DictionaryItem {
    const item = this.getType(typeUuid).items.find((entry) => entry.uuid === itemUuid);
    if (!item) throw new ApiError(404, ApiCode.NotFound, '字典子项不存在');
    return item;
  }

  createType(input: CreateDictionaryInput): DictionaryType {
    if (this.byCode.has(input.code)) throw new ApiError(409, ApiCode.DictionaryValueExists, '字典类型标识已存在');
    const uuid = createPublicId();
    try {
      this.repository.createType({ uuid, ...input });
    } catch (error) {
      if (isUniqueConflict(error)) throw new ApiError(409, ApiCode.DictionaryValueExists, '字典类型标识已存在');
      throw error;
    }
    this.reload();
    return this.getType(uuid);
  }

  createTypes(inputs: CreateDictionaryInput[]): DictionaryType[] {
    const codes = inputs.map((input) => input.code);
    if (new Set(codes).size !== codes.length || codes.some((code) => this.byCode.has(code))) {
      throw new ApiError(409, ApiCode.DictionaryValueExists, '字典类型标识重复');
    }
    const uuids = inputs.map(() => createPublicId());
    try {
      this.repository.createTypes(inputs.map((input, index) => ({ ...input, uuid: uuids[index]! })));
    } catch (error) {
      if (isUniqueConflict(error)) throw new ApiError(409, ApiCode.DictionaryValueExists, '字典类型标识重复');
      throw error;
    }
    this.reload();
    return uuids.map((uuid) => this.getType(uuid));
  }

  updateType(uuid: string, input: UpdateDictionaryInput): DictionaryType {
    if (!this.repository.updateType(uuid, input)) throw new ApiError(404, ApiCode.NotFound, '字典类型不存在');
    this.reload();
    return this.getType(uuid);
  }

  createItem(typeUuid: string, input: CreateDictionaryItemInput): DictionaryItem {
    const type = this.getType(typeUuid);
    if (type.items.some((item) => item.value === input.value)) {
      throw new ApiError(409, ApiCode.DictionaryValueExists, '字典子项值已存在');
    }
    const uuid = createPublicId();
    try {
      this.repository.createItem(typeUuid, { uuid, ...input });
    } catch (error) {
      if (isUniqueConflict(error)) throw new ApiError(409, ApiCode.DictionaryValueExists, '字典子项值已存在');
      throw error;
    }
    this.reload();
    return this.getItem(typeUuid, uuid);
  }

  createItems(typeUuid: string, inputs: CreateDictionaryItemInput[]): DictionaryItem[] {
    const type = this.getType(typeUuid);
    const values = inputs.map((input) => input.value);
    if (new Set(values).size !== values.length || values.some((value) => type.items.some((item) => item.value === value))) {
      throw new ApiError(409, ApiCode.DictionaryValueExists, '字典子项值重复');
    }
    const uuids = inputs.map(() => createPublicId());
    try {
      this.repository.createItems(typeUuid, inputs.map((input, index) => ({ ...input, uuid: uuids[index]! })));
    } catch (error) {
      if (isUniqueConflict(error)) throw new ApiError(409, ApiCode.DictionaryValueExists, '字典子项值重复');
      throw error;
    }
    this.reload();
    return uuids.map((uuid) => this.getItem(typeUuid, uuid));
  }

  updateItem(typeUuid: string, itemUuid: string, input: UpdateDictionaryItemInput): DictionaryItem {
    if (!this.repository.updateItem(typeUuid, itemUuid, input)) throw new ApiError(404, ApiCode.NotFound, '字典子项不存在');
    this.reload();
    return this.getItem(typeUuid, itemUuid);
  }
}
