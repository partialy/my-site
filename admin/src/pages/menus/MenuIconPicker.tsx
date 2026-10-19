import { Ban } from 'lucide-react';
import { MENU_ICON_OPTIONS, renderMenuIcon } from '../../menus/menuUtils';
import './MenuIconPicker.css';

interface Props {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export function MenuIconPicker({ value, onChange }: Props) {
  const options = [{ value: '', label: '无图标' }, ...MENU_ICON_OPTIONS];

  return <div className="menu-icon-picker" role="group" aria-label="选择菜单图标">
    {options.map((option) => {
      const selected = (value ?? '') === option.value;
      return <button key={option.value} type="button" className={`menu-icon-option${selected ? ' is-selected' : ''}`}
        aria-pressed={selected} onClick={() => onChange?.(option.value || null)}>
        {option.value ? renderMenuIcon(option.value) : <Ban size={18} />}
        <span>{option.label}</span>
      </button>;
    })}
  </div>;
}
