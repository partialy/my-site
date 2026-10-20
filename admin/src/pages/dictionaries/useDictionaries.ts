import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  createDictionary, createDictionaryItem, getDictionaries, updateDictionary, updateDictionaryItem,
  type CreateDictItemInput, type CreateDictTypeInput, type DictType,
} from '../../api/dictionaries';
import { invalidateDictionary } from '../../dictionaries';

export function useDictionaries() {
  const [types, setTypes] = useState<DictType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredTypes = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    if (!keyword) return types;
    return types.filter((type) => [type.name, type.code, type.remark]
      .some((value) => value.toLocaleLowerCase().includes(keyword)));
  }, [search, types]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredTypes.length / pageSize)));
  const pageTypes = filteredTypes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedType = pageTypes.find((type) => type.id === selectedId) ?? pageTypes[0] ?? null;

  const setSearch = (value: string): void => {
    setSearchValue(value);
    setPage(1);
  };

  const changePage = (nextPage: number, nextPageSize: number): void => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  const reload = useCallback(async (): Promise<DictType[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDictionaries();
      if (!result.success) throw new Error(result.msg);
      setTypes(result.data);
      setSelectedId((current) => current && result.data.some((type) => type.id === current)
        ? current : result.data[0]?.id ?? null);
      return result.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载字典失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const runSave = async (operation: () => Promise<{ success: boolean; msg: string }>, code?: string): Promise<DictType[] | null> => {
    setSaving(true);
    setError(null);
    try {
      const result = await operation();
      if (!result.success) throw new Error(result.msg);
      if (code) invalidateDictionary(code);
      const latest = await reload();
      message.success('字典已保存');
      return latest;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存字典失败');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveType = async (input: CreateDictTypeInput, current?: DictType): Promise<boolean> => {
    const { code, ...editable } = input;
    const latest = await runSave(
      () => current ? updateDictionary(current.id, editable) : createDictionary(input),
      current?.code ?? input.code,
    );
    if (latest && !current) {
      const index = latest.findIndex((type) => type.code === code);
      if (index >= 0) {
        setSearchValue('');
        setPage(Math.ceil((index + 1) / pageSize));
        setSelectedId(latest[index].id);
      }
    }
    return latest !== null;
  };

  const saveItem = async (type: DictType, input: CreateDictItemInput, currentItemId?: number): Promise<boolean> => {
    const { value: _value, ...editable } = input;
    const latest = await runSave(() => currentItemId
      ? updateDictionaryItem(type.id, currentItemId, editable)
      : createDictionaryItem(type.id, input), type.code);
    return latest !== null;
  };

  return {
    types, selectedType, selectedId: selectedType?.id ?? null, setSelectedId,
    search, setSearch, currentPage, pageSize, filteredTypes, filteredTotal: filteredTypes.length,
    changePage, loading, saving, error, reload, saveType, saveItem,
  };
}
