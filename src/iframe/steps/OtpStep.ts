import type { CheckoutOrchestrator, CheckoutState } from '../CheckoutOrchestrator';
import { publicKeyCredentialSupported } from '../passkey';

export class OtpStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'paze-title';
    title.textContent = 'Enter verification code';
    this.root.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'paze-subtitle';
    subtitle.textContent = `We sent a 6-digit code to ${this.state.phoneNumber ?? 'your phone'}.`;
    this.root.appendChild(subtitle);

    if (this.state.otpCode) {
      const banner = document.createElement('div');
      banner.className = 'demo-banner';
      banner.textContent = `Demo mode — your OTP is: ${this.state.otpCode}`;
      this.root.appendChild(banner);
    }

    // 6 OTP digit inputs
    const otpContainer = document.createElement('div');
    otpContainer.className = 'otp-inputs';
    const inputs: HTMLInputElement[] = [];
    for (let i = 0; i < 6; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.className = 'otp-input';
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '');
        if (input.value && i < 5) inputs[i + 1].focus();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && i > 0) inputs[i - 1].focus();
      });
      inputs.push(input);
      otpContainer.appendChild(input);
    }
    this.root.appendChild(otpContainer);

    const btn = document.createElement('button');
    btn.className = 'paze-btn paze-btn-primary';
    btn.textContent = 'Verify Code';
    btn.addEventListener('click', () => {
      const otpCode = inputs.map(i => i.value).join('');
      if (otpCode.length !== 6) return;
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      this.orchestrator.sendAction('VERIFY_OTP', {
        challengeId: this.state.challengeId,
        otpCode,
        deviceId: this.state.knownDeviceId,
      }).finally(() => {
        btn.disabled = false;
        btn.textContent = 'Verify Code';
      });
    });
    this.root.appendChild(btn);

    if (this.state.hasPasskey && publicKeyCredentialSupported()) {
      const passkeyBtn = document.createElement('button');
      passkeyBtn.className = 'paze-btn paze-btn-secondary';
      passkeyBtn.textContent = 'Use passkey instead';
      passkeyBtn.addEventListener('click', () => {
        passkeyBtn.disabled = true;
        passkeyBtn.textContent = 'Preparing...';
        this.orchestrator.sendAction('PASSKEY_AUTH_BEGIN').finally(() => {
          passkeyBtn.disabled = false;
          passkeyBtn.textContent = 'Use passkey instead';
        });
      });
      this.root.appendChild(passkeyBtn);
    }

    inputs[0].focus();
    this.orchestrator.sendResize();
  }
}
