import { createContext, useContext, useState, useEffect } from "react";
import { authService, clearExpiredToken } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    clearExpiredToken();
    return localStorage.getItem("token");
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { access, token: altToken, user: userData } = response.data;
    const finalToken = access || altToken;

    localStorage.setItem("token", finalToken);
    localStorage.setItem("access", finalToken); // For compatibility with user's WebSocket requirements
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(finalToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
