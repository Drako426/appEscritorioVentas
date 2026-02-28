import { useModal } from "@/app/ModalProvider"

export default function CierreForm({ onGenerar }) {
  const { openModal } = useModal()

  const handleSubmit = (e) => {
    e.preventDefault()

    openModal("confirmDialog", {
      title: "Confirmar cierre",
      message: "Seguro que deseas generar el cierre de caja?",
      confirmText: "Generar",
      onConfirm: () => onGenerar()
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <button type="submit">
        Generar Cierre de Caja
      </button>
    </form>
  )
}
