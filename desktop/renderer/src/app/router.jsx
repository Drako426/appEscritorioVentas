import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "@/auth/ProtectedRoute";
import PublicRoute from "@/auth/PublicRoute";
import { ROLES } from "@/auth/roles";

// layout
import Layout from "@/components/layout/Layout";

// auth
import Login from "@/auth/Login";

// dashboard
import DashboardHome from "@/features/dashboard/pages/DashboardHome";
import Dashboard from "@/features/dashboard/pages/Dashboard";

// ventas
import Venta from "@/features/ventas/pages/Venta";
import PrestamoPage from "@/features/prestamos/pages/Prestamo";

// inventario
import Inventario from "@/features/inventario/pages/Inventario";

// informes
import Informes from "@/features/informes/pages/Informes";

// Cierre
import CierrePage from "@/features/cierre/pages/CierrePage"

// Historial
import HistorialPage from "@/features/historial/pages/HistorialPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========= LOGIN ========= */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ========= ADMIN ========= */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="venta" element={<Venta />} />
          <Route path="prestamos" element={<PrestamoPage />} />
          <Route path="ventas" element={<HistorialPage />} />
          <Route path="informes" element={<Informes />} />
          <Route path="cierre" element={<CierrePage />} />
          <Route path="historial-cierres" element={<HistorialPage />} />
        </Route>

        {/* ========= VENDEDOR ========= */}
        <Route
          path="/vendedor/*"
          element={
            <ProtectedRoute roles={[ROLES.VENDEDOR]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Venta />} />
          <Route path="venta" element={<Venta />} />
          <Route path="prestamos" element={<PrestamoPage />} />
          <Route path="ventas" element={<HistorialPage />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="cierre" element={<CierrePage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
