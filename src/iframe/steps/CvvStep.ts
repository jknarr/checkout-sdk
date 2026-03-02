import type { CheckoutOrchestrator, CheckoutState } from '../CheckoutOrchestrator';

export class CvvStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'demo-title';
    title.textContent = 'Enter CVV';
    this.root.appendChild(title);

    if (this.state.selectedCard) {
      const card = this.state.selectedCard;
      const subtitle = document.createElement('p');
      subtitle.className = 'demo-subtitle';
      subtitle.textContent = `${card.cardType} ending in ${card.last4}`;
      this.root.appendChild(subtitle);
    }

    const field = document.createElement('div');
    field.className = 'demo-field';

    const label = document.createElement('label');
    label.className = 'demo-label';
    label.textContent = 'CVV / Security Code';
    field.appendChild(label);

    const input = document.createElement('input');
    input.type = 'password';
    input.inputMode = 'numeric';
    input.maxLength = 4;
    input.className = 'demo-input';
    input.placeholder = '•••';
    input.style.letterSpacing = '4px';
    input.style.maxWidth = '120px';
    field.appendChild(input);

    this.root.appendChild(field);

    const btn = document.createElement('button');
    btn.className = 'demo-btn demo-btn-primary';
    btn.textContent = 'Verify';
    btn.addEventListener('click', () => {
      const cvv = input.value.trim();
      if (cvv.length < 3) return;
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      this.orchestrator.sendAction('VERIFY_CVV', { cvv })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = 'Verify';
        });
    });
    this.root.appendChild(btn);

    input.focus();
    this.orchestrator.sendResize();
  }
}
