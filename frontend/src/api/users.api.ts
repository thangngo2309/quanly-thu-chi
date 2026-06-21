import type { AuthUser } from "@/features/auth/types/auth.types";
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserListResponse,
  UsersQueryParams,
} from "@/features/users/types/user.types";
import { api } from "./http";

export async function getUsers(
  params: UsersQueryParams
): Promise<UserListResponse> {
  const response = await api.get<UserListResponse>("/users", {
    params,
  });

  return response.data;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<AuthUser> {
  const response = await api.post<AuthUser>("/users", payload);

  return response.data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<AuthUser> {
  const response = await api.patch<AuthUser>(`/users/${id}`, payload);

  return response.data;
}

export async function resetUserPassword(
  id: string,
  password: string
): Promise<void> {
  await api.patch(`/users/${id}/password`, {
    password,
  });
}
