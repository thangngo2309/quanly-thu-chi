"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import { HDropdown, HForm, HInput } from "@/components/form";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { type AuthUser, UserRole } from "@/features/auth/types/auth.types";
import { useResponsiveMode } from "@/hooks/use-responsive-mode";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDateVi } from "@/utils/date";

import type { UsersSearchValues } from "../types/user.types";
import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
} from "@/api/users.api";
import { HDataTable, HMobileList } from "@/components/datatable";
import { useToast } from "@/components/toast/ToastProvider";

const roleOptions = [
  {
    label: "System Admin",
    value: UserRole.SYSTEM_ADMIN,
  },
  {
    label: "Admin",
    value: UserRole.ADMIN,
  },
];

const statusOptions = [
  {
    label: "Đang hoạt động",
    value: "true",
  },
  {
    label: "Đã khóa",
    value: "false",
  },
];

const defaultSearchValues: UsersSearchValues = {
  q: "",
  role: "",
  isActive: "",
};

type UserFormValues = {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
  isActive: "true" | "false";
};

type PasswordFormValues = {
  password: string;
};

export function UsersManagement() {
  const router = useRouter();
  const toast = useToast();

  const { user: currentUser, loading: authLoading } = useAuth();

  const { mounted, isMobile } = useResponsiveMode();

  const searchMethods = useForm<UsersSearchValues>({
    defaultValues: defaultSearchValues,
  });

  const [users, setUsers] = useState<AuthUser[]>([]);

  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [rowCount, setRowCount] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<UsersSearchValues>({
    ...defaultSearchValues,
  });

  const [editorUser, setEditorUser] = useState<AuthUser | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);

  const [passwordUser, setPasswordUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!authLoading && currentUser?.role !== UserRole.SYSTEM_ADMIN) {
      router.replace("/");
    }
  }, [authLoading, currentUser, router]);

  const loadUsers = useCallback(async () => {
    if (currentUser?.role !== UserRole.SYSTEM_ADMIN) {
      return;
    }

    setLoading(true);

    try {
      const response = await getUsers({
        page: paginationModel.page + 1,

        limit: paginationModel.pageSize,

        q: filters.q || undefined,

        role: filters.role || undefined,

        isActive:
          filters.isActive === "" ? undefined : filters.isActive === "true",
      });

      setUsers(response.items);
      setRowCount(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải danh sách người dùng.")
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, paginationModel]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSearch: SubmitHandler<UsersSearchValues> = (values) => {
    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));

    setFilters({
      q: values.q.trim(),
      role: values.role,
      isActive: values.isActive,
    });
  };

  const handleResetSearch = (): void => {
    searchMethods.reset({
      ...defaultSearchValues,
    });

    setFilters({
      ...defaultSearchValues,
    });

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));
  };

  const handleToggleActive = async (target: AuthUser): Promise<void> => {
    try {
      await updateUser(target.id, {
        isActive: !target.isActive,
      });

      toast.success(
        target.isActive ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản."
      );

      await loadUsers();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật tài khoản."));
    }
  };

  const columns = useMemo<GridColDef<AuthUser>[]>(
    () => [
      {
        field: "fullName",
        headerName: "Họ và tên",
        minWidth: 190,
        flex: 1,
        sortable: false,
      },
      {
        field: "username",
        headerName: "Tên đăng nhập",
        minWidth: 160,
        flex: 0.8,
        sortable: false,
      },
      {
        field: "role",
        headerName: "Quyền",
        width: 150,
        sortable: false,

        renderCell: ({ row }) => (
          <Chip
            label={
              row.role === UserRole.SYSTEM_ADMIN ? "System Admin" : "Admin"
            }
            color={row.role === UserRole.SYSTEM_ADMIN ? "primary" : "default"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "isActive",
        headerName: "Trạng thái",
        width: 140,
        sortable: false,

        renderCell: ({ row }) => (
          <Chip
            label={row.isActive ? "Hoạt động" : "Đã khóa"}
            color={row.isActive ? "success" : "error"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "lastLoginAt",
        headerName: "Đăng nhập gần nhất",
        width: 170,
        sortable: false,

        renderCell: ({ row }) =>
          row.lastLoginAt ? formatDateVi(row.lastLoginAt) : "Chưa đăng nhập",
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 285,
        sortable: false,
        filterable: false,

        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setEditorUser(row);
                setEditorOpen(true);
              }}
            >
              Sửa
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => setPasswordUser(row)}
            >
              Mật khẩu
            </Button>

            <Button
              size="small"
              variant="outlined"
              color={row.isActive ? "error" : "success"}
              onClick={() => {
                void handleToggleActive(row);
              }}
            >
              {row.isActive ? "Khóa" : "Mở"}
            </Button>
          </Stack>
        ),
      },
    ],
    []
  );

  const searchContent = (
    <>
      <HInput<UsersSearchValues>
        name="q"
        label="Tên hoặc tài khoản"
        placeholder="Nhập từ khóa"
      />

      <HDropdown<UsersSearchValues>
        name="role"
        label="Quyền"
        placeholder="Tất cả quyền"
        options={roleOptions}
      />

      <HDropdown<UsersSearchValues>
        name="isActive"
        label="Trạng thái"
        placeholder="Tất cả trạng thái"
        options={statusOptions}
      />
    </>
  );

  const actions = (
    <Button
      variant="contained"
      onClick={() => {
        setEditorUser(null);
        setEditorOpen(true);
      }}
      sx={{
        minHeight: 44,
      }}
    >
      Tạo người dùng
    </Button>
  );

  if (authLoading || !mounted || currentUser?.role !== UserRole.SYSTEM_ADMIN) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "calc(100vh - 56px)",
        py: {
          xs: 1.5,
          md: 4,
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          px: {
            xs: 1.25,
            sm: 3,
          },
        }}
      >
        <Stack spacing={2}>
          {isMobile ? (
            <HMobileList<UsersSearchValues>
              title="Quản lý người dùng"
              description="Tạo tài khoản, phân quyền và khóa hoặc mở tài khoản."
              loading={loading}
              totalItems={rowCount}
              totalPages={totalPages}
              page={paginationModel.page}
              searchMethods={searchMethods}
              onSearch={handleSearch}
              searchContent={searchContent}
              onResetSearch={handleResetSearch}
              actions={actions}
              onRefresh={() => {
                void loadUsers();
              }}
              onPageChange={(page) => {
                setPaginationModel((current) => ({
                  ...current,
                  page,
                }));
              }}
            >
              <Stack spacing={1.25}>
                {users.map((item) => (
                  <Card
                    key={item.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      borderLeft: "4px solid",
                      borderLeftColor: item.isActive
                        ? "success.main"
                        : "error.main",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              fontSize: 17,
                            }}
                          >
                            {item.fullName}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            @{item.username}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={
                              item.role === UserRole.SYSTEM_ADMIN
                                ? "System Admin"
                                : "Admin"
                            }
                            size="small"
                            variant="outlined"
                          />

                          <Chip
                            label={item.isActive ? "Hoạt động" : "Đã khóa"}
                            size="small"
                            color={item.isActive ? "success" : "error"}
                            variant="outlined"
                          />
                        </Stack>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setEditorUser(item);
                              setEditorOpen(true);
                            }}
                          >
                            Chỉnh sửa
                          </Button>

                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => setPasswordUser(item)}
                          >
                            Đổi mật khẩu
                          </Button>

                          <Button
                            variant="outlined"
                            color={item.isActive ? "error" : "success"}
                            onClick={() => {
                              void handleToggleActive(item);
                            }}
                            sx={{
                              gridColumn: "1 / -1",
                            }}
                          >
                            {item.isActive
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"}
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </HMobileList>
          ) : (
            <HDataTable<AuthUser, UsersSearchValues>
              title="Quản lý người dùng"
              description="Chỉ system_admin được phép truy cập chức năng này."
              rows={users}
              columns={columns}
              rowCount={rowCount}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              searchMethods={searchMethods}
              onSearch={handleSearch}
              searchContent={searchContent}
              onResetSearch={handleResetSearch}
              actions={actions}
              onRefresh={() => {
                void loadUsers();
              }}
              height={570}
            />
          )}
        </Stack>
      </Container>

      <UserEditorDialog
        open={editorOpen}
        user={editorUser}
        onClose={() => setEditorOpen(false)}
        onSaved={async () => {
          setEditorOpen(false);
          toast.success(
            editorUser
              ? "Cập nhật người dùng thành công."
              : "Tạo người dùng thành công."
          );
          await loadUsers();
        }}
      />

      <ResetPasswordDialog
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
        onSaved={() => {
          setPasswordUser(null);
          toast.success("Đặt lại mật khẩu thành công.");
        }}
      />
    </Box>
  );
}

