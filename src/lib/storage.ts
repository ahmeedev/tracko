import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export interface AttachmentResult {
  url: string;
  name: string;
  path: string;
}

/**
 * Uploads a file to Firebase Storage under the given project path.
 * Returns the download URL, original filename, and storage path.
 */
export async function uploadAttachment(
  projectId: string,
  folder: "entries" | "budgetEntries",
  file: File
): Promise<AttachmentResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `projects/${projectId}/${folder}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name, path };
}

/** Deletes a previously uploaded attachment by its storage path. */
export async function deleteAttachment(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // Ignore if the file is already gone.
  }
}
