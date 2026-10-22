import type { DictItem, DictType } from '../../api/dictionaries';

export type ExportLanguage = 'ts' | 'java';
export type ExportMode = 'single' | 'multiple';

export interface GeneratedFile {
  name: string;
  content: string;
}

const pascalCase = (value: string): string => {
  const words = value.replace(/([a-z\d])([A-Z])/g, '$1_$2').split(/[_-]+/).filter(Boolean);
  const name = words.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join('');
  return /^\d/.test(name) ? `Value${name}` : name;
};

const camelCase = (value: string): string => {
  const name = pascalCase(value);
  return name[0].toLowerCase() + name.slice(1);
};

const enumKey = (value: string): string => {
  const words = value.replace(/([a-z\d])([A-Z])/g, '$1_$2').split(/[_-]+/).filter(Boolean);
  const name = words.map((word) => word.toUpperCase()).join('_');
  return /^\d/.test(name) ? `VALUE_${name}` : name;
};

const comment = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim();

function assertUnique(entries: { source: string; name: string }[], scope: string): void {
  const names = new Map<string, string>();
  for (const { source, name } of entries) {
    const existing = names.get(name);
    if (existing) throw new Error(`${scope}「${existing}」与「${source}」生成的代码名称相同，请调整标识或分开导出`);
    names.set(name, source);
  }
}

function itemsFor(type: DictType): DictItem[] {
  return [...type.items].sort((a, b) => a.sort - b.sort || a.uuid.localeCompare(b.uuid));
}

function typescriptType(type: DictType): string {
  const name = pascalCase(type.code);
  const items = itemsFor(type);
  assertUnique(items.map((item) => ({ source: item.value, name: pascalCase(item.value) })), `${type.name}的子项`);
  const members = items.map((item) =>
    `  ${pascalCase(item.value)}: ${JSON.stringify(item.value)}, // ${comment(item.label)}${item.enabled ? '' : '（已停用）'}`);
  return [
    `// ${comment(type.name)}（${type.code}）`,
    `export const ${name} = {`,
    ...members,
    '} as const;',
    `export type ${name} = (typeof ${name})[keyof typeof ${name}];`,
  ].join('\n');
}

function javaType(type: DictType, nested: boolean): string {
  const name = pascalCase(type.code);
  const items = itemsFor(type);
  assertUnique(items.map((item) => ({ source: item.value, name: enumKey(item.value) })), `${type.name}的子项`);
  const indent = nested ? '    ' : '';
  const members = items.map((item, index) =>
    `${indent}    ${enumKey(item.value)}(${JSON.stringify(item.value)})${index === items.length - 1 ? ';' : ','} // ${comment(item.label)}${item.enabled ? '' : '（已停用）'}`);
  return [
    `${indent}// ${comment(type.name)}（${type.code}）`,
    `${indent}public enum ${name} {`,
    ...(members.length ? members : [`${indent}    ;`]),
    '',
    `${indent}    private final String value;`,
    `${indent}    ${name}(String value) { this.value = value; }`,
    `${indent}    public String getValue() { return value; }`,
    `${indent}}`,
  ].join('\n');
}

export function generatedFileName(type: DictType, language: ExportLanguage): string {
  return `${language === 'ts' ? camelCase(type.code) : pascalCase(type.code)}.${language}`;
}

export function generateDictionaryFiles(
  types: DictType[], language: ExportLanguage, mode: ExportMode, fileName: string,
): GeneratedFile[] {
  if (types.length === 0) throw new Error('请至少选择一个字典类型');
  const classNames = types.map((type) => ({ source: type.code, name: pascalCase(type.code) }));
  assertUnique(classNames, '字典类型');
  if (mode === 'multiple') {
    return types.map((type) => ({
      name: generatedFileName(type, language),
      content: `${language === 'ts' ? typescriptType(type) : javaType(type, false)}\n`,
    }));
  }
  if (language === 'ts') {
    return [{ name: `${fileName}.ts`, content: `${types.map(typescriptType).join('\n\n')}\n` }];
  }
  const outerClass = pascalCase(fileName);
  if (classNames.some((entry) => entry.name === outerClass)) {
    throw new Error(`文件名称与字典类型生成的 Java 类名「${outerClass}」重复`);
  }
  return [{
    name: `${outerClass}.java`,
    content: [
      `public final class ${outerClass} {`,
      `    private ${outerClass}() {}`, '',
      types.map((type) => javaType(type, true)).join('\n\n'),
      '}', '',
    ].join('\n'),
  }];
}
