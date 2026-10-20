/** 列表 URL 只保存已提交的筛选条件。 */
export function readFilter(params: URLSearchParams, key: string, maxLength: number): string | undefined {
  return params.get(key)?.trim().slice(0, maxLength) || undefined;
}

export function writeFilter(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value?.trim()) params.set(key, value.trim());
  else params.delete(key);
}
