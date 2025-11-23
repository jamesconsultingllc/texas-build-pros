import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { telemetry } from '@/lib/telemetry';

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
        telemetry.trackTrace('Checking authentication status', 1);

        const response = await fetch('/.auth/me');
        const data = await response.json();
        
        if (data.clientPrincipal) {
          setUser(data.clientPrincipal);
          
          // Set user context in Application Insights
          telemetry.setUser(
            data.clientPrincipal.userId,
            data.clientPrincipal.userDetails
          );
          
          // Track successful authentication
          telemetry.trackEvent('User_Authenticated', {
            identityProvider: data.clientPrincipal.identityProvider,
            roles: data.clientPrincipal.userRoles.join(','),
            timestamp: new Date().toISOString(),
          });

          console.log('✅ User authenticated:', data.clientPrincipal.userDetails);
        } else {
          telemetry.trackTrace('User not authenticated', 1);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        telemetry.trackError(error as Error, {
          context: 'AuthCheck',
          location: window.location.href,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isAdmin = user?.userRoles?.includes('admin') || false;

  const login = () => {
    telemetry.trackUserAction('Login_Initiated', {
      from: window.location.href,
    });
    window.location.href = '/.auth/login/aad';
  };

  const logout = () => {
    telemetry.trackEvent('User_Logout', {
      userId: user?.userId || 'unknown',
      timestamp: new Date().toISOString(),
    });
    
    // Clear user context
    telemetry.clearUser();
    
    console.log('👋 User logged out');
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
