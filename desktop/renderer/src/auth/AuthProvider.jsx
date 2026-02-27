import { useState } from "react";
import AuthContext from "./AuthContext";
import * as authService from "./auth.service";

export default function AuthProvider({ children }) {

  const [user, setUser] = useState(() =>
    authService.getUser()
  );

  /* ===== LOGIN ===== */
  const login = async (usuario, password) => {

    const data = await authService.login(usuario, password);

    // 🔥 NO reconstruir el objeto
    setUser(data);

    return data;
  };

  /* ===== LOGOUT ===== */
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
