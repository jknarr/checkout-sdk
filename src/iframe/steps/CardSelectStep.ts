import type { CheckoutOrchestrator, CheckoutState, CardDto } from '../CheckoutOrchestrator';

export class CardSelectStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'demo-title';
    title.textContent = 'Select a card';
    this.root.appendChild(title);

    let selectedCardId: string | null = null;

    const grid = document.createElement('div');
    grid.className = 'card-grid';

    (this.state.cards ?? []).forEach(card => {
      const item = document.createElement('div');
      item.className = 'card-item';
      item.dataset.cardId = card.id;

      const img = document.createElement('img');
      img.className = 'card-art';
      img.src = `${this.state.backendUrl}${card.cardArtUrl}`;
      img.alt = card.cardType;
      item.appendChild(img);

      const type = document.createElement('div');
      type.className = 'card-type';
      type.textContent = card.cardType;
      item.appendChild(type);

      const last4 = document.createElement('div');
      last4.className = 'card-last4';
      last4.textContent = `•••• ${card.last4}`;
      item.appendChild(last4);

      const expiry = document.createElement('div');
      expiry.className = 'card-expiry';
      expiry.textContent = `Expires ${card.expirationDate}`;
      item.appendChild(expiry);

      item.addEventListener('click', () => {
        grid.querySelectorAll('.card-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        selectedCardId = card.id;
      });

      grid.appendChild(item);
    });

    this.root.appendChild(grid);

    const btn = document.createElement('button');
    btn.className = 'demo-btn demo-btn-primary';
    btn.textContent = 'Continue';
    btn.addEventListener('click', () => {
      if (!selectedCardId) return;
      btn.disabled = true;
      btn.textContent = 'Continuing...';
      this.orchestrator.sendAction('SELECT_CARD', { cardId: selectedCardId })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = 'Continue';
        });
    });
    this.root.appendChild(btn);

    this.orchestrator.sendResize();
  }
}
