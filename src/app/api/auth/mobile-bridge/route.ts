import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const target = searchParams.get('target') || '/';

  let safeTarget = '/';
  try {
    const baseUrl = new URL(request.url);
    const resolvedTarget = new URL(target, baseUrl);
    if (resolvedTarget.origin === baseUrl.origin) {
      safeTarget = `${resolvedTarget.pathname}${resolvedTarget.search}${resolvedTarget.hash}`;
    }
  } catch {
    safeTarget = '/';
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookieStore = await cookies();
  
  // Set the next-auth session token cookie
  cookieStore.set('next-auth.session-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60,
  });

  // Return HTML for a more reliable redirect in WebViews
  return new NextResponse(
    `<html>
      <body style="background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;color:white;">
        <div style="border:4px solid #3b82f6;border-top:4px solid transparent;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;"></div>
        <p style="margin-top:20px;font-weight:bold;letter-spacing:1px;font-size:14px;">MENYINKRONKAN SESI...</p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        <script>
          setTimeout(function() {
            window.location.href = ${JSON.stringify(safeTarget)};
          }, 500);
        </script>
      </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
