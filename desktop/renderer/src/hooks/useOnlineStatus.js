import { useEffect, useState } from "react";

export default function useOnlineStatus() {
  const [navigatorOnline, setNavigatorOnline] = useState(navigator.onLine);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    const goOnline = () => setNavigatorOnline(true);
    const goOffline = () => setNavigatorOnline(false);
    const onBackendHealth = (event) => {
      const reachable = event?.detail?.reachable;
      if (typeof reachable === "boolean") {
        setBackendReachable(reachable);
      }
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("backend-health-status", onBackendHealth);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("backend-health-status", onBackendHealth);
    };
  }, []);

  return navigatorOnline && backendReachable;
}
