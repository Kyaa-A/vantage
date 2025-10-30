import { supabase } from "./supabase";

export async function uploadMovFile(
  file: File,
  params: { assessmentId: string; responseId: string; section?: string }
): Promise<{ storagePath: string }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  // IMPORTANT: path passed to supabase.storage.from('movs').upload must be relative to the bucket root
  // Do not include the bucket name as part of the path
  const sectionSegment = params.section ? `${params.section}/` : "";
  const storagePath = `${params.assessmentId}/${params.responseId}/${sectionSegment}${Date.now()}-${sanitizedName}`;

  const { error } = await supabase.storage
    .from("movs")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return { storagePath };
}

export async function getSignedUrl(storagePath: string, expiresIn = 60) {
  const { data, error } = await supabase.storage
    .from("movs")
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteMovFile(storagePath: string) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from("movs").remove([storagePath]);
  if (error) {
    // Surface a consistent error to callers; they may still proceed to delete DB record
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}
