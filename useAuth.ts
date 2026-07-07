import { useEffect, useState } from 'react';
import { useAuthStore } from '../utils/store';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        useAuthStore.setState({ user: parsedUser, token });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    logout,
  };
};
