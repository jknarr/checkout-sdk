import type { CheckoutOrchestrator, CheckoutState } from '../CheckoutOrchestrator';
import {
  decodeRequestOptions,
  encodeAssertionCredential,
  publicKeyCredentialSupported,
} from '../passkey';

export class PasskeyAuthStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'paze-title';
    title.textContent = 'Sign in with passkey';
    this.root.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'paze-subtitle';
    subtitle.textContent = 'Authenticate using your fingerprint, face, or device PIN.';
    this.root.appendChild(subtitle);

    const authBtn = document.createElement('button');
    authBtn.className = 'paze-btn paze-btn-primary';
    authBtn.textContent = 'Use passkey';
    authBtn.addEventListener('click', async () => {
      authBtn.disabled = true;
      authBtn.textContent = 'Authenticating...';

      try {
        const credential = await this.getPasskey();
        if (credential) {
          await this.orchestrator.sendAction('PASSKEY_AUTH_FINISH', {
            passkeyResponse: JSON.stringify(credential),
          });
        }
      } catch (err) {
        const errorName = (err as DOMException)?.name;
        if (errorName === 'NotAllowedError') {
          return;
        }
        this.orchestrator.showError('Passkey authentication failed. Use phone verification instead.');
        await this.orchestrator.sendAction('PASSKEY_AUTH_CANCEL');
      } finally {
        authBtn.disabled = false;
        authBtn.textContent = 'Use passkey';
      }
    });
    this.root.appendChild(authBtn);

    const fallbackBtn = document.createElement('button');
    fallbackBtn.className = 'paze-btn paze-btn-secondary';
    fallbackBtn.textContent = 'Use phone verification instead';
    fallbackBtn.addEventListener('click', async () => {
      fallbackBtn.disabled = true;
      await this.orchestrator.sendAction('PASSKEY_AUTH_CANCEL');
      fallbackBtn.disabled = false;
    });
    this.root.appendChild(fallbackBtn);

    this.orchestrator.sendResize();

    authBtn.click();
  }

  private async getPasskey(): Promise<object | null> {
    if (!publicKeyCredentialSupported()) {
      throw new Error('Passkey not supported in this browser context');
    }
    if (!this.state.passkeyOptions) {
      throw new Error('Passkey options are missing');
    }

    const publicKey = decodeRequestOptions(this.state.passkeyOptions);
    const credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential | null;
    if (!credential) {
      return null;
    }

    return encodeAssertionCredential(credential);
  }
}
