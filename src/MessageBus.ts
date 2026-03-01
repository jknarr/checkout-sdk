export type PazeMessageType = 'PAZE_INIT' | 'PAZE_SUCCESS' | 'PAZE_ERROR' | 'PAZE_CANCEL' | 'PAZE_RESIZE';

export interface PazeMessage {
  type: PazeMessageType;
  nonce: string;
  payload?: unknown;
}

export class MessageBus {
  private expectedOrigin: string;
  private listeners: Map<string, ((msg: PazeMessage) => void)[]> = new Map();
  private boundHandler: (event: MessageEvent) => void;

  constructor(expectedOrigin: string) {
    this.expectedOrigin = expectedOrigin;
    this.boundHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.boundHandler);
  }

  private handleMessage(event: MessageEvent): void {
    if (event.origin !== this.expectedOrigin) return;
    const msg = event.data as PazeMessage;
    if (!msg?.type) return;
    const handlers = this.listeners.get(msg.type) ?? [];
    handlers.forEach(h => h(msg));
  }

  on(type: PazeMessageType, handler: (msg: PazeMessage) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(handler);
  }

  send(target: Window, targetOrigin: string, msg: PazeMessage): void {
    target.postMessage(msg, targetOrigin);
  }

  destroy(): void {
    window.removeEventListener('message', this.boundHandler);
    this.listeners.clear();
  }
}
