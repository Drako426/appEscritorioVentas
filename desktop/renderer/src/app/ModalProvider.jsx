import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null)

  const openModal = useCallback((name, props = {}) => {
    if (!name) return
    setActiveModal({ name, props })
  }, [])

  const closeModal = useCallback(() => {
    setActiveModal(null)
  }, [])

  useEffect(() => {
    if (!activeModal) return undefined

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeModal()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeModal, closeModal])

  const value = useMemo(
    () => ({
      activeModal,
      openModal,
      closeModal
    }),
    [activeModal, openModal, closeModal]
  )

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used inside ModalProvider")
  }
  return context
}
