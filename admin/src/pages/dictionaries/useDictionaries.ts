import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  createDictionaries, createDictionaryItems, getDictionaries, updateDictionary, updateDictionaryItem,
  type CreateDictItemInput, type CreateDictTypeInput, type DictType,
} from '../../api/dictionaries';
import { invalidateDictionary } from '../../dictionaries';

export function useDictionaries() {
  const [types, setTypes] = useState<DictType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const selectedType = pageTypes.find((type) => type.uuid === selectedId) ?? pageTypes[0] ?? null;

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
      setSelectedId((current) => current && result.data.some((type) => type.uuid === current)
        ? current : result.data[0]?.uuid ?? null);
      return result.data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载字典失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const runSave = async (operation: () => Promise<{ success: boolean; msg: string }>, codes: string[] = []): Promise<DictType[] | null> => {
    setSaving(true);
    setError(null);
    try {
      const result = await operation();
      if (!result.success) throw new Error(result.msg);
      codes.forEach(invalidateDictionary);
      const latest = await reload();
      message.success('字典已保存');
      return latest;
    } catch (cause) {
      const errorMessage = cause instanceof Error ? cause.message : '保存字典失败';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveTypes = async (inputs: CreateDictTypeInput[], current?: DictType): Promise<boolean> => {
    const first = inputs[0];
    if (!first) return false;
    const { code: _code, ...editable } = first;
    const latest = await runSave(
      () => current ? updateDictionary(current.uuid, editable) : createDictionaries(inputs),
      current ? [current.code] : inputs.map((input) => input.code),
    );
    if (latest && !current) {
      const index = latest.findIndex((type) => type.code === inputs[inputs.length - 1].code);
      if (index >= 0) {
        setSearchValue('');
        setPage(Math.ceil((index + 1) / pageSize));
        setSelectedId(latest[index].uuid);
      }
    }
    return latest !== null;
  };

  const saveItems = async (type: DictType, inputs: CreateDictItemInput[], currentItemId?: string): Promise<boolean> => {
    const first = inputs[0];
    if (!first) return false;
    const { value: _value, ...editable } = first;
    const latest = await runSave(() => currentItemId
      ? updateDictionaryItem(type.uuid, currentItemId, editable)
      : createDictionaryItems(type.uuid, inputs), [type.code]);
    return latest !== null;
  };

  return {
    types, selectedType, selectedId: selectedType?.uuid ?? null, setSelectedId,
    search, setSearch, currentPage, pageSize, filteredTypes, filteredTotal: filteredTypes.length,
    changePage, loading, saving, error, reload, saveTypes, saveItems,
  };
}
