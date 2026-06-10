export const WHAPI_URL = process.env.WHAPI_URL ?? "https://gate.whapi.cloud";
export const whapiConfigured = !!process.env.WHAPI_TOKEN;

export async function whapiPost(path: string, body: unknown): Promise<unknown> {
  if (!whapiConfigured) {
    return { skipped: true };
  }

  try {
    const res = await fetch(`${WHAPI_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHAPI_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return await res.json();
  } catch (error) {
    console.error(`[whapi] POST ${path} failed:`, error);
    throw error;
  }
}
