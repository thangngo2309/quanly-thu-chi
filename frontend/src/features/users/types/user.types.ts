import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";
import type { PaginatedResponse } from "@/types/pagination";

export type UsersSearchValues = {
  q: string;
  role: "" | UserRole;
  isActive: "" | "true" | "false";
};

export type UsersQueryParams = {
  page: number;
  limit: number;
  q?: string;
  role?: UserRole;
  isActive?: boolean;
};

export type CreateUserPayload = {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
};

export type UpdateUserPayload = {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
};

export type UserListResponse = PaginatedResponse<AuthUser>;
