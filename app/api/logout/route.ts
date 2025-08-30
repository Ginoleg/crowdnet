// app/api/logout/route.ts

function clearCookieHeader() {
    // Kill the cookie immediately
    return `session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Secure`;
  }
  
  export async function POST() {
    return new Response(null, {
      status: 200,
      headers: { "Set-Cookie": clearCookieHeader() },
    });
  }
  
  export async function GET() {
    return new Response(null, {
      status: 200,
      headers: { "Set-Cookie": clearCookieHeader() },
    });
  }
  