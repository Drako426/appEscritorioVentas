import { useEffect } from "react"

export default function BaseModal({ children, onClose, closeOnOverlay = true }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]"
      onMouseDown={() => {
        if (closeOnOverlay) onClose?.()
      }}
    >
      <div
        className="w-full"
        onMouseDown={(event) => {
          event.stopPropagation()
        }}
      >
        {children}
      </div>
    </div>
  )
}
