import { Tag } from 'antd';
import { useDictionary } from './useDictionary';

interface DictTagProps {
  dict: string;
  value: string | number | null | undefined;
}

export function DictTag({ dict, value }: DictTagProps) {
  const { items } = useDictionary(dict);
  if (value === null || value === undefined || value === '') return <span>—</span>;
  const item = items.find((entry) => entry.value === String(value));
  return <Tag color={item?.color === 'default' ? undefined : item?.color}>{item?.label ?? String(value)}</Tag>;
}
