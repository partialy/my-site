import { getPublicApiBaseUrl, request } from './client';
import type { ApiResponse } from './types';

export const DICT_COLORS = ['default', 'blue', 'green', 'orange', 'red', 'purple', 'cyan', 'gold'] as const;
export type DictColor = typeof DICT_COLORS[number];

export interface DictItem {
  uuid: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
  color: DictColor;
  createdAt: string;
  updatedAt: string;
}

export interface DictType {
  uuid: string;
  code: string;
  name: string;
  remark: string;
  isPublic: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  items: DictItem[];
}

export type CreateDictTypeInput = Pick<DictType, 'code' | 'name' | 'remark' | 'isPublic' | 'enabled'>;
export type UpdateDictTypeInput = Omit<CreateDictTypeInput, 'code'>;
export type CreateDictItemInput = Pick<DictItem, 'label' | 'value' | 'sort' | 'enabled' | 'color'>;
export type UpdateDictItemInput = Omit<CreateDictItemInput, 'value'>;
export type PublicDictType = Pick<DictType, 'code' | 'name' | 'items'>;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('字典响应格式异常');
  return value as Record<string, unknown>;
}

function parseItem(value: unknown): DictItem {
  const item = record(value);
  if (typeof item.uuid !== 'string' ||
    typeof item.label !== 'string' || typeof item.value !== 'string' ||
    typeof item.sort !== 'number' || typeof item.enabled !== 'boolean' ||
    !DICT_COLORS.includes(item.color as DictColor) ||
    typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string') {
    throw new Error('字典子项响应格式异常');
  }
  return item as unknown as DictItem;
}

function parseType(value: unknown): DictType {
  const item = record(value);
  if (typeof item.uuid !== 'string' || typeof item.code !== 'string' || typeof item.name !== 'string' ||
    typeof item.remark !== 'string' || typeof item.isPublic !== 'boolean' || typeof item.enabled !== 'boolean' ||
    typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string' || !Array.isArray(item.items)) {
    throw new Error('字典类型响应格式异常');
  }
  return { ...item, items: item.items.map(parseItem) } as DictType;
}

function parseTypes(value: unknown): DictType[] {
  if (!Array.isArray(value)) throw new Error('字典列表响应格式异常');
  return value.map(parseType);
}

function parsePublicType(value: unknown): PublicDictType {
  const item = record(value);
  if (typeof item.code !== 'string' || typeof item.name !== 'string' || !Array.isArray(item.items)) {
    throw new Error('公开字典响应格式异常');
  }
  return { code: item.code, name: item.name, items: item.items.map(parseItem) };
}

function parsePublicTypes(value: unknown): Record<string, PublicDictType> {
  const data = record(value);
  return Object.fromEntries(Object.entries(data).map(([key, entry]) => [key, parsePublicType(entry)]));
}

export const getDictionaries = (): Promise<ApiResponse<DictType[]>> => request('/dictionaries', parseTypes);
export const createDictionary = (input: CreateDictTypeInput): Promise<ApiResponse<DictType>> =>
  request('/dictionaries', parseType, { method: 'POST', body: input });
export const createDictionaries = (items: CreateDictTypeInput[]): Promise<ApiResponse<DictType[]>> =>
  request('/dictionaries/batch', parseTypes, { method: 'POST', body: { items } });
export const updateDictionary = (uuid: string, input: UpdateDictTypeInput): Promise<ApiResponse<DictType>> =>
  request(`/dictionaries/${uuid}`, parseType, { method: 'PUT', body: input });
export const createDictionaryItem = (typeUuid: string, input: CreateDictItemInput): Promise<ApiResponse<DictItem>> =>
  request(`/dictionaries/${typeUuid}/items`, parseItem, { method: 'POST', body: input });
export const createDictionaryItems = (typeUuid: string, items: CreateDictItemInput[]): Promise<ApiResponse<DictItem[]>> =>
  request(`/dictionaries/${typeUuid}/items/batch`, (value) => {
    if (!Array.isArray(value)) throw new Error('字典子项列表响应格式异常');
    return value.map(parseItem);
  }, { method: 'POST', body: { items } });
export const updateDictionaryItem = (typeUuid: string, itemUuid: string, input: UpdateDictItemInput): Promise<ApiResponse<DictItem>> =>
  request(`/dictionaries/${typeUuid}/items/${itemUuid}`, parseItem, { method: 'PUT', body: input });
export const getPublicDictionaries = (codes: string[]): Promise<ApiResponse<Record<string, PublicDictType>>> =>
  request(`/dictionaries?codes=${encodeURIComponent(codes.join(','))}`, parsePublicTypes,
    { requiresAuth: false, baseUrl: getPublicApiBaseUrl() });

export const getDictionaryOptions = (codes: string[]): Promise<ApiResponse<Record<string, PublicDictType>>> =>
  request(`/dictionaries/options?codes=${encodeURIComponent(codes.join(','))}`, parsePublicTypes);
