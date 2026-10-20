import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { App, Button, Space } from 'antd';

export interface CrudRowAction<TItem> {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  confirm?: { title: string; description?: string; okText?: string };
  onClick(item: TItem): void | Promise<void>;
}

export interface CrudRowActionsProps<TItem> {
  item: TItem;
  actions: ReadonlyArray<CrudRowAction<TItem>>;
}

/** 同一行同一时刻只执行一次操作；危险操作由 Ant Design 弹窗二次确认。 */
export function CrudRowActions<TItem>({ item, actions }: CrudRowActionsProps<TItem>) {
  const { modal, message } = App.useApp();
  const locked = useRef(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const unlock = () => {
    locked.current = false;
    setBusyKey(null);
  };

  const perform = async (action: CrudRowAction<TItem>, confirmed: boolean) => {
    setBusyKey(action.key);
    try {
      await action.onClick(item);
      unlock();
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '操作失败');
      // 确认弹窗失败时保持当前弹窗，允许在弹窗内重试或取消。
      if (!confirmed) unlock();
      throw cause;
    }
  };

  const click = (action: CrudRowAction<TItem>) => {
    if (locked.current) return;
    locked.current = true;
    if (!action.confirm) {
      void perform(action, false).catch(() => undefined);
      return;
    }
    setBusyKey(action.key);
    modal.confirm({
      title: action.confirm.title,
      content: action.confirm.description,
      okText: action.confirm.okText ?? '确定',
      okButtonProps: { danger: action.danger },
      cancelText: '取消',
      onOk: () => perform(action, true),
      onCancel: unlock,
    });
  };

  return <Space size={0}>
    {actions.map((action) => <Button key={action.key} type="link" size="small" danger={action.danger}
      icon={action.icon} loading={busyKey === action.key && !action.confirm}
      disabled={busyKey !== null && busyKey !== action.key} onClick={() => click(action)}>
      {action.label}
    </Button>)}
  </Space>;
}
