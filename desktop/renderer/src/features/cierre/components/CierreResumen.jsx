export default function CierreResumen({ data }) {

  if (!data) return null

  return (
    <div style={{ border: "1px solid #ccc", padding: "15px" }}>
      <h3>Resumen del Cierre</h3>

      <p>Total Ventas: ${Number(data.total_ventas).toLocaleString()}</p>
      <p>Total Efectivo: ${Number(data.total_efectivo).toLocaleString()}</p>
      <p>Total Transferencia: ${Number(data.total_transferencia).toLocaleString()}</p>
      <p>Cantidad Ventas: {data.cantidad_ventas}</p>
      <p>Fecha Cierre: {new Date(data.fecha_cierre).toLocaleString()}</p>
    </div>
  )
}
