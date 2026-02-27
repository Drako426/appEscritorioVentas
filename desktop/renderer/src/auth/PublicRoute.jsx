import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ROLES } from "./roles";

export default function PublicRoute({ children }) {

  const { user } = useAuth();

  // usuario ya logueado
  if (user) {
    if (user.role === ROLES.ADMIN) {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === ROLES.VENDEDOR) {
      return <Navigate to="/vendedor" replace />;
    }
  }

  return children;
}
