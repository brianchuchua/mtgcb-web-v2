export interface LoginRequest {
  username: string;
  password: string;
  recaptchaToken: string;
}

export interface LoginData {
  userId: number;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  recaptchaToken: string;
}

export interface SignUpData {
  userId: number;
}

export interface UserData {
  userId: number;
  username: string;
  email: string;
  isPublic: boolean;
  showAsPatreonSupporter?: boolean;
  patreonCardId?: string | null;
  patreonCardColor?: 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless' | null;
}

export interface ForgotPasswordRequest {
  username: string;
  email: string;
  recaptchaToken: string;
}

export interface ForgotUsernameRequest {
  email: string;
  recaptchaToken: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  privateKey: string;
  token: string;
}

export interface ValidatePasswordResetRequest {
  privateKey: string;
  token: string;
}
