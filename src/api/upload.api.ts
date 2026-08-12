import { api } from "./client";

export interface PresignResult {
  uploadUrl: string;
  key: string;
  raw: Record<string, unknown>;
}

/** Step 1: ask the backend for a presigned S3 URL. */
export async function getPresignedUrl(file: File): Promise<PresignResult> {
  const { data } = await api.get<{ success: boolean; data: Record<string, unknown> }>("/upload", {
    params: { fileName: file.name, fileType: file.type },
  });

  const payload = (data.data ?? {}) as Record<string, unknown>;
  const uploadUrl =
    (payload["presignedUrl"] as string | undefined) ??
    (payload["uploadUrl"] as string | undefined) ??
    (payload["url"] as string | undefined);
  const key =
    (payload["key"] as string | undefined) ?? (payload["fileKey"] as string | undefined) ?? "";

  if (!uploadUrl) throw new Error("تعذر الحصول على رابط الرفع");
  return { uploadUrl, key, raw: payload };
}

/** Step 2: PUT the file straight to S3, reporting progress. */
export function uploadToS3(uploadUrl: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("فشل رفع الصورة، حاول تاني"));
    xhr.onerror = () => reject(new Error("تعذر الاتصال بالسيرفر"));
    xhr.send(file);
  });
}

/** Full two-step upload. Returns the storage key to send as avatar_key. */
export async function uploadCoverImage(file: File, onProgress: (percent: number) => void) {
  const presign = await getPresignedUrl(file);
  await uploadToS3(presign.uploadUrl, file, onProgress);
  return presign.key;
}