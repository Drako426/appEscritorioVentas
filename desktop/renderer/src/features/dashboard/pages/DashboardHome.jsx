import { useEffect, useState } from 'react'
import { getDashboard } from '../services/dashboard.service'

export default function DashboardHome() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const result = await getDashboard()
        setData(result)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  if (loading)
    return (
      <div className="text-center text-gray-500 py-10">
        Cargando dashboard...
      </div>
    )

  if (!data)
    return (
      <div className="text-center text-red-500 py-10">
        Error cargando dashboard
      </div>
    )

  return (
    <div className="space-y-8">

      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Resumen General
        </h1>
        <p className="text-gray-500">
          Vista general del rendimiento del negocio
        </p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Ventas Hoy</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ${Number(data.venta_hoy).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Ventas del Mes</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            ${Number(data.venta_mes).toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Cantidad Ventas Mes</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {data.ventas_mes}
          </p>
        </div>

      </div>

      {/* Utilidad */}
      {data.utilidad_mes !== undefined && (
        <>
          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500 text-sm">Inversión Mes</p>
              <p className="text-2xl font-bold mt-2">
                ${Number(data.inversion_mes).toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-2xl shadow text-white">
              <p className="text-sm opacity-90">Utilidad Mes</p>
              <p className="text-3xl font-bold mt-2">
                ${Number(data.utilidad_mes).toLocaleString()}
              </p>
            </div>

          </div>

          {/* Top productos */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-lg font-semibold mb-4">
              Top 5 Productos del Mes
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-gray-500">
                    <th className="py-2">Producto</th>
                    <th className="py-2 text-right">Cantidad Vendida</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_productos.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-2">{item.nombre}</td>
                      <td className="py-2 text-right font-semibold">
                        {item.cantidad_vendida}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
