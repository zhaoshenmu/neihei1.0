/**
 * file-service.ts
 *
 * 文件读写服务
 * 使用 File System Access API 实现本地文件的保存和读取
 *
 * 功能：
 * 1. 书架快照的导出（.book 文件）和导入（手动操作）
 * 2. 书架数据自动同步到本地文件夹（一次授权，自动读写）
 *
 * 设计原则：
 * - 纯前端实现，不依赖 Node.js
 * - 用户选择一次本地文件夹后，后续自动同步
 * - .book 文件格式为 JSON，包含完整的书架快照数据
 * - 每本书存为一个独立的 .book 文件，文件夹里没有其他文件
 */
import type { BookSnapshot } from '@/store/bookshelf-store';

/** .book 文件格式版本 */
export const BOOK_FILE_VERSION = 1;

/** localStorage 中保存的文件夹句柄键名 */
const FOLDER_HANDLE_KEY = 'neihei-bookshelf-folder-handle';

/** .book 文件扩展名 */
const BOOK_EXT = '.book';

/** .book 文件的内容结构 */
export interface BookFile {
  formatVersion: number;
  exportedAt: string;
  book: BookSnapshot;
}

/** 书架文件夹的同步状态 */
export type FolderSyncStatus = 'disconnected' | 'connected' | 'syncing' | 'error';

/**
 * 模块级缓存：保存用户授权的文件夹句柄
 * 选择一次后，后续读写不再弹窗
 */
let cachedFolderHandle: FileSystemDirectoryHandle | null = null;

/**
 * 保存文件夹句柄标记到 localStorage
 */
function saveFolderHandleMarker() {
  localStorage.setItem(FOLDER_HANDLE_KEY, JSON.stringify({
    savedAt: Date.now(),
    version: 1,
  }));
}

/**
 * 清除保存的文件夹句柄标记
 */
function clearFolderHandleMarker() {
  localStorage.removeItem(FOLDER_HANDLE_KEY);
}

/**
 * 检查是否已配置本地文件夹同步
 */
export function hasBookshelfFolder(): boolean {
  return localStorage.getItem(FOLDER_HANDLE_KEY) !== null;
}

/**
 * 让用户选择书架数据保存的本地文件夹
 * 用户只需选择一次，后续自动同步
 *
 * @returns 是否成功选择文件夹
 */
export async function selectBookshelfFolder(): Promise<boolean> {
  try {
    if (!('showDirectoryPicker' in window)) {
      console.warn('[FileService] 当前浏览器不支持 showDirectoryPicker');
      return false;
    }

    const handle = await window.showDirectoryPicker({
      id: 'neihei-bookshelf',
      mode: 'readwrite',
    });

    // 验证权限：尝试创建/写入一个测试文件
    const testFileHandle = await handle.getFileHandle('.neihei-write-test', { create: true });
    const writable = await testFileHandle.createWritable();
    await writable.write('ok');
    await writable.close();
    // 清理测试文件
    await handle.removeEntry('.neihei-write-test');

    // 缓存句柄，后续读写不再弹窗
    cachedFolderHandle = handle;

    // 保存标记
    saveFolderHandleMarker();

    console.log('[FileService] 书架文件夹选择成功');
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('[FileService] 用户取消选择文件夹');
      return false;
    }
    console.error('[FileService] 选择文件夹失败:', error);
    return false;
  }
}

/**
 * 获取书架文件夹句柄
 * 优先使用缓存的句柄，如果没有则尝试重新获取权限
 */
async function getBookshelfFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  // 优先使用缓存的句柄
  if (cachedFolderHandle) {
    return cachedFolderHandle;
  }

  // 如果没有缓存，尝试重新获取（首次启动时）
  try {
    if (!('showDirectoryPicker' in window)) return null;

    const handle = await window.showDirectoryPicker({
      id: 'neihei-bookshelf',
      mode: 'readwrite',
    });

    // 缓存句柄
    cachedFolderHandle = handle;
    return handle;
  } catch {
    return null;
  }
}

/**
 * 将书架数据同步写入本地文件夹
 * 每本书存为一个独立的 .book 文件
 *
 * @param books 当前书架中的所有快照
 * @returns 是否同步成功
 */
export async function syncBooksToFolder(books: BookSnapshot[]): Promise<boolean> {
  try {
    const handle = await getBookshelfFolderHandle();
    if (!handle) {
      console.warn('[FileService] 未找到书架文件夹句柄，请先选择文件夹');
      return false;
    }

    // 先获取文件夹中已有的 .book 文件列表
    const existingFiles = new Set<string>();
    const entries = handle.values();
    for await (const entry of entries) {
      if (entry.kind === 'file' && entry.name.endsWith(BOOK_EXT)) {
        existingFiles.add(entry.name);
      }
    }

    // 写入每本书为独立 .book 文件
    for (const book of books) {
      const fileName = generateBookFileName(book);
      const fileContent: BookFile = {
        formatVersion: BOOK_FILE_VERSION,
        exportedAt: new Date().toISOString(),
        book,
      };

      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(fileContent, null, 2));
      await writable.close();

      existingFiles.delete(fileName);
    }

    // 删除不再存在的书的 .book 文件
    for (const staleFile of existingFiles) {
      try {
        await handle.removeEntry(staleFile);
        console.log(`[FileService] 删除过期文件: ${staleFile}`);
      } catch (err) {
        console.warn(`[FileService] 删除文件失败: ${staleFile}`, err);
      }
    }

    console.log(`[FileService] 同步成功: ${books.length} 本书`);
    return true;
  } catch (error) {
    console.error('[FileService] 同步失败:', error);
    return false;
  }
}

