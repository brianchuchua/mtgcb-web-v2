export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginData {
  userId: number;
}

export interface UserData {
  userId: number;
  username: string;
  email: string;
}
