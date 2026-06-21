import { AuthUser, LoginPayload, LoginResponse } from "@/features/auth/types/auth.types";
import { api } from "./http";

export async function loginApi(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const response =
    await api.post<LoginResponse>(
      '/auth/login',
      payload,
    );

  return response.data;
}

export async function getMeApi():
  Promise<AuthUser> {
  const response =
    await api.get<AuthUser>(
      '/auth/me',
    );

  return response.data;
}