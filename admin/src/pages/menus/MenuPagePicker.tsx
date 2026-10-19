import { Select, Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { MenuItem } from '../../api/menus';
import { PAGE_REGISTRY, type PageRecord } from '../../router/pageRegistry';

interface Props {
  value?: string | null;
  onChange?: (path: string) => void;
  items: MenuItem[];
  editingKey?: string;
  onPageSelect: (page: PageRecord) => void;
}

interface PageOption {
  value: string;
  label: ReactNode;
  searchText: string;
  disabled: boolean;
}

export function MenuPagePicker({ value, onChange, items, editingKey, onPageSelect }: Props) {
  const pages = PAGE_REGISTRY.filter((page) => page.menuSelectable);
  const isUsed = (page: PageRecord) => items.some((item) =>
    item.type === 'route' && item.path === page.path && item.key !== editingKey);
  const toOption = (page: PageRecord) => ({
    value: page.path,
    label: <Space size={8}>
      <span>{page.name}</span>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{page.path}</Typography.Text>
      {page.defaultMenu && <Tag style={{ margin: 0 }}>默认</Tag>}
      {isUsed(page) && <Tag color="default" style={{ margin: 0 }}>已添加</Tag>}
    </Space>,
    searchText: `${page.name} ${page.path} ${page.defaultKey}`,
    disabled: isUsed(page),
  });
  const available = pages.filter((page) => !isUsed(page));
  const used = pages.filter(isUsed);
  const options: { label: string; options: PageOption[] }[] = [
    { label: `未添加页面（${available.length}）`, options: available.map(toOption) },
    { label: `已添加页面（${used.length}）`, options: used.map(toOption) },
  ];
  if (value && !pages.some((page) => page.path === value)) {
    options.push({ label: '旧菜单路径', options: [{ value, label: value, searchText: value, disabled: false }] });
  }

  return <Select
    value={value || undefined}
    placeholder="选择已开发页面"
    showSearch
    options={options}
    filterOption={(search, option) => String((option as PageOption | undefined)?.searchText ?? '').toLowerCase().includes(search.toLowerCase())}
    onChange={(path) => {
      onChange?.(path);
      const page = pages.find((entry) => entry.path === path);
      if (page) onPageSelect(page);
    }}
  />;
}
