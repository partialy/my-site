import os from 'node:os';
import { stat, statfs } from 'node:fs/promises';
import path from 'node:path';
import type Database from 'better-sqlite3';

interface CpuSample { idle: number; total: number }

function sampleCpu(): CpuSample {
  return os.cpus().reduce((sample, cpu) => {
    sample.idle += cpu.times.idle;
    sample.total += Object.values(cpu.times).reduce((total, value) => total + value, 0);
    return sample;
  }, { idle: 0, total: 0 });
}

export class SystemStatusService {
  private previousCpu = sampleCpu();
  private cached: { at: number; value: Awaited<ReturnType<SystemStatusService['collect']>> } | null = null;

  constructor(private readonly db: Database.Database, private readonly databasePath: string) {}

  isReady(): boolean {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  async get() {
    if (this.cached && Date.now() - this.cached.at < 5000) return this.cached.value;
    const value = await this.collect();
    this.cached = { at: Date.now(), value };
    return value;
  }

  private async collect() {
    const currentCpu = sampleCpu();
    const total = currentCpu.total - this.previousCpu.total;
    const idle = currentCpu.idle - this.previousCpu.idle;
    this.previousCpu = currentCpu;
    const cpuLoadPercent = total > 0 ? Math.round((1 - idle / total) * 1000) / 10 : null;
    const databaseBytes = await stat(this.databasePath).then((item) => item.size).catch(() => 0);
    const diskFreeBytes = await statfs(path.dirname(this.databasePath))
      .then((item) => item.bavail * item.bsize).catch(() => null);
    return {
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      processMemoryBytes: process.memoryUsage().rss,
      systemMemoryTotalBytes: os.totalmem(),
      systemMemoryFreeBytes: os.freemem(),
      cpuLoadPercent,
      databaseBytes,
      diskFreeBytes,
      sampledAt: new Date().toISOString(),
    };
  }
}
