import { NavLink, Link } from "react-router-dom"
import { useAuth } from "@/auth/useAuth"

export default function Sidebar() {
  const { user } = useAuth()
  const base = `/${user.role}`

  return (
    <aside className="w-60 bg-gray-900 text-white p-4 space-y-3">
      <h2 className="text-xl font-bold mb-6">Tienda Calzado</h2>

      {user.role === "admin" && (
        <>
          <Link to={base}>Dashboard</Link>
          <Link to={`${base}/informes`}>Informes</Link>
        </>
      )}

      <Link to={`${base}/venta`}>Nueva Venta</Link>
      <Link to={`${base}/prestamos`}>Prestamos</Link>
      <Link to={`${base}/ventas`}>Historial</Link>

      <NavLink to={`${base}/inventario`}>Inventario</NavLink>
      <Link to={`${base}/cierre`}>Cierre</Link>
    </aside>
  )
}
