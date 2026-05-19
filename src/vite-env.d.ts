/// <reference types="vite/client" />

/**
 * File System Access API 类型声明
 * 用于书架快照的本地文件导入/导出
 */
interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | Blob | ArrayBuffer | ArrayBufferView): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  queryPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
  values(): AsyncIterableIterator<FileSystemDirectoryEntry>;
}

interface FileSystemDirectoryEntry {
  kind: 'file' | 'directory';
  name: string;
}

interface Window {
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
  showDirectoryPicker(options?: { id?: string; mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

interface OpenFilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
}
