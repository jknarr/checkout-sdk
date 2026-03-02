import { OtpStep } from './steps/OtpStep';
import { CardSelectStep } from './steps/CardSelectStep';
import { CvvStep } from './steps/CvvStep';
import { ReviewStep } from './steps/ReviewStep';
import { PasskeyRegisterStep } from './steps/PasskeyRegisterStep';
import { PasskeyAuthStep } from './steps/PasskeyAuthStep';
import { DeviceKeyManager } from './DeviceKeyManager';

export interface CardDto {
  id: string;
  last4: string;
  expirationDate: string;
  cardType: string;
  cardArtUrl: string;
}

export interface AddressDto {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface PasskeyDto {
  credentialId: string;
  label?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface CheckoutState {
  checkoutSessionId: string;
  authSessionId?: string;
  backendUrl: string;
  nonce: string;
  parentOrigin: string;
  phoneNumber?: string;
  otpCode?: string;
  authToken?: string;
  challengeId?: string;
  deviceChallenge?: string;
  knownDeviceId?: string;
  hasPasskey?: boolean;
  passkeyOptions?: object;
  passkeyOfferHandled?: boolean;
  cards?: CardDto[];
  userProfile?: UserProfile;
  addresses?: AddressDto[];
  selectedCard?: CardDto;
  selectedAddress?: AddressDto;
  passkeys?: PasskeyDto[];
}

type AuthStep =
  | 'OTP_VERIFY'
  | 'CARD_SELECT'
  | 'CVV'
  | 'REVIEW'
  | 'PASSKEY_REGISTER'
  | 'PASSKEY_AUTH'
  | 'COMPLETED';

export class CheckoutOrchestrator {
  private deviceRegistrationAttempted = false;

  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private deviceKeyManager: DeviceKeyManager
  ) {}

  async start(): Promise<void> {
    await this.deviceKeyManager.open();
    const knownDeviceId = this.deviceKeyManager.getStoredDeviceId() ?? undefined;
    this.showLoading('Starting checkout...');

    try {
      const res = await this.fetchJson('/api/v1/auth/sessions', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: this.state.phoneNumber,
          checkoutSessionId: this.state.checkoutSessionId,
        }),
      });

      this.state = {
        ...this.state,
        authSessionId: res.authSessionId as string,
        challengeId: res.challengeId as string,
        otpCode: res.otpCode as string | undefined,
        deviceChallenge: res.deviceChallenge as string | undefined,
        hasPasskey: (res.hasPasskey as boolean | undefined) ?? false,
        knownDeviceId,
      };

