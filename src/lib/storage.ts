import { apiJson } from "./api-client";

export interface AttachmentResult {
  url: string;
  name: string;
  path: string;
}

/**
 * Uploads a file to S3 via a presigned URL.
 * Returns the S3 key (path) as `url` — this is stored in the DB and served
 * through /api/files/view?key=... for display.
 */
export async function uploadAttachment(
  projectId: string,
  folder: "entries" | "budgetEntries",
  file: File,
  shareKey?: string
): Promise<AttachmentResult> {
  const { presignedUrl, key } = await apiJson<{ presignedUrl: string; key: string }>(
    "/api/upload",
    {
      method: "POST",
      body: JSON.stringify({
        projectId,
        folder,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        shareKey,
      }),
    }
  );

  // Upload directly to S3 — no auth header, just the presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!uploadRes.ok) throw new Error("S3 upload failed");

  return { url: key, name: file.name, path: key };
}

/** Deletes a previously uploaded attachment by its S3 key. */
export async function deleteAttachment(key: string): Promise<void> {
  await apiJson("/api/upload", {
    method: "DELETE",
    body: JSON.stringify({ key }),
  }).catch(() => {});
}

/**
 * Converts an S3 key (stored in DB) to a URL usable as an href.
 * Full https:// URLs are returned as-is for backwards compatibility.
 */
export function attachmentHref(keyOrUrl: string): string {
  if (keyOrUrl.startsWith("http")) return keyOrUrl;
  return `/api/files/view?key=${encodeURIComponent(keyOrUrl)}`;
}
