export enum UserRole {
  SYSTEM_ADMIN = "system_admin",
  ADMIN = "admin",
}

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};
