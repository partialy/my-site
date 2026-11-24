import { deflateRawSync, inflateRawSync } from 'node:zlib';

const LOCAL_FILE_HEADER_SIG = 0x04034b50;
const CENTRAL_DIR_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const UTF8_FLAG = 0x0800;
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;

const MAX_ENTRIES = 100;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getUTCFullYear()) - 1980;
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = Math.floor(date.getUTCSeconds() / 2);
  return {
    dosTime: (hours << 11) | (minutes << 5) | seconds,
    dosDate: (year << 9) | (month << 5) | day,
  };
}

export interface ZipEntryInput {
  name: string;
  content: Buffer | string;
}

/**
 * 构建标准 PKZIP 压缩包（支持 UTF-8 文件名与 DEFLATE 压缩）。
 */
export function createZip(entries: ZipEntryInput[], now = new Date()): Buffer {
  const { dosTime, dosDate } = toDosDateTime(now);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const normalizedName = entry.name.replace(/^\/+/, '');
    const nameBuf = Buffer.from(normalizedName, 'utf8');
    const rawBuf = typeof entry.content === 'string' ? Buffer.from(entry.content, 'utf8') : entry.content;
    const deflated = deflateRawSync(rawBuf);
    const useDeflate = deflated.length < rawBuf.length;
    const method = useDeflate ? METHOD_DEFLATE : METHOD_STORE;
    const payload = useDeflate ? deflated : rawBuf;
    const crc = crc32(rawBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIG, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(UTF8_FLAG, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(CENTRAL_DIR_SIG, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(UTF8_FLAG, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + payload.length;
  }

  const centralDirSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(EOCD_SIG, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

function findEndOfCentralDir(buffer: Buffer): number {
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
  for (let i = buffer.length - 22; i >= minOffset; i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error('无效的 ZIP 压缩包：未找到目录结束标记');
}

/**
 * 解析标准 PKZIP 压缩包（仅支持 STORE 与 DEFLATE，内置 Zip Bomb 上限保护）。
 */
export function parseZip(buffer: Buffer): Map<string, Buffer> {
  if (buffer.length < 22) {
    throw new Error('无效的 ZIP 压缩包：文件过小');
  }
  const eocdOffset = findEndOfCentralDir(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (entryCount > MAX_ENTRIES) {
    throw new Error(`ZIP 压缩包条目数超过限制（最多 ${MAX_ENTRIES} 个）`);
  }
  if (centralDirOffset + centralDirSize > eocdOffset) {
    throw new Error('无效的 ZIP 压缩包：中央目录偏移越界');
  }

  const entries = new Map<string, Buffer>();
  let cursor = centralDirOffset;
  let totalUncompressedBytes = 0;

  for (let i = 0; i < entryCount; i += 1) {
    if (cursor + 46 > eocdOffset || buffer.readUInt32LE(cursor) !== CENTRAL_DIR_SIG) {
      throw new Error('无效的 ZIP 压缩包：中央目录记录损坏');
    }
    const method = buffer.readUInt16LE(cursor + 10);
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLen = buffer.readUInt16LE(cursor + 28);
    const extraLen = buffer.readUInt16LE(cursor + 30);
    const commentLen = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);

    const nameStart = cursor + 46;
    if (nameStart + nameLen > eocdOffset) {
      throw new Error('无效的 ZIP 压缩包：文件名越界');
    }
    const name = buffer.toString('utf8', nameStart, nameStart + nameLen).replace(/^\/+/, '');
    cursor = nameStart + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue;

    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error('ZIP 压缩包解压体积超过 20MB 安全上限');
    }

    if (localHeaderOffset + 30 > centralDirOffset || buffer.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIG) {
      throw new Error(`无效的 ZIP 条目头：${name}`);
    }
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > centralDirOffset) {
      throw new Error(`ZIP 条目数据越界：${name}`);
    }

    const compressed = buffer.subarray(dataStart, dataEnd);
    let content: Buffer;
    if (method === METHOD_STORE) {
      content = Buffer.from(compressed);
    } else if (method === METHOD_DEFLATE) {
      content = inflateRawSync(compressed, { maxOutputLength: MAX_TOTAL_UNCOMPRESSED_BYTES });
    } else {
      throw new Error(`不支持的 ZIP 压缩方式 (${method})：${name}`);
    }

    if (content.length !== uncompressedSize || crc32(content) !== expectedCrc) {
      throw new Error(`ZIP 条目校验失败：${name}`);
    }
    entries.set(name, content);
  }

  return entries;
}
