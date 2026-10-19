import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { getSystemConfig, getWhitelistRules, updateSystemConfig } from '../../api/systemConfig';
import type { SystemConfig, SystemConfigUpdate } from '../../api/systemConfig';

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [draft, setDraft] = useState<SystemConfigUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSystemConfig();
      if (!result.success) {
        setError(result.msg);
        return;
      }
      setConfig(result.data);
      setDraft({
        requestLogMode: result.data.requestLogMode,
        consoleLogEnabled: result.data.consoleLogEnabled,
        consoleLogFormat: result.data.consoleLogFormat,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载系统配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateSystemConfig(draft);
      if (!result.success) {
        setError(result.msg);
        return;
      }
      setConfig(result.data);
      setDraft({
        requestLogMode: result.data.requestLogMode,
        consoleLogEnabled: result.data.consoleLogEnabled,
        consoleLogFormat: result.data.consoleLogFormat,
      });
      message.success('系统配置已保存');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存系统配置失败');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (value: Partial<SystemConfigUpdate>) => {
    setDraft((current) => current ? { ...current, ...value } : current);
  };

  const refreshWhitelist = async () => {
    try {
      const result = await getWhitelistRules();
      if (result.success) {
        setConfig((current) => current ? { ...current, requestLogWhitelist: result.data } : current);
      }
    } catch {
      // 白名单弹窗已单独展示读取错误；保留当前配置表单内容。
    }
  };

  return { config, draft, loading, saving, error, reload, save, updateDraft, refreshWhitelist };
}
