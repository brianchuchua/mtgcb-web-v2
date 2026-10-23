import { UserData } from '@/api/auth/types';
import authReducer, { clearAuth, setUser, startLoading, stopLoading } from '@/redux/slices/authSlice';

const USER: UserData = { userId: 1337, username: 'Manath', email: 'm@example.com', isPublic: true };

const initial = () => authReducer(undefined, { type: '@@INIT' });

describe('authSlice', () => {
  it('starts logged out and loading', () => {
    expect(initial()).toEqual({ user: null, isAuthenticated: false, isLoading: true });
  });

  it('setUser stores the user, marks authenticated and stops loading', () => {
    expect(authReducer(initial(), setUser(USER))).toEqual({ user: USER, isAuthenticated: true, isLoading: false });
  });

  it('setUser(null) marks unauthenticated and stops loading', () => {
    const loggedIn = authReducer(initial(), setUser(USER));

    expect(authReducer(loggedIn, setUser(null))).toEqual({ user: null, isAuthenticated: false, isLoading: false });
  });

  it('startLoading and stopLoading only touch isLoading', () => {
    const loggedIn = authReducer(initial(), setUser(USER));
    const loading = authReducer(loggedIn, startLoading());

    expect(loading).toEqual({ user: USER, isAuthenticated: true, isLoading: true });
    expect(authReducer(loading, stopLoading())).toEqual({ user: USER, isAuthenticated: true, isLoading: false });
  });

  it('clearAuth logs out and stops loading', () => {
    const loading = authReducer(authReducer(initial(), setUser(USER)), startLoading());

    expect(authReducer(loading, clearAuth())).toEqual({ user: null, isAuthenticated: false, isLoading: false });
  });
});