      this.renderStep('OTP_VERIFY', res);
    } catch (_err) {
      this.showError('Failed to start checkout. Please try again.');
    }
  }

  onActionResponse(response: Record<string, unknown>): void {
    const step = response.currentStep as AuthStep;

    if (response.authToken) this.state = { ...this.state, authToken: response.authToken as string };
    if (response.cards) this.state = { ...this.state, cards: response.cards as CardDto[] };
    if (response.user) this.state = { ...this.state, userProfile: response.user as UserProfile };
    if (response.addresses) this.state = { ...this.state, addresses: response.addresses as AddressDto[] };
    if (response.selectedCard) this.state = { ...this.state, selectedCard: response.selectedCard as CardDto };
    if (response.selectedAddress) this.state = { ...this.state, selectedAddress: response.selectedAddress as AddressDto };
    if (response.deviceChallenge) this.state = { ...this.state, deviceChallenge: response.deviceChallenge as string };
    if (response.passkeyOptions) this.state = { ...this.state, passkeyOptions: response.passkeyOptions as object };

    if (step === 'CARD_SELECT' && response.deviceChallenge) {
      const deviceChallenge = response.deviceChallenge as string;
      this.tryDeviceVerify(deviceChallenge).then(deviceResponse => {
        if (deviceResponse) {
          this.onActionResponse(deviceResponse);
          return;
        }

        this.state = { ...this.state, deviceChallenge: undefined };
        this.renderStep('CARD_SELECT', {});
      });
      return;
    }

    if (step === 'CARD_SELECT' && !response.deviceChallenge) {
      this.state = { ...this.state, deviceChallenge: undefined };
    }

    if (step === 'REVIEW' && response.authToken && !this.state.deviceChallenge && !this.deviceRegistrationAttempted) {
      this.deviceRegistrationAttempted = true;
      this.registerDeviceNonBlocking();
    }

    if (step === 'REVIEW' && response.offerPasskeyRegistration && !this.state.passkeyOfferHandled) {
      this.state = { ...this.state, passkeyOfferHandled: true };
      this.renderStep('REVIEW', response);
      this.sendAction('PASSKEY_REGISTER_BEGIN');
      return;
    }

    this.renderStep(step, response);
  }

  private renderStep(step: AuthStep, _data: Record<string, unknown>): void {
    this.root.innerHTML = '';
    switch (step) {
      case 'OTP_VERIFY':
        new OtpStep(this.root, this.state, this).render();
        break;
      case 'CARD_SELECT':
        new CardSelectStep(this.root, this.state, this).render();
        break;
      case 'CVV':
        new CvvStep(this.root, this.state, this).render();
        break;
      case 'REVIEW':
        new ReviewStep(this.root, this.state, this).render();
        break;
      case 'PASSKEY_REGISTER':
        new PasskeyRegisterStep(this.root, this.state, this).render();
        break;
      case 'PASSKEY_AUTH':
        new PasskeyAuthStep(this.root, this.state, this).render();
        break;
      case 'COMPLETED':
        break;
    }
    this.sendResize();
  }

  async sendAction(action: string, payload: Record<string, unknown> = {}): Promise<boolean> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.state.authToken) {
        headers.Authorization = `Bearer ${this.state.authToken}`;
      }

      const res = await this.fetchJson(
        `/api/v1/auth/sessions/${this.state.authSessionId}/action`,
        { method: 'POST', headers, body: JSON.stringify({ action, ...payload }) }
      );

      if (action === 'PASSKEY_REGISTER_FINISH') {
        this.state = { ...this.state, hasPasskey: true };
      }
      if (action === 'PASSKEY_AUTH_CANCEL') {
        this.state = { ...this.state, passkeyOptions: undefined };
      }

      this.onActionResponse(res);
      return true;
    } catch (err: unknown) {
      this.showError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      return false;
    }
  }

  async submitCheckout(): Promise<void> {
    try {
      const res = await this.fetchJson(
        `/api/v1/sessions/${this.state.checkoutSessionId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.state.authToken}`,
          },
        }
      );

      window.parent.postMessage(
        { type: 'PAZE_SUCCESS', nonce: this.state.nonce, payload: { ...res, nonce: this.state.nonce } },
        this.state.parentOrigin
      );
    } catch (err) {
      window.parent.postMessage(
        {
          type: 'PAZE_ERROR',
          nonce: this.state.nonce,
          payload: { code: 'SUBMIT_FAILED', message: String(err), nonce: this.state.nonce },
        },
        this.state.parentOrigin
      );
    }
  }

  async listPasskeys(): Promise<PasskeyDto[]> {
    if (!this.state.authToken) {
      return [];
    }

    const res = await this.fetchJson('/api/v1/auth/passkeys', {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.state.authToken}` },
    });

    return res as unknown as PasskeyDto[];
  }

  async revokePasskey(credentialId: string): Promise<void> {
    if (!this.state.authToken) {
      throw new Error('Not authenticated');
    }

    const encodedId = encodeURIComponent(credentialId);
    await this.fetchJson(`/api/v1/auth/passkeys/${encodedId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.state.authToken}` },
    });
  }

  private async tryDeviceVerify(deviceChallenge: string): Promise<Record<string, unknown> | null> {
    const deviceId = this.deviceKeyManager.getStoredDeviceId();
    if (!deviceId) {
      return null;
    }

    try {
      const signature = await this.deviceKeyManager.signChallenge(deviceChallenge);
      return await this.fetchJson(`/api/v1/auth/sessions/${this.state.authSessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DEVICE_VERIFY', deviceId, signature }),
      });
    } catch (_err) {
      return null;
    }
  }

  private async registerDeviceNonBlocking(): Promise<void> {
    try {
      this.deviceKeyManager.clearDeviceId();
      const publicKeyJwk = await this.deviceKeyManager.generateAndStoreKeyPair();
      const res = await this.fetchJson('/api/v1/auth/device/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.state.authToken}`,
        },
        body: JSON.stringify({ publicKey: JSON.stringify(publicKeyJwk) }),
      });

      this.deviceKeyManager.storeDeviceId(res.deviceId as string);
      this.state = { ...this.state, knownDeviceId: res.deviceId as string };
    } catch (_err) {
      this.showDeviceWarning();
    }
  }

  private showDeviceWarning(): void {
    const banner = document.createElement('div');
    banner.className = 'device-warning-banner';
    banner.textContent = "Note: This device couldn't be saved. You'll need to enter your CVV next time.";
    this.root.prepend(banner);
    setTimeout(() => banner.remove(), 6000);
  }

  showError(message: string): void {
    const existing = this.root.querySelector('.error-msg');
    if (existing) {
      existing.remove();
    }

    const el = document.createElement('div');
    el.className = 'error-msg';
    el.textContent = message;
    this.root.prepend(el);
    this.sendResize();
  }

  private showLoading(message: string): void {
    this.root.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div>${message}</div>
      </div>
    `;
  }

  async fetchJson(path: string, options?: RequestInit): Promise<Record<string, unknown>> {
    const url = path.startsWith('http') ? path : `${this.state.backendUrl}${path}`;
    const defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...(options?.headers ?? {}) },
    });

    if (res.status === 204) {
      return {};
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message ?? `HTTP ${res.status}`);
    }

    return res.json();
  }

  sendResize(): void {
    window.parent.postMessage(
      {
        type: 'PAZE_RESIZE',
        nonce: this.state.nonce,
        payload: { height: document.body.scrollHeight + 32, nonce: this.state.nonce },
      },
      this.state.parentOrigin
    );
  }
}
