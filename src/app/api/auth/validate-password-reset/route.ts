import { NextRequest, NextResponse } from 'next/server';
import { proxyPostToMtgcbApi } from '@/utils/server/mtgcbApiServer';

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body', code: 'BAD_REQUEST' } },
      { status: 400 },
    );
  }

  return proxyPostToMtgcbApi('/auth/validate-password-reset', {
    token: body.token,
    privateKey: process.env.MTGCB_API_PRIVATE_KEY,
  });
}
