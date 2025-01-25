import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLogoutMutation, useMeQuery } from '@/api/auth/authApi';
import { clearAuth, setUser, startLoading } from '@/redux/slices/authSlice';
import type { RootState } from '@/redux/store';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const { data: meData, isLoading: isMeLoading, error: meError, isError: isMeError } = useMeQuery();

  const [logout] = useLogoutMutation();

  useEffect(() => {
    if (isMeLoading) {
      dispatch(startLoading());
    } else if (meData?.success && meData.data) {
      dispatch(setUser(meData.data));
    } else if (isMeError && meError) {
      const status = (meError as any)?.status;
      if (status === 401 || status === 403) {
        dispatch(clearAuth());
      }
    }
  }, [meData, isMeLoading, isMeError, meError, dispatch]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearAuth());
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = (newUser: typeof user) => {
    dispatch(setUser(newUser));
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isMeLoading,
    logout: handleLogout,
    updateUser,
  };
}
