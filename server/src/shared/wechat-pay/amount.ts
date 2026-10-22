export function yuanToFen(value: number | string): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('支付金额必须大于 0');
  }
  return Math.round(amount * 100);
}

export function fenToYuan(value: number | string): string {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('金额分值不能小于 0');
  }
  return (amount / 100).toFixed(2);
}
