import { createContext, useContext, useState, useEffect } from 'react';

const DevModeContext = createContext();

export function DevModeProvider({ children }) {
  const [devUser, setDevUser] = useState(null);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const storedDevUser = localStorage.getItem('devModeUser');
    if (storedDevUser) {
      setDevUser(JSON.parse(storedDevUser));
      setIsDevMode(true);
    }
  }, []);

  // Listen for storage changes to update state when dev user changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedDevUser = localStorage.getItem('devModeUser');
      if (storedDevUser) {
        setDevUser(JSON.parse(storedDevUser));
        setIsDevMode(true);
      } else {
        setDevUser(null);
        setIsDevMode(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signOut = () => {
    localStorage.removeItem('devModeUser');
    setDevUser(null);
    setIsDevMode(false);
  };

  const signIn = (userData) => {
    localStorage.setItem('devModeUser', JSON.stringify(userData));
    setDevUser(userData);
    setIsDevMode(true);
  };

  const value = {
    devUser,
    isDevMode,
    signOut,
    signIn
  };

  return (
    <DevModeContext.Provider value={value}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}