// lib/cookies.ts
export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}
export function clearCookie(name: string) {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
export function getCookie(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  return (
    header
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(name + "="))
      ?.split("=")[1] ?? null
  );
}
