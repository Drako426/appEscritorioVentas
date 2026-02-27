import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ roles, children }) {

  const { user } = useAuth();

  // no logueado
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // rol no permitido
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}
