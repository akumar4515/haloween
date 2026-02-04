"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authData = localStorage.getItem("userAuth");
      if (authData) {
        const parsed = JSON.parse(authData);
        const storedToken = parsed.token;
        
        if (storedToken) {
          // Verify token with backend
          try {
            const res = await fetch(`${API_BASE}/auth/me`, {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            });

            if (res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                if (data.success && data.user) {
                  const userData = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    profile_pic: data.user.picture,
                  };
                  
                  setUser(userData);
                  setToken(storedToken);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (error) {
            console.error("Error verifying token:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    localStorage.setItem("userAuth", JSON.stringify({
      authenticated: true,
      token: authToken,
      user: userData,
      timestamp: Date.now(),
    }));
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem("userAuth");
    setUser(null);
    setToken(null);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        checkAuth,
        getAuthHeaders,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

