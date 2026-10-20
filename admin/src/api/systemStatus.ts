import { downloadFile, request } from './client';
import type { ApiResponse } from './types';

export interface SystemStatus {
  nodeVersion: string;
  uptimeSeconds: number;
  processMemoryBytes: number;
  systemMemoryTotalBytes: number;
  systemMemoryFreeBytes: number;
  cpuLoadPercent: number | null;
  databaseBytes: number;
  diskFreeBytes: number | null;
  sampledAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseSystemStatus(value: unknown): SystemStatus {
  if (!isRecord(value) || typeof value.nodeVersion !== 'string' ||
    !isNonNegativeNumber(value.uptimeSeconds) || !isNonNegativeNumber(value.processMemoryBytes) ||
    !isNonNegativeNumber(value.systemMemoryTotalBytes) || !isNonNegativeNumber(value.systemMemoryFreeBytes) ||
    (value.cpuLoadPercent !== null && !isNonNegativeNumber(value.cpuLoadPercent)) ||
    !isNonNegativeNumber(value.databaseBytes) ||
    (value.diskFreeBytes !== null && !isNonNegativeNumber(value.diskFreeBytes)) ||
    typeof value.sampledAt !== 'string') {
    throw new Error('服务器状态响应格式异常');
  }
  return {
    nodeVersion: value.nodeVersion,
    uptimeSeconds: value.uptimeSeconds,
    processMemoryBytes: value.processMemoryBytes,
    systemMemoryTotalBytes: value.systemMemoryTotalBytes,
    systemMemoryFreeBytes: value.systemMemoryFreeBytes,
    cpuLoadPercent: value.cpuLoadPercent,
    databaseBytes: value.databaseBytes,
    diskFreeBytes: value.diskFreeBytes,
    sampledAt: value.sampledAt,
  };
}

export function getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
  return request('/system-status', parseSystemStatus);
}

export function createDatabaseBackup() {
  return downloadFile('/backups/database', `nodebase-${new Date().toISOString().slice(0, 10)}.sqlite.bak`, 'POST');
}
