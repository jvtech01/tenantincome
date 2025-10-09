type Events = {
  'permission-error': (error: Error) => void;
};

class EventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private listeners: { [K in keyof T]?: T[K][] } = {};

  on<K extends keyof T>(eventName: K, listener: T[K]): void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName]!.push(listener);
  }

  emit<K extends keyof T>(eventName: K, ...args: Parameters<T[K]>): void {
    const eventListeners = this.listeners[eventName];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }
}

export const errorEmitter = new EventEmitter<Events>();
