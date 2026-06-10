import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  r2,
  r2Configured,
  R2_BUCKET,
  R2_PUBLIC_URL,
} from "@/lib/r2";

export function publicUrl(key: string): string {
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

export async function getUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  if (!r2Configured || !r2) {
    return null;
  }

  try {
    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 600 });
    return {
      uploadUrl,
      publicUrl: publicUrl(key),
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (!r2Configured || !r2) {
    return;
  }

  try {
    const cmd = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    await r2.send(cmd);
  } catch (error) {
    console.error("Error deleting object:", error);
    // Ignore errors during deletion
  }
}
