import { NextRequest, NextResponse } from 'next/server';
import { proxyPostToMtgcbApi } from '@/utils/server/mtgcbApiServer';

export async function POST(request: NextRequest) {
  let body: { email?: string; recaptchaToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body', code: 'BAD_REQUEST' } },
      { status: 400 },
    );
  }

  return proxyPostToMtgcbApi('/auth/forgot-username', {
    email: body.email,
    privateKey: process.env.MTGCB_API_PRIVATE_KEY,
    recaptchaToken: body.recaptchaToken,
  });
}
