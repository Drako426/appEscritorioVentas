import { useEffect, useState } from "react"
import useOnlineStatus from "@/hooks/useOnlineStatus"

export default function ConnectionStatus() {
  const online = useOnlineStatus()
  const [queue, setQueue] = useState({
    pending: 0,
    failed: 0,
    syncing: false,
    lastError: null
  })

  useEffect(() => {
    const onQueueStatus = (event) => {
      setQueue(event.detail || { pending: 0, failed: 0, syncing: false, lastError: null })
    }

    window.addEventListener("offline-queue-status", onQueueStatus)

    if (window.electron?.obtenerVentasOffline) {
      window.electron.obtenerVentasOffline()
        .then((ventas) => {
          setQueue((prev) => ({
            ...prev,
            pending: (ventas || []).length,
            failed: (ventas || []).filter((v) => Number(v.fail_count || 0) > 0).length
          }))
        })
        .catch(() => {})
    }

    return () => {
      window.removeEventListener("offline-queue-status", onQueueStatus)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div
        className={`px-3 py-1 rounded text-xs font-semibold ${
          online
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        }`}
      >
        {online ? "ONLINE" : "OFFLINE"}
      </div>

      {queue.pending > 0 && (
        <div className="px-3 py-1 rounded text-xs font-semibold bg-yellow-500 text-black">
          Cola: {queue.pending}
          {queue.syncing ? " (sync...)" : ""}
        </div>
      )}

      {queue.lastError && (
        <div className="px-3 py-1 rounded text-xs font-semibold bg-orange-500 text-white">
          Sync pendiente
        </div>
      )}

      {queue.failed > 0 && (
        <div className="px-3 py-1 rounded text-xs font-semibold bg-red-600 text-white">
          Fallidas: {queue.failed}
        </div>
      )}
    </div>
  )
}
