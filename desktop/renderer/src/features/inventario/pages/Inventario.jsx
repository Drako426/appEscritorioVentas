import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/auth/useAuth"
import { useModal } from "@/app/ModalProvider"
import {
  createInventario,
  deleteInventario,
  getInventario,
  uploadInventarioExcel,
  updateInventario
} from "@/features/inventario/services/inventario.service"

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString()
}

function crearNuevaFila(productoBase) {
  return {
    codigo: productoBase.codigo,
    nombre: productoBase.nombre,
    talla: "",
    entradas: 0,
    salidas: 0,
    stock_actual: 0,
    precio_costo: productoBase.precio_costo,
    isNew: true
  }
}

export default function Inventario() {
  const { user } = useAuth()
  const { openModal } = useModal()
  const esAdmin = user?.role === "admin"

  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroGeneral, setFiltroGeneral] = useState("")
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroTalla, setFiltroTalla] = useState("")

  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  const [archivo, setArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    cargarInventario()
  }, [])

  const cargarInventario = async () => {
    try {
      const data = await getInventario()
      setProductos(data || [])
    } catch (error) {
      console.warn("Error cargando inventario", error)
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setArchivo(e.target.files[0])
    }
  }

  const subirExcel = async () => {
    if (!archivo) {
      alert("Selecciona un archivo Excel")
      return
    }

    try {
      setSubiendo(true)
      await uploadInventarioExcel(archivo)

      alert("Inventario sincronizado correctamente")
      setArchivo(null)
      await cargarInventario()
    } catch (error) {
      console.error(error)
      alert("Error subiendo archivo")
    } finally {
      setSubiendo(false)
    }
  }

  const editar = (producto) => {
    if (!esAdmin) return
    setEditId(producto.id)
    setEditData(producto)
  }

  const cancelar = () => {
    if (editData?.isNew) {
      setProductos(prev => prev.filter(p => !p.isNew))
    }

    setEditId(null)
    setEditData({})
  }

  const handleChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const existeTallaDuplicada = () => {
    return productos.some(p => (
      p.codigo === editData.codigo &&
      p.talla === editData.talla &&
      p.id !== editId
    ))
  }

  const guardar = async () => {
    if (!esAdmin) return

    if (existeTallaDuplicada()) {
      alert("Ya existe esa talla para este producto")
      return
    }

    try {
      if (editData.isNew) {
        await createInventario(editData)
      } else {
        await updateInventario(editId, editData)
      }

      await cargarInventario()
      cancelar()
    } catch (error) {
      console.error("Error guardando:", error)
    }
  }

  const eliminar = async (id) => {
    if (!esAdmin) return
    openModal("confirmDialog", {
      title: "Confirmar eliminacion",
      message: "Seguro que quieres eliminar este registro?",
      confirmText: "Eliminar",
      onConfirm: async () => {
        try {
          await deleteInventario(id)
          await cargarInventario()
          cancelar()
        } catch (error) {
          console.error("Error eliminando:", error)
        }
      }
    })
  }

  const agregarTalla = (productoBase) => {
    if (!esAdmin) return

    const nuevaFila = crearNuevaFila(productoBase)
    setProductos(prev => [...prev, nuevaFila])
    setEditId("new")
    setEditData(nuevaFila)
  }

  const productosFiltrados = useMemo(() => {
    const general = String(filtroGeneral || "").trim().toLowerCase()
    const codigo = String(filtroCodigo || "").trim().toLowerCase()
    const talla = String(filtroTalla || "").trim().toLowerCase()

    const tokens = general ? general.split(/\s+/).filter(Boolean) : []

    const cumpleToken = (producto, token) => {
      const nombre = String(producto.nombre || "").toLowerCase()
      const codigoProducto = String(producto.codigo || "").toLowerCase()
      const tallaProducto = String(producto.talla || "").toLowerCase()

      // Convencion: "200x" => codigo que empiece por "200"
      if (token.endsWith("x") && token.length > 1) {
        return codigoProducto.startsWith(token.slice(0, -1))
      }

      return (
        nombre.includes(token) ||
        codigoProducto.includes(token) ||
        tallaProducto.includes(token)
      )
    }

    return productos.filter((producto) => {
      const codigoProducto = String(producto.codigo || "").toLowerCase()
      const tallaProducto = String(producto.talla || "").toLowerCase()

      if (codigo && !codigoProducto.startsWith(codigo)) return false
      if (talla && tallaProducto !== talla) return false
      if (tokens.length > 0 && !tokens.every((token) => cumpleToken(producto, token))) return false

      return true
    })
  }, [productos, filtroGeneral, filtroCodigo, filtroTalla])

  if (loading) {
    return <div>Cargando inventario...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Inventario</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={filtroGeneral}
          onChange={(e) => setFiltroGeneral(e.target.value)}
          placeholder="Buscar (ej: negro 36 200x)"
          className="border p-2 rounded"
        />
        <input
          value={filtroCodigo}
          onChange={(e) => setFiltroCodigo(e.target.value)}
          placeholder="Codigo (prefijo)"
          className="border p-2 rounded"
        />
        <input
          value={filtroTalla}
          onChange={(e) => setFiltroTalla(e.target.value)}
          placeholder="Talla exacta"
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            setFiltroGeneral("")
            setFiltroCodigo("")
            setFiltroTalla("")
          }}
          className="border rounded px-3 py-2"
        >
          Limpiar filtros
        </button>
      </div>

      {esAdmin && (
        <div className="mb-4 flex gap-3 items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <button
            onClick={subirExcel}
            disabled={subiendo}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            {subiendo ? "Subiendo..." : "Subir Excel"}
          </button>
        </div>
      )}

      <table className="w-full text-sm border">
        <thead className="bg-gray-200">
          <tr>
            <th>Codigo</th>
            <th>Nombre</th>
            <th>Talla</th>
            <th>Entradas</th>
            <th>Salidas</th>
            <th>Stock</th>
            <th>Costo</th>
            {esAdmin && <th>Acciones</th>}
          </tr>
        </thead>

        <tbody>
          {productosFiltrados.map((p, index) => {
            const isEditing = (p.isNew && editData.isNew) || editId === p.id

            return (
              <tr key={p.id || `new-${index}`} className="border-t text-center">
                <td>
                  {isEditing && esAdmin ? (
                    <input
                      value={editData.codigo || ""}
                      onChange={e => handleChange("codigo", e.target.value)}
                      className="border px-1"
                    />
                  ) : p.codigo}
                </td>

                <td>
                  {isEditing && esAdmin ? (
                    <input
                      value={editData.nombre || ""}
                      onChange={e => handleChange("nombre", e.target.value)}
                      className="border px-1"
                    />
                  ) : p.nombre}
                </td>

                <td>
                  {isEditing && esAdmin ? (
                    <input
                      value={editData.talla || ""}
                      onChange={e => handleChange("talla", e.target.value)}
                      className="border px-1 w-16"
                    />
                  ) : p.talla}
                </td>

                <td>
                  {isEditing && esAdmin ? (
                    <input
                      type="number"
                      value={editData.entradas || 0}
                      onChange={e => handleChange("entradas", Number(e.target.value))}
                      className="border px-1 w-20"
                    />
                  ) : p.entradas}
                </td>

                <td>{p.salidas}</td>
                <td>{p.stock_actual}</td>

                <td>
                  {isEditing && esAdmin ? (
                    <input
                      type="number"
                      value={editData.precio_costo || 0}
                      onChange={e => handleChange("precio_costo", Number(e.target.value))}
                      className="border px-1 w-20"
                    />
                  ) : `$${formatMoney(p.precio_costo)}`}
                </td>

                {esAdmin && (
                  <td>
                    {isEditing ? (
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          onClick={guardar}
                          className="text-green-600 font-semibold"
                        >
                          Guardar
                        </button>

                        {!p.isNew && (
                          <button
                            onClick={() => eliminar(p.id)}
                            className="text-red-600 font-semibold"
                          >
                            Eliminar
                          </button>
                        )}

                        <button
                          onClick={cancelar}
                          className="text-gray-500"
                        >
                          Cancelar
                        </button>

                        {!p.isNew && (
                          <button
                            onClick={() => agregarTalla(p)}
                            className="text-blue-600 font-bold text-lg"
                          >
                            +
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => editar(p)}
                        className="text-blue-600 font-semibold"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
          {productosFiltrados.length === 0 && (
            <tr className="border-t text-center">
              <td colSpan={esAdmin ? 8 : 7} className="py-4 text-gray-500">
                No hay productos que coincidan con los filtros
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
