export async function track(kind: string, context?: string, userId?: string) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, context, userId }),
      keepalive: true,
    });
  } catch {}
}
