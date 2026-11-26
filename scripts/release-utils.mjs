import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..');
export const RELEASE_ROOT = path.join(ROOT_DIR, 'release');

/**
 * 在指定子项目目录下执行命令并检查退出码。
 */
export function runCommand(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...extraEnv },
  });

  if (result.error) {
    throw new Error(`执行命令失败 (${cwd}): ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`命令退出码异常 (${result.status}): ${command} ${args.join(' ')}`);
  }
}

/**
 * 校验模块目录存在；当 requireDeps 为 true 时同时检查 node_modules。
 */
export function ensureModuleReady(moduleName, { requireDeps = true } = {}) {
  const moduleDir = path.join(ROOT_DIR, moduleName);
  const pkgPath = path.join(moduleDir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`未找到模块配置: ${pkgPath}`);
  }
  if (requireDeps) {
    const nodeModulesPath = path.join(moduleDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error(`模块 ${moduleName} 尚未安装依赖，请先在 ${moduleName}/ 下执行 npm ci 或 npm install`);
    }
  }
  return moduleDir;
}

/**
 * 清理指定发布子目录，保留运行时数据目录（data/）与本地环境文件（.env）。
 */
export function prepareReleaseTarget(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const preservedNames = new Set(['data', '.env']);

  for (const entry of fs.readdirSync(targetDir)) {
    if (preservedNames.has(entry)) continue;
    fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(targetDir, 'data'), { recursive: true });
}

/**
 * 递归复制目录或文件，支持通过 filter 排除无需打包的路径。
 */
export function copyPath(src, dest, filter) {
  if (!fs.existsSync(src)) {
    throw new Error(`待复制源路径不存在: ${src}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true, filter });
}
