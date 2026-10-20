import { Switch } from 'antd';
import type { SwitchProps } from 'antd';

interface Props extends Omit<SwitchProps, 'checkedChildren' | 'unCheckedChildren'> {
  kind: 'visibility' | 'enabled';
}

export function DictionaryFormSwitch({ kind, checked, style, ...props }: Props) {
  const backgroundColor = checked ? '#10b981' : kind === 'visibility' ? '#2563eb' : undefined;

  return <Switch {...props} checked={checked}
    checkedChildren={kind === 'visibility' ? '公开' : '启用'}
    unCheckedChildren={kind === 'visibility' ? '后台' : '停用'}
    style={{ ...style, ...(backgroundColor ? { backgroundColor } : {}) }} />;
}