type UserEditorDialogProps = {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function UserEditorDialog({
  open,
  user,
  onClose,
  onSaved,
}: UserEditorDialogProps) {
  const toast = useToast();
  const methods = useForm<UserFormValues>({
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      role: UserRole.ADMIN,
      isActive: "true",
    },
  });

  const {
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
      password: "",
      role: user?.role ?? UserRole.ADMIN,
      isActive: user?.isActive === false ? "false" : "true",
    });
  }, [open, user, reset]);

  const handleSubmit: SubmitHandler<UserFormValues> = async (values) => {
    try {
      if (user) {
        await updateUser(user.id, {
          fullName: values.fullName.trim(),
          role: values.role,
          isActive: values.isActive === "true",
        });
      } else {
        await createUser({
          username: values.username.trim(),
          fullName: values.fullName.trim(),
          password: values.password,
          role: values.role,
        });
      }

      await onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu người dùng."));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>
        {user ? "Chỉnh sửa người dùng" : "Tạo người dùng"}
      </DialogTitle>

      <HForm methods={methods} onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {!user && (
              <HInput<UserFormValues>
                name="username"
                label="Tên đăng nhập"
                rules={{
                  required: "Vui lòng nhập tên đăng nhập",
                }}
              />
            )}

            <HInput<UserFormValues>
              name="fullName"
              label="Họ và tên"
              rules={{
                required: "Vui lòng nhập họ và tên",
              }}
            />

            {!user && (
              <HInput<UserFormValues>
                name="password"
                label="Mật khẩu"
                type="password"
                rules={{
                  required: "Vui lòng nhập mật khẩu",
                  minLength: {
                    value: 8,
                    message: "Mật khẩu phải có ít nhất 8 ký tự",
                  },
                }}
              />
            )}

            <HDropdown<UserFormValues>
              name="role"
              label="Quyền"
              options={roleOptions}
              rules={{
                required: "Vui lòng chọn quyền",
              }}
            />

            {user && (
              <HDropdown<UserFormValues>
                name="isActive"
                label="Trạng thái"
                options={statusOptions}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy
          </Button>

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </HForm>
    </Dialog>
  );
}

type ResetPasswordDialogProps = {
  user: AuthUser | null;
  onClose: () => void;
  onSaved: () => void;
};

function ResetPasswordDialog({
  user,
  onClose,
  onSaved,
}: ResetPasswordDialogProps) {
  const methods = useForm<PasswordFormValues>({
    defaultValues: {
      password: "",
    },
  });

  const {
    reset,
    formState: { isSubmitting },
  } = methods;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    reset({
      password: "",
    });

    setErrorMessage(null);
  }, [user, reset]);

  const handleSubmit: SubmitHandler<PasswordFormValues> = async (values) => {
    if (!user) {
      return;
    }

    setErrorMessage(null);

    try {
      await resetUserPassword(user.id, values.password);

      onSaved();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể đặt lại mật khẩu."));
    }
  };

  return (
    <Dialog
      open={Boolean(user)}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Đặt lại mật khẩu</DialogTitle>

      <HForm methods={methods} onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Tài khoản: <strong>{user?.username}</strong>
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <HInput<PasswordFormValues>
              name="password"
              label="Mật khẩu mới"
              type="password"
              rules={{
                required: "Vui lòng nhập mật khẩu mới",
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy
          </Button>

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Đặt lại mật khẩu
          </Button>
        </DialogActions>
      </HForm>
    </Dialog>
  );
}
