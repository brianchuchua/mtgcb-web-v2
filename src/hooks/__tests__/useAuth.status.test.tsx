import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import type { UserData } from '@/api/auth/types';
import { useAuth } from '@/hooks/useAuth';
import authReducer, { setUser } from '@/redux/slices/authSlice';

jest.mock('@/utils/sentryUser', () => ({ syncSentryUser: jest.fn() }));

interface MeQueryState {
  data?: { success: boolean; data?: UserData };
  isLoading: boolean;
  error?: unknown;
  isError: boolean;
}

let meQueryState: MeQueryState;
const mockLogout = jest.fn();

jest.mock('@/api/auth/authApi', () => ({
  useMeQuery: () => meQueryState,
  useLogoutMutation: () => [mockLogout],
}));

const user: UserData = { userId: 1337, username: 'manath', email: 'manath@example.com', isPublic: true };

const meIdle = (): MeQueryState => ({ data: undefined, isLoading: false, error: undefined, isError: false });
const meFailed = (error: unknown): MeQueryState => ({ data: undefined, isLoading: false, error, isError: true });

const renderSignedIn = () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(setUser(user));
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook(() => useAuth(), { wrapper });
  return { store, ...hook };
};

describe('useAuth reacts to /auth/me', () => {
  beforeEach(() => {
    meQueryState = meIdle();
    mockLogout.mockReset();
  });

  it('reports loading while /auth/me is in flight', () => {
    meQueryState = { ...meIdle(), isLoading: true };
    const { store, result } = renderSignedIn();
    expect(store.getState().auth.isLoading).toBe(true);
    expect(result.current.isLoading).toBe(true);
  });

  it('stores the user returned by a successful /auth/me', () => {
    const fresh = { ...user, username: 'renamed' };
    meQueryState = { ...meIdle(), data: { success: true, data: fresh } };
    const { store, result } = renderSignedIn();
    expect(store.getState().auth.user).toEqual(fresh);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it.each([401, 403])('signs the user out when /auth/me returns %i', (status) => {
    meQueryState = meFailed({ status, data: { success: false } });
    const { store, result } = renderSignedIn();
    expect(store.getState().auth).toEqual({ user: null, isAuthenticated: false, isLoading: false });
    expect(result.current.user).toBeNull();
  });

  it.each([
    ['a 500', { status: 500, data: { success: false } }],
    ['a network error', { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }],
    ['a timeout', { status: 'TIMEOUT_ERROR', error: 'timed out' }],
  ])('keeps the user signed in after %s and stops loading', (_label, error) => {
    meQueryState = meFailed(error);
    const { store, result } = renderSignedIn();
    expect(store.getState().auth).toEqual({ user, isAuthenticated: true, isLoading: false });
    expect(result.current.isLoading).toBe(false);
  });

  it('signs the user out when /auth/me starts failing with 401 later', () => {
    const { store, rerender } = renderSignedIn();
    expect(store.getState().auth.isAuthenticated).toBe(true);

    meQueryState = meFailed({ status: 401 });
    rerender();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});

describe('useAuth logout', () => {
  beforeEach(() => {
    meQueryState = meIdle();
    mockLogout.mockReset();
  });

  it('clears auth after the API confirms logout', async () => {
    mockLogout.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) });
    const { store, result } = renderSignedIn();

    await act(() => result.current.logout());

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('keeps the user signed in when the logout call fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLogout.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) });
    const { store, result } = renderSignedIn();

    await act(() => result.current.logout());

    expect(store.getState().auth.user).toEqual(user);
    consoleError.mockRestore();
  });

  it('updateUser replaces the stored user', () => {
    const { store, result } = renderSignedIn();
    act(() => result.current.updateUser({ ...user, isPublic: false }));
    expect(store.getState().auth.user?.isPublic).toBe(false);
  });
});
