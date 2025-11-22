import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AzureUser {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
}

interface AuthContextType {
  user: AzureUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AzureUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check Azure Static Web Apps authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/.auth/me');
        const data = await response.json();
        
        if (data.clientPrincipal) {
          setUser(data.clientPrincipal);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isAdmin = user?.userRoles?.includes('admin') || false;

  const login = () => {
    window.location.href = '/.auth/login/aad';
  };

  const logout = () => {
    window.location.href = '/.auth/logout';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
