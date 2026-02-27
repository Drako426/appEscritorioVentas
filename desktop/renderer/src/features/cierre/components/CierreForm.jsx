export default function CierreForm({ onGenerar }) {

  const handleSubmit = (e) => {
    e.preventDefault()

    const confirmar = window.confirm(
      "¿Seguro que deseas generar el cierre de caja?"
    )

    if (!confirmar) return

    onGenerar()
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <button type="submit">
        Generar Cierre de Caja
      </button>
    </form>
  )
}