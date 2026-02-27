import { eventBus } from "../utils/eventBus.js"
import { EVENTS } from "../utils/events.js"

eventBus.on(EVENTS.VENTA_CREADA, async () => {
  // Punto de extension para acciones post-venta:
  // actualizar metricas, websocket realtime, cache, etc.
})
