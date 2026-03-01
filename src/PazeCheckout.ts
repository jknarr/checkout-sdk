import { PazeCheckoutConfig, CartItemDto, CheckoutSuccessResult, CheckoutError } from './types';
import { IframeManager } from './IframeManager';
import { MessageBus } from './MessageBus';
import { buildIframeUrl } from './utils/buildIframeUrl';
import { generateNonce } from './utils/generateNonce';

const activeMounts = new WeakMap<HTMLElement, () => void>();

export function mount(container: HTMLElement, config: PazeCheckoutConfig): () => void {
  const existingUnmount = activeMounts.get(container);
  if (existingUnmount) {
    existingUnmount();
    activeMounts.delete(container);
  }

  const iframeManager = new IframeManager();
  const backendOrigin = new URL(config.backendUrl).origin;
  const messageBus = new MessageBus(backendOrigin);
  const nonce = generateNonce();
  const abortController = new AbortController();
  let cancelled = false;

  let sessionId: string | null = null;

  // Step 1: Create checkout session
  createCheckoutSession(config.backendUrl, config.merchantId, config.cart, abortController.signal)
    .then(id => {
      if (cancelled) return;
      sessionId = id;

      // Step 2: Mount iframe
      const iframeSrc = buildIframeUrl(config.backendUrl, config.merchantId);
      const iframe = iframeManager.create(container, iframeSrc);

      // Step 3: Send PAZE_INIT once iframe loads
      iframe.addEventListener('load', () => {
        const contentWindow = iframeManager.getContentWindow();
        if (contentWindow) {
          messageBus.send(contentWindow, backendOrigin, {
            type: 'PAZE_INIT',
            nonce,
            payload: { sessionId, backendUrl: config.backendUrl, merchantId: config.merchantId, nonce },
          });
        }
      });
    })
    .catch(err => {
      if (cancelled) return;
      config.onError({ code: 'SESSION_CREATE_FAILED', message: String(err) });
    });

  // Wire up callbacks
  messageBus.on('PAZE_SUCCESS', msg => {
    if ((msg.payload as { nonce: string }).nonce !== nonce) return;
    config.onSuccess(msg.payload as CheckoutSuccessResult);
  });

  messageBus.on('PAZE_ERROR', msg => {
    if ((msg.payload as { nonce: string }).nonce !== nonce) return;
    config.onError(msg.payload as CheckoutError);
  });

  messageBus.on('PAZE_CANCEL', msg => {
    if ((msg.payload as { nonce: string }).nonce !== nonce) return;
    config.onCancel();
  });

  messageBus.on('PAZE_RESIZE', msg => {
    if ((msg.payload as { nonce: string }).nonce !== nonce) return;
    const { height } = msg.payload as { height: number; nonce: string };
    iframeManager.setHeight(height);
  });

  // Return unmount function
  const unmount = () => {
    cancelled = true;
    abortController.abort();
    iframeManager.destroy();
    messageBus.destroy();
    if (activeMounts.get(container) === unmount) {
      activeMounts.delete(container);
    }
  };

  activeMounts.set(container, unmount);
  return unmount;
}

async function createCheckoutSession(
  backendUrl: string,
  merchantId: string,
  cart: CartItemDto[],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(`${backendUrl}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId, cart }),
    signal,
  });
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  const data = await res.json();
  return data.id;
}
