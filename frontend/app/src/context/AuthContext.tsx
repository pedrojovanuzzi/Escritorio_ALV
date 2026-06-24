import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import api from "../api/api";
import { UserData } from "../types";

interface AuthContextType {
  user: UserData | null;
  loginIn: (userData: UserData) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loginIn: () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loginIn = useCallback((userData: UserData) => {
    setUser(userData);
    Cookies.set("user", JSON.stringify(userData.token), { expires: 1 / 3 });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    Cookies.remove("user");
  }, []);

  // Revalida o token salvo ao iniciar / dar F5.
  useEffect(() => {
    const initAuth = async () => {
      const saved = Cookies.get("user");
      let token = "";
      if (saved) {
        try {
          token = JSON.parse(saved);
        } catch {
          Cookies.remove("user");
        }
      }

      if (token) {
        try {
          const res = await api.post("/auth/validate");
          if (res.status === 200) {
            setUser({ ...res.data.user, token });
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginIn, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
