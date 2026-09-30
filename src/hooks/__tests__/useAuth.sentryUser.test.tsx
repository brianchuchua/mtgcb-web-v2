import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import type { UserData } from '@/api/auth/types';
import { useAuth } from '@/hooks/useAuth';
import authReducer, { clearAuth, setUser } from '@/redux/slices/authSlice';
import { syncSentryUser } from '@/utils/sentryUser';

jest.mock('@/utils/sentryUser', () => ({ syncSentryUser: jest.fn() }));
jest.mock('@/api/auth/authApi', () => ({
  useMeQuery: () => ({ data: undefined, isLoading: false, error: undefined, isError: false }),
  useLogoutMutation: () => [jest.fn()],
}));

const user: UserData = { userId: 1337, username: 'manath', email: 'manath@example.com', isPublic: true };

describe('useAuth keeps the Sentry user in sync', () => {
  const renderWithStore = () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    renderHook(() => useAuth(), { wrapper });
    return store;
  };

  beforeEach(() => {
    jest.mocked(syncSentryUser).mockClear();
  });

  it('sets the user id on login and clears it on logout', () => {
    const store = renderWithStore();
    expect(syncSentryUser).toHaveBeenLastCalledWith(undefined);

    act(() => {
      store.dispatch(setUser(user));
    });
    expect(syncSentryUser).toHaveBeenLastCalledWith(1337);

    act(() => {
      store.dispatch(clearAuth());
    });
    expect(syncSentryUser).toHaveBeenLastCalledWith(undefined);
  });

  it('does not resend the id when other profile fields change', () => {
    const store = renderWithStore();
    act(() => {
      store.dispatch(setUser(user));
    });
    const callsAfterLogin = jest.mocked(syncSentryUser).mock.calls.length;

    act(() => {
      store.dispatch(setUser({ ...user, isPublic: false }));
    });
    expect(jest.mocked(syncSentryUser).mock.calls.length).toBe(callsAfterLogin);
  });
});
