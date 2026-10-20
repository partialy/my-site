import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { useDictionary } from './useDictionary';

export interface DictSelectProps extends Omit<SelectProps<string>, 'options' | 'loading'> {
  dict: string;
}

export function DictSelect({ dict, placeholder = '请选择', ...props }: DictSelectProps) {
  const { items, loading } = useDictionary(dict);
  return (
    <Select<string>
      {...props}
      placeholder={placeholder}
      loading={loading}
      options={items.map((item) => ({ label: item.label, value: item.value }))}
    />
  );
}
