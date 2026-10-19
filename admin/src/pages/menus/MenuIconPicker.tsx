import { useState } from 'react';
import { Popover, Tooltip } from 'antd';
import { Ban, ChevronDown } from 'lucide-react';
import { MENU_ICON_OPTIONS, renderMenuIcon } from '../../menus/menuUtils';
import './MenuIconPicker.css';

interface Props {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export function MenuIconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const choose = (key: string | null) => {
    onChange?.(key);
    setOpen(false);
  };

  const content = <div className="menu-icon-picker" role="group" aria-label="选择菜单图标">
    {['', ...MENU_ICON_OPTIONS].map((key) => {
      const selected = (value ?? '') === key;
      const name = key || 'none';
      return <Tooltip title={name} key={key} mouseEnterDelay={0.35}>
        <button type="button" className={`menu-icon-option${selected ? ' is-selected' : ''}`}
          aria-label={name} aria-pressed={selected} onClick={() => choose(key || null)}>
          {key ? renderMenuIcon(key, 17) : <Ban size={17} />}
        </button>
      </Tooltip>;
    })}
  </div>;

  return <Popover content={content} trigger="click" placement="bottomLeft" arrow={false}
    open={open} onOpenChange={setOpen} styles={{ body: { padding: 8 } }}>
    <button type="button" className="menu-icon-trigger" aria-label="选择图标" aria-expanded={open}>
      {renderMenuIcon(value ?? null, 18) ?? <Ban size={18} />}
      <span>{value || 'none'}</span>
      <ChevronDown size={16} />
    </button>
  </Popover>;
}
