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

export interface ConfigPackageImportResult {
  worksCount: number;
  sysConfigsCount: number;
  configsCount: number;
  menusCount: number;
  dictionariesCount: number;
  unlinkedFileRefs: number;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseConfigPackageImportResult(value: unknown): ConfigPackageImportResult {
  if (
    !isRecord(value) ||
    !isNonNegativeInt(value.worksCount) ||
    !isNonNegativeInt(value.sysConfigsCount) ||
    !isNonNegativeInt(value.configsCount) ||
    !isNonNegativeInt(value.menusCount) ||
    !isNonNegativeInt(value.dictionariesCount) ||
    !isNonNegativeInt(value.unlinkedFileRefs)
  ) {
    throw new Error('配置包导入响应格式异常');
  }
  return {
    worksCount: value.worksCount,
    sysConfigsCount: value.sysConfigsCount,
    configsCount: value.configsCount,
    menusCount: value.menusCount,
    dictionariesCount: value.dictionariesCount,
    unlinkedFileRefs: value.unlinkedFileRefs,
  };
}

export function getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
  return request('/system-status', parseSystemStatus);
}

export function createDatabaseBackup() {
  return downloadFile('/backups/database', `nodebase-${new Date().toISOString().slice(0, 10)}.sqlite.bak`, 'POST');
}

export function exportConfigPackage() {
  return downloadFile('/backups/config-package', `mysite-config-${new Date().toISOString().slice(0, 10)}.zip`, 'GET');
}

export function importConfigPackage(file: File): Promise<ApiResponse<ConfigPackageImportResult>> {
  return request('/backups/config-package/import', parseConfigPackageImportResult, {
    method: 'POST',
    rawBody: file,
    contentType: 'application/zip',
  });
}