/**
 * 生成 .book 文件名
 * 格式：书名_时间戳.book
 */
function generateBookFileName(book: BookSnapshot): string {
  const safeName = book.name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 50);
  const timestamp = new Date(book.timestamp)
    .toISOString()
    .slice(0, 19)
    .replace(/[T:]/g, '-');
  return `${safeName}_${timestamp}${BOOK_EXT}`;
}

/**
 * 从本地文件夹加载书架数据
 * 扫描文件夹中所有 .book 文件
 *
 * @returns 书架快照列表，如果文件夹未配置或读取失败则返回 null
 */
export async function loadBooksFromFolder(): Promise<BookSnapshot[] | null> {
  try {
    const handle = await getBookshelfFolderHandle();
    if (!handle) return null;

    // 扫描文件夹中所有 .book 文件
    const books: BookSnapshot[] = [];
    const entries = handle.values();
    for await (const entry of entries) {
      if (entry.kind === 'file' && entry.name.endsWith(BOOK_EXT)) {
        try {
          const fileHandle = await handle.getFileHandle(entry.name);
          const file = await fileHandle.getFile();
          const text = await file.text();
          const fileContent: BookFile = JSON.parse(text);

          if (fileContent.book && fileContent.book.id && fileContent.book.name) {
            books.push(fileContent.book);
            console.log(`[FileService] 扫描到 .book 文件: ${entry.name} → "${fileContent.book.name}"`);
          }
        } catch (err) {
          console.warn(`[FileService] 跳过无效文件: ${entry.name}`, err);
        }
      }
    }

    console.log(`[FileService] 从文件夹扫描完成: ${books.length} 本书`);
    return books;
  } catch (error) {
    console.error('[FileService] 从文件夹加载失败:', error);
    return null;
  }
}

/**
 * 断开本地文件夹同步
 * 清除保存的文件夹权限标记和缓存的句柄
 */
export function disconnectBookshelfFolder() {
  clearFolderHandleMarker();
  cachedFolderHandle = null;
  console.log('[FileService] 已断开书架文件夹同步');
}

// ===== 以下为原有的手动导出/导入功能 =====

/**
 * 将书架快照导出为 .book 文件
 * 使用 File System Access API 让用户选择保存位置
 */
export async function exportBookToFile(book: BookSnapshot): Promise<boolean> {
  try {
    // 构建 .book 文件内容
    const fileContent: BookFile = {
      formatVersion: BOOK_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      book,
    };

    // 生成安全的文件名
    const safeName = book.name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 50);
    const timestamp = new Date(book.timestamp)
      .toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, '-');
    const suggestedName = `${safeName}_${timestamp}${BOOK_EXT}`;

    // 检查 File System Access API 是否可用
    if (!('showSaveFilePicker' in window)) {
      // 降级方案：使用下载链接
      return fallbackDownload(fileContent, suggestedName);
    }

    // 使用 File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: '书架文件',
          accept: { 'application/json': [BOOK_EXT] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(fileContent, null, 2));
    await writable.close();

    console.log(`[FileService] 导出成功: ${suggestedName}`);
    return true;
  } catch (error) {
    // 用户取消操作不算错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('[FileService] 用户取消导出');
      return false;
    }
    console.error('[FileService] 导出失败:', error);
    throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从 .book 文件导入书架快照
 * 使用 File System Access API 让用户选择文件
 */
export async function importBookFromFile(): Promise<BookSnapshot | null> {
  try {
    // 检查 File System Access API 是否可用
    if (!('showOpenFilePicker' in window)) {
      // 降级方案：使用文件输入
      return fallbackUpload();
    }

    // 使用 File System Access API
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: '书架文件',
          accept: { 'application/json': [BOOK_EXT] },
        },
      ],
      multiple: false,
    });

    const file = await handle.getFile();
    const text = await file.text();
    const fileContent: BookFile = JSON.parse(text);

    // 校验文件格式
    if (!fileContent.formatVersion || !fileContent.book) {
      throw new Error('无效的 .book 文件格式');
    }

    // 校验快照数据结构
    const book = fileContent.book;
    if (!book.id || !book.name || !book.timestamp || !book.canvas || !book.panelData || !book.flowState) {
      throw new Error('.book 文件数据不完整');
    }

    console.log(`[FileService] 导入成功: ${book.name}`);
    return book;
  } catch (error) {
    // 用户取消操作不算错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('[FileService] 用户取消导入');
      return null;
    }
    console.error('[FileService] 导入失败:', error);
    throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 降级方案：通过创建下载链接导出文件
 * 当 File System Access API 不可用时使用
 */
function fallbackDownload(content: BookFile, fileName: string): boolean {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`[FileService] 降级导出成功: ${fileName}`);
  return true;
}

/**
 * 降级方案：通过文件输入上传导入文件
 * 当 File System Access API 不可用时使用
 */
function fallbackUpload(): Promise<BookSnapshot | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = BOOK_EXT;
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const fileContent: BookFile = JSON.parse(text);

        if (!fileContent.formatVersion || !fileContent.book) {
          reject(new Error('无效的 .book 文件格式'));
          return;
        }

        const book = fileContent.book;
        if (!book.id || !book.name || !book.timestamp || !book.canvas || !book.panelData || !book.flowState) {
          reject(new Error('.book 文件数据不完整'));
          return;
        }

        console.log(`[FileService] 降级导入成功: ${book.name}`);
        resolve(book);
      } catch (error) {
        reject(new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    });

    input.addEventListener('cancel', () => {
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}
