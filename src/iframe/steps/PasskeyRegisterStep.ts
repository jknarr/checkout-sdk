import type { CheckoutOrchestrator, CheckoutState } from '../CheckoutOrchestrator';
import {
  decodeCreationOptions,
  encodeRegistrationCredential,
  publicKeyCredentialSupported,
} from '../passkey';

export class PasskeyRegisterStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'demo-title';
    title.textContent = 'Save this checkout with a passkey';
    this.root.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'demo-subtitle';
    subtitle.textContent =
      'Use your fingerprint, face, or device PIN next time. This is optional.';
    this.root.appendChild(subtitle);

    const createBtn = document.createElement('button');
    createBtn.className = 'demo-btn demo-btn-primary';
    createBtn.textContent = 'Create passkey';
    createBtn.addEventListener('click', async () => {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';

      try {
        const credential = await this.createPasskey();
        if (credential) {
          await this.orchestrator.sendAction('PASSKEY_REGISTER_FINISH', {
            passkeyResponse: JSON.stringify(credential),
          });
        } else {
          await this.orchestrator.sendAction('PASSKEY_REGISTER_SKIP');
        }
      } catch (err) {
        const errorName = (err as DOMException)?.name;
        if (errorName !== 'NotAllowedError') {
          this.orchestrator.showError('Passkey setup failed. Continuing checkout.');
        }
        await this.orchestrator.sendAction('PASSKEY_REGISTER_SKIP');
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create passkey';
      }
    });
    this.root.appendChild(createBtn);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'demo-btn demo-btn-secondary';
    skipBtn.textContent = 'Not now';
    skipBtn.addEventListener('click', async () => {
      skipBtn.disabled = true;
      await this.orchestrator.sendAction('PASSKEY_REGISTER_SKIP');
      skipBtn.disabled = false;
    });
    this.root.appendChild(skipBtn);

    this.orchestrator.sendResize();
  }

  private async createPasskey(): Promise<object | null> {
    if (!publicKeyCredentialSupported()) {
      throw new Error('Passkey not supported in this browser context');
    }
    if (!this.state.passkeyOptions) {
      throw new Error('Passkey options are missing');
    }

    const publicKey = decodeCreationOptions(this.state.passkeyOptions);
    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential | null;
    if (!credential) {
      return null;
    }

    return encodeRegistrationCredential(credential);
  }
}
