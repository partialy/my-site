import { useEffect, useState } from 'react';
import { Button, Card, Flex, Input, Select } from 'antd';
import { RotateCcw, Search } from 'lucide-react';

export interface CrudFilterField<TFilters> {
  key: keyof TFilters & string;
  kind: 'text' | 'select' | 'date' | 'datetime-local';
  placeholder: string;
  width?: number;
  maxLength?: number;
  inputMode?: 'text' | 'numeric';
  normalize?: (value: string) => string;
  options?: ReadonlyArray<{ label: string; value: string }>;
}

export interface CrudFilterBarProps<TFilters extends object> {
  fields: ReadonlyArray<CrudFilterField<TFilters>>;
  values: TFilters;
  defaultValues: TFilters;
  onSearch(values: TFilters, replace?: boolean): void;
  onReset(): void;
  debounceMs?: number;
}

/** 文本输入防抖提交；下拉筛选和查询按钮立即提交。 */
export function CrudFilterBar<TFilters extends object>({
  fields, values, defaultValues, onSearch, onReset, debounceMs = 400,
}: CrudFilterBarProps<TFilters>) {
  const [draft, setDraft] = useState(values);
  const [textDirty, setTextDirty] = useState(false);

  useEffect(() => {
    setDraft(values);
    setTextDirty(false);
  }, [values]);

  useEffect(() => {
    if (!textDirty) return;
    const timer = window.setTimeout(() => {
      onSearch(draft, true);
      setTextDirty(false);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, textDirty, onSearch, debounceMs]);

  const change = (key: keyof TFilters & string, value: string | undefined, immediate: boolean) => {
    const next = { ...draft, [key]: value } as TFilters;
    setDraft(next);
    setTextDirty(!immediate);
    if (immediate) onSearch(next);
  };

  return <Card style={{ marginBottom: 16, borderRadius: 16 }}>
    <Flex wrap="wrap" gap={12} align="center">
      {fields.map((field) => field.kind === 'select'
        ? <Select key={field.key} placeholder={field.placeholder} value={draft[field.key] as string | undefined}
            onChange={(value: string | undefined) => change(field.key, value, true)}
            options={field.options?.map((option) => ({ ...option }))} allowClear style={{ width: field.width ?? 160 }} />
        : field.kind === 'text'
        ? <Input key={field.key} placeholder={field.placeholder} value={String(draft[field.key] ?? '')}
            onChange={(event) => change(field.key, field.normalize?.(event.target.value) ?? event.target.value, false)}
            onPressEnter={() => { setTextDirty(false); onSearch(draft); }}
            maxLength={field.maxLength} inputMode={field.inputMode}
            allowClear style={{ width: field.width ?? 240 }} />
        : <Input key={field.key} type={field.kind} aria-label={field.placeholder}
            value={String(draft[field.key] ?? '')} onChange={(event) => {
              setDraft({ ...draft, [field.key]: event.target.value } as TFilters);
              setTextDirty(false);
            }} style={{ width: field.width ?? 180 }} />)}
      <Button type="primary" icon={<Search size={16} />} onClick={() => { setTextDirty(false); onSearch(draft); }}>查询</Button>
      <Button icon={<RotateCcw size={16} />} onClick={() => { setTextDirty(false); setDraft(defaultValues); onReset(); }}>重置</Button>
    </Flex>
  </Card>;
}
