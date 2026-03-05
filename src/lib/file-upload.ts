import { ALLOWED_FILE_EXTENSIONS } from "@/lib/constants";
import { UploadedFileMeta } from "@/types/legacy-loop";

export function hasAllowedExtension(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export function inferTypeFromName(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".md")) return "text/markdown";
  if (lowerName.endsWith(".json")) return "application/json";
  return "text/plain";
}

export function extractUploadedFileMeta(files: File[]): {
  accepted: UploadedFileMeta[];
  rejectedCount: number;
} {
  const accepted = files
    .filter((file) => hasAllowedExtension(file.name))
    .map((file) => ({
      name: file.name,
      type: file.type || inferTypeFromName(file.name),
    }));

  return {
    accepted,
    rejectedCount: files.length - accepted.length,
  };
}

export function mergeUploadedFiles(
  current: UploadedFileMeta[],
  incoming: UploadedFileMeta[],
): UploadedFileMeta[] {
  const next = [...current];
  for (const file of incoming) {
    const exists = next.some(
      (existing) => existing.name === file.name && existing.type === file.type,
    );
    if (!exists) next.push(file);
  }
  return next;
}
