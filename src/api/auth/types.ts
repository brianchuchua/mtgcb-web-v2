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
}