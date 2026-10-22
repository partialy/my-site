import { useCallback } from 'react';
import { getUsers, registerUser, setUserStatus, updateUserProfile,
  type UserItem, type UserProfileInput, type UserRegisterInput, type UserStatus } from '../../api/users';
import { useTableQuery, type TableQueryOptions } from '../../hooks/useTableQuery';

export interface UserFilters {
  search?: string;
  status?: UserStatus;
}

const userTableOptions: TableQueryOptions<UserItem, UserFilters> = {
  defaultPageSize: 20,
  defaultFilters: {},
  filters: {
    read(params) {
      const search = params.get('search')?.trim().slice(0, 100) || undefined;
      const rawStatus = params.get('status');
      const status = rawStatus === 'active' || rawStatus === 'disabled' ? rawStatus : undefined;
      return { search, status };
    },
    write(params, filters) {
      if (filters.search?.trim()) params.set('search', filters.search.trim());
      else params.delete('search');
      if (filters.status) params.set('status', filters.status);
      else params.delete('status');
    },
  },
  fetchPage: (query, signal) => getUsers(query, signal),
};

export function useUsers() {
  const table = useTableQuery<UserItem, UserFilters>(userTableOptions);

  const register = useCallback(async (input: UserRegisterInput) => {
    const response = await registerUser(input);
    if (!response.success) throw new Error(response.msg);
    table.setFilters({});
    table.reload();
    return response.msg;
  }, [table.setFilters, table.reload]);

  const updateStatus = useCallback(async (uuid: string, status: UserStatus) => {
    const response = await setUserStatus(uuid, status);
    if (!response.success) throw new Error(response.msg);
    if (table.query.status) table.reload();
    else table.replaceItem((item) => item.uuid === uuid, response.data);
    return { item: response.data, message: response.msg };
  }, [table.query.status, table.reload, table.replaceItem]);

  const updateProfile = useCallback(async (uuid: string, input: UserProfileInput) => {
    const response = await updateUserProfile(uuid, input);
    if (!response.success) throw new Error(response.msg);
    table.reload();
    return { item: response.data, message: response.msg };
  }, [table.reload]);

  return { ...table, register, updateStatus, updateProfile };
}
