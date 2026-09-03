'use client';

import React, { createContext, useContext, useState } from 'react';

interface NavContextType {
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const NavContext = createContext<NavContextType>({
  mobileMenuOpen: false,
  toggleMobileMenu: () => {},
  closeMobileMenu: () => {},
});

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <NavContext.Provider value={{ mobileMenuOpen, toggleMobileMenu, closeMobileMenu }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
