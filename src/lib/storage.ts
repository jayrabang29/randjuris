import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export interface StoredFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
}

export async function ensureUploadDir(): Promise<string> {
  const uploadPath = path.resolve(process.cwd(), UPLOAD_DIR);
  await mkdir(uploadPath, { recursive: true });
  return uploadPath;
}

export async function storeFile(
  file: File,
  subDir?: string
): Promise<StoredFile> {
  const uploadPath = await ensureUploadDir();
  const targetDir = subDir ? path.join(uploadPath, subDir) : uploadPath;
  await mkdir(targetDir, { recursive: true });

  const ext = path.extname(file.name);
  const uniqueName = `${uuidv4()}${ext}`;
  const filePath = path.join(targetDir, uniqueName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const relativePath = subDir
    ? path.join(UPLOAD_DIR, subDir, uniqueName)
    : path.join(UPLOAD_DIR, uniqueName);

  return {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    storageUrl: relativePath.replace(/\\/g, "/"),
  };
}

export async function readStoredFile(storageUrl: string): Promise<Buffer> {
  const filePath = path.resolve(process.cwd(), storageUrl);
  return readFile(filePath);
}

export async function deleteStoredFile(storageUrl: string): Promise<void> {
  const filePath = path.resolve(process.cwd(), storageUrl);
  try {
    await unlink(filePath);
  } catch {
    // File may already be deleted
  }
}

export function getAbsolutePath(storageUrl: string): string {
  return path.resolve(process.cwd(), storageUrl);
}

// Abstraction layer for future S3 migration
export interface StorageProvider {
  store(file: File, subDir?: string): Promise<StoredFile>;
  read(storageUrl: string): Promise<Buffer>;
  delete(storageUrl: string): Promise<void>;
}

export const localStorageProvider: StorageProvider = {
  store: storeFile,
  read: readStoredFile,
  delete: deleteStoredFile,
};

export const storage = localStorageProvider;
