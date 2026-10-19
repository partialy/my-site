import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { createConfig, deleteConfig, getConfigs, updateConfig } from '../../api/configs';
import type { ConfigInput, ConfigItem } from '../../api/configs';

export function useConfigs() {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getConfigs();
      if (!result.success) throw new Error(result.msg);
      setItems(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const save = async (input: ConfigInput, originalKey?: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const result = originalKey ? await updateConfig(originalKey, input) : await createConfig(input);
      if (!result.success) throw new Error(result.msg);
      await reload();
      message.success(originalKey ? '配置已更新' : '配置已添加');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存配置失败');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (key: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const result = await deleteConfig(key);
      if (!result.success) throw new Error(result.msg);
      setItems((current) => current.filter((item) => item.key !== key));
      message.success('配置已删除');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除配置失败');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { items, loading, saving, error, reload, save, remove };
}
