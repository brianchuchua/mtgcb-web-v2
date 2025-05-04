import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, email, recaptchaToken } = await request.json();

    // Call the actual API with the private key and recaptcha token
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        privateKey: process.env.MTGCB_API_PRIVATE_KEY,
        recaptchaToken,
      }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error,
        },
        { status: apiResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_SERVER_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
