export default function HistorialTable({ cierres, onVerDetalle }) {

  // ---------- helpers ----------
  const formatFechaHora = (fecha) => {
    if (!fecha) return "-"
    return new Date(fecha).toLocaleString("es-CO")
  }

  const formatCOP = (valor) => {
    if (valor == null) return "$0"
    return Number(valor).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    })
  }

  // ---------- empty state ----------
  if (!cierres || cierres.length === 0) {
    return <p>No hay cierres registrados.</p>
  }

  // ---------- table ----------
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "20px"
      }}
    >
      <thead>
        <tr style={{ background: "#f4f6f8" }}>
          <th>Cierre</th>
          <th>Total Ventas</th>
          <th>Efectivo</th>
          <th>Transferencia</th>
          <th>Cant. Ventas</th>
          <th>Usuario</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {cierres.map((cierre) => (
          <tr key={cierre.id}>
            <td>{formatFechaHora(cierre.fecha_cierre)}</td>
            <td>{formatCOP(cierre.total_ventas)}</td>
            <td>{formatCOP(cierre.total_efectivo)}</td>
            <td>{formatCOP(cierre.total_transferencia)}</td>
            <td>{cierre.cantidad_ventas}</td>
            <td>{cierre.usuario}</td>

            <td>
              <button
                onClick={() => onVerDetalle(cierre.id)}
              >
                Ver
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}