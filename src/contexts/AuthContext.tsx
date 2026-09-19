import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onIdTokenChanged, signOut as fbSignOut } from "firebase/auth";
import { auth } from '@/firebase';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/services/api';
import type { User } from '@/services/api';
import { Navigate } from 'react-router-dom';

// ==================== Types ====================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ==================== Context Creation ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== Provider Component ====================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires on sign-in, sign-out, AND silent token refresh.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        setUser(await getCurrentUser());   // GET /api/auth/me
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  /**
   * Fetch the current user from the API
   */
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      return await getCurrentUser();
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await fbSignOut(auth);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    const userData = await fetchUser();
    if (userData) {
      setUser(userData);
    }
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================== Custom Hook ====================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ==================== Protected Route Component ====================

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
