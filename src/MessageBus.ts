export type DemoMessageType = 'DEMO_INIT' | 'DEMO_SUCCESS' | 'DEMO_ERROR' | 'DEMO_CANCEL' | 'DEMO_RESIZE';

export interface DemoMessage {
  type: DemoMessageType;
  nonce: string;
  payload?: unknown;
}

export class MessageBus {
  private expectedOrigin: string;
  private listeners: Map<string, ((msg: DemoMessage) => void)[]> = new Map();
  private boundHandler: (event: MessageEvent) => void;

  constructor(expectedOrigin: string) {
    this.expectedOrigin = expectedOrigin;
    this.boundHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.boundHandler);
  }

  private handleMessage(event: MessageEvent): void {
    if (event.origin !== this.expectedOrigin) return;
    const msg = event.data as DemoMessage;
    if (!msg?.type) return;
    const handlers = this.listeners.get(msg.type) ?? [];
    handlers.forEach(h => h(msg));
  }

  on(type: DemoMessageType, handler: (msg: DemoMessage) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(handler);
  }

  send(target: Window, targetOrigin: string, msg: DemoMessage): void {
    target.postMessage(msg, targetOrigin);
  }

  destroy(): void {
    window.removeEventListener('message', this.boundHandler);
    this.listeners.clear();
  }
}
