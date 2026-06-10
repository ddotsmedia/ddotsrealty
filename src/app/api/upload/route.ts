import { auth } from "@/lib/auth";
import { getUploadUrl } from "@/server/services/r2.service";

export const runtime = "nodejs";

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s.-]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      filename: string;
      contentType: string;
      folder?: string;
    };

    const { filename, contentType, folder } = body;

    if (!filename || !contentType) {
      return new Response("Missing filename or contentType", { status: 400 });
    }

    const sanitized = sanitizeFilename(filename);
    const folderPath = folder ?? "uploads";
    const tenantId = (session.user as any).tenantId ?? "common"; // eslint-disable-line @typescript-eslint/no-explicit-any
    const key = `${folderPath}/${tenantId}/${Date.now()}-${sanitized}`;

    const result = await getUploadUrl(key, contentType);

    if (!result) {
      return Response.json({ configured: false }, { status: 200 });
    }

    return Response.json(
      {
        configured: true,
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        key,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
