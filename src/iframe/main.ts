import { CheckoutOrchestrator } from './CheckoutOrchestrator';
import { DeviceKeyManager } from './DeviceKeyManager';
import { injectStyles } from './styles';

injectStyles();

const root = document.getElementById('demo-root')!;
root.innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading checkout...</div></div>';

window.addEventListener('message', async (event: MessageEvent) => {
  if (event.data?.type !== 'DEMO_INIT') return;
  if (event.source !== window.parent) return;

  const { sessionId, backendUrl, merchantId, nonce } = event.data.payload as {
    sessionId: string;
    backendUrl: string;
    merchantId: string;
    nonce: string;
  };

  const parentOrigin = event.origin;

  const deviceKeyManager = new DeviceKeyManager();
  const orchestrator = new CheckoutOrchestrator(
    root,
    {
      checkoutSessionId: sessionId,
      backendUrl,
      nonce,
      parentOrigin,
    },
    deviceKeyManager
  );

  // Prompt for phone number first
  renderPhoneEntry(root, parentOrigin, async (phoneNumber) => {
    orchestrator['state'] = { ...orchestrator['state'], phoneNumber };
    await orchestrator.start();
  });
}, { once: true });

function renderPhoneEntry(root: HTMLElement, parentOrigin: string, onSubmit: (phone: string) => Promise<void>): void {
  root.innerHTML = '';

  const title = document.createElement('h2');
  title.className = 'demo-title';
  title.textContent = 'Checkout';
  root.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'demo-subtitle';
  subtitle.textContent = 'Enter your phone number to access your wallet.';
  root.appendChild(subtitle);

  const field = document.createElement('div');
  field.className = 'demo-field';

  const label = document.createElement('label');
  label.className = 'demo-label';
  label.textContent = 'Phone Number';
  field.appendChild(label);

  const input = document.createElement('input');
  input.type = 'tel';
  input.className = 'demo-input';
  input.placeholder = '+1 555 123 4567';
  field.appendChild(input);

  root.appendChild(field);

  const demo = document.createElement('div');
  demo.className = 'demo-banner';
  demo.textContent = 'Demo: use +15551234567 (Jane) or +15559876543 (John)';
  root.appendChild(demo);

  const btn = document.createElement('button');
  btn.className = 'demo-btn demo-btn-primary';
  btn.textContent = 'Continue';
  btn.addEventListener('click', async () => {
    const phone = input.value.trim();
    if (!phone) return;
    btn.disabled = true;
    btn.textContent = 'Continuing...';
    try {
      await onSubmit(phone);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue';
    }
  });
  root.appendChild(btn);

  input.focus();

  // Resize parent iframe
  window.parent.postMessage(
    { type: 'DEMO_RESIZE', payload: { height: root.scrollHeight + 48 } },
    parentOrigin
  );
}
