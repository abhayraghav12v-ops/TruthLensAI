import { createContext, useCallback, useContext, useState } from 'react';
import { USER_PROFILE } from '../constants/mockData';

const STORAGE_KEY = 'truthlens_user';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function buildUser({ name, email }) {
  return {
    ...USER_PROFILE,
    name,
    email,
    avatar: null,
    scansUsed: 0,
    joinedAt: new Date().toISOString().split('T')[0],
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => loadStoredUser());

  const setUser = useCallback((next) => {
    setUserState((prev) => {
      const updated = typeof next === 'function' ? next(prev) : next;
      persistUser(updated);
      return updated;
    });
  }, []);

  const signIn = async ({ name, email, password: _password }) => {
    await new Promise((r) => setTimeout(r, 800));
    const stored = loadStoredUser();
    if (stored?.email === email) {
      const sessionUser = name?.trim()
        ? { ...stored, name: name.trim() }
        : stored;
      setUser(sessionUser);
      return sessionUser;
    }
    const sessionUser = buildUser({ name: name?.trim() || email.split('@')[0], email });
    setUser(sessionUser);
    return sessionUser;
  };

  const signUp = async ({ name, email, password: _password }) => {
    await new Promise((r) => setTimeout(r, 800));
    const sessionUser = buildUser({ name: name.trim(), email });
    setUser(sessionUser);
    return sessionUser;
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, setUser, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
