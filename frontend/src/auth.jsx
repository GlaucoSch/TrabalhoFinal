import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, clearToken, getToken, saveToken } from './api';

const AuthContext = createContext(null);
const USER_KEY = 'morada.user';

function storedSession() {
  const token = getToken();
  const user = window.localStorage.getItem(USER_KEY);
  if (!token || !user) return null;
  try {
    return { token, ...JSON.parse(user) };
  } catch {
    clearToken();
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(storedSession);

  useEffect(() => {
    const expire = () => {
      window.localStorage.removeItem(USER_KEY);
      setSession(null);
    };
    window.addEventListener('morada:session-expired', expire);
    return () => window.removeEventListener('morada:session-expired', expire);
  }, []);

  const value = useMemo(() => ({
    session,
    async login(email, senha) {
      const result = await api.post('/auth/login', { email, senha });
      if (!result?.token) throw new Error('A API não retornou um token de acesso.');
      const next = {
        tipo: String(result.tipo || 'USER').replace(/^ROLE_/i, '').toUpperCase(),
        email,
      };
      saveToken(result.token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(next));
      setSession({ token: result.token, ...next });
      return next;
    },
    logout() {
      clearToken();
      window.localStorage.removeItem(USER_KEY);
      setSession(null);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}

export function ProtectedRoute({ roles, children }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(session.tipo)) return <Navigate to="/acesso-negado" replace />;
  return children;
}
