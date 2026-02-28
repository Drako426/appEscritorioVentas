import { createPortal } from "react-dom"
import { useModal } from "./ModalProvider"
import VentaPagoModal from "@/components/ui/modal/VentaPagoModal"
import VentaBuscadorModal from "@/components/ui/modal/VentaBuscadorModal"
import ConfirmPasswordModal from "@/components/ui/modal/ConfirmPasswordModal"
import PrestamoPagoModal from "@/components/ui/modal/PrestamoPagoModal"
import HistorialDetalleCierreModal from "@/components/ui/modal/HistorialDetalleCierreModal"
import ConfirmDialogModal from "@/components/ui/modal/ConfirmDialogModal"

function resolveModal(activeModal, closeModal) {
  if (!activeModal) return null

  const modalProps = {
    ...activeModal.props,
    onClose: closeModal
  }

  if (activeModal.name === "pago") {
    return <VentaPagoModal {...modalProps} />
  }

  if (activeModal.name === "buscador") {
    return <VentaBuscadorModal {...modalProps} />
  }

  if (activeModal.name === "confirmPassword") {
    return <ConfirmPasswordModal {...modalProps} />
  }

  if (activeModal.name === "prestamoPago") {
    return <PrestamoPagoModal {...modalProps} />
  }

  if (activeModal.name === "detalleCierre") {
    return <HistorialDetalleCierreModal {...modalProps} />
  }

  if (activeModal.name === "confirmDialog") {
    return <ConfirmDialogModal {...modalProps} />
  }

  return null
}

export default function ModalRoot() {
  const { activeModal, closeModal } = useModal()
  const modalNode = resolveModal(activeModal, closeModal)

  if (!modalNode) return null
  return createPortal(modalNode, document.body)
}
