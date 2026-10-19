import { useState } from 'react';
import { Input, Popover, Tooltip } from 'antd';
import { Ban, ChevronDown, Search } from 'lucide-react';
import { MENU_ICON_OPTIONS, renderMenuIcon } from '../../menus/menuUtils';
import { getMenuIconCategories } from '../../menus/menuIconCategories';
import './MenuIconPicker.css';

interface Props {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export function MenuIconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const choose = (key: string | null) => {
    onChange?.(key);
    setSearch('');
    setOpen(false);
  };

  const keyword = search.trim().toLowerCase().replace(/\s+/g, '-');
  const groups = getMenuIconCategories(MENU_ICON_OPTIONS).map((group) => ({
    ...group,
    keys: group.title.toLowerCase().includes(keyword) ? group.keys
      : group.keys.filter((key) => key.includes(keyword) || key.replace(/-/g, '').includes(keyword.replace(/-/g, ''))),
  })).filter((group) => group.keys.length > 0);
  const showNone = !keyword || 'none'.includes(keyword) || '无图标'.includes(keyword);

  const iconButton = (key: string) => {
    const selected = (value ?? '') === key;
    const name = key || 'none';
    return <Tooltip title={name} key={key} mouseEnterDelay={0.35}>
      <button type="button" className={`menu-icon-option${selected ? ' is-selected' : ''}`}
        aria-label={name} aria-pressed={selected} onClick={() => choose(key || null)}>
        {key ? renderMenuIcon(key, 17) : <Ban size={17} />}
      </button>
    </Tooltip>;
  };

  const content = <div className="menu-icon-picker" role="group" aria-label="选择菜单图标">
    <Input size="small" className="menu-icon-search" placeholder="搜索图标名称" aria-label="搜索图标名称"
      prefix={<Search size={14} />} value={search} onChange={(event) => setSearch(event.target.value)} allowClear />
    <div className="menu-icon-picker-list">
      {showNone && <section className="menu-icon-group">
        <div className="menu-icon-group-title">无图标</div>
        <div className="menu-icon-grid">{iconButton('')}</div>
      </section>}
      {groups.map((group) => <section className="menu-icon-group" key={group.title}>
        <div className="menu-icon-group-title">{group.title}</div>
        <div className="menu-icon-grid">{group.keys.map(iconButton)}</div>
      </section>)}
      {!showNone && groups.length === 0 && <div className="menu-icon-empty">没有匹配的图标</div>}
    </div>
  </div>;

  return <Popover content={content} trigger="click" placement="bottomLeft" arrow={false}
    open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch(''); }} styles={{ body: { padding: 8 } }}>
    <button type="button" className="menu-icon-trigger" aria-label="选择图标" aria-expanded={open}>
      {renderMenuIcon(value ?? null, 18) ?? <Ban size={18} />}
      <span>{value || 'none'}</span>
      <ChevronDown size={16} />
    </button>
  </Popover>;
}
