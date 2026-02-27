// Event Bus async estilo pub/sub
// Seguro para backend y desacoplado

class EventBus {
  constructor() {
    this.listeners = {}
  }

  /**
   * Suscribirse a un evento
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event].push(callback)
  }

  /**
   * Desuscribirse
   */
  off(event, callback) {
    if (!this.listeners[event]) return

    this.listeners[event] =
      this.listeners[event].filter(cb => cb !== callback)
  }

  /**
   * Emitir evento (async-safe)
   */
  async emit(event, data) {
    const handlers = this.listeners[event]

    if (!handlers || handlers.length === 0) return

    // Ejecuta listeners sin romper el flujo
    for (const handler of handlers) {
      try {
        await handler(data)
      } catch (error) {
        console.error(`❌ Error en listener "${event}"`, error.message)
      }
    }
  }
}

export const eventBus = new EventBus()