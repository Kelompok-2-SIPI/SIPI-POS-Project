import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.append(
    'Set-Cookie',
    `sipi_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
  );
  return response;
}
