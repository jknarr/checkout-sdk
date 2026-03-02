import type { CheckoutOrchestrator, CheckoutState, AddressDto, PasskeyDto } from '../CheckoutOrchestrator';

export class ReviewStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'demo-title';
    title.textContent = 'Review your order';
    this.root.appendChild(title);

    // Card section
    if (this.state.selectedCard) {
      const card = this.state.selectedCard;
      const section = document.createElement('div');
      section.className = 'review-section';

      const header = document.createElement('div');
      header.className = 'review-section-title';
      header.textContent = 'Payment';

      const changeBtn = document.createElement('button');
      changeBtn.className = 'review-change-btn';
      changeBtn.textContent = 'Change';
      changeBtn.addEventListener('click', () => {
        changeBtn.disabled = true;
        this.orchestrator.sendAction('CHANGE_CARD').finally(() => { changeBtn.disabled = false; });
      });
      header.appendChild(changeBtn);
      section.appendChild(header);

      const row = document.createElement('div');
      row.className = 'review-card-row';

      const img = document.createElement('img');
      img.className = 'review-card-art';
      img.src = `${this.state.backendUrl}${card.cardArtUrl}`;
      img.alt = card.cardType;
      row.appendChild(img);

      const info = document.createElement('div');
      info.className = 'review-card-info';
      info.textContent = `${card.cardType} •••• ${card.last4}`;
      row.appendChild(info);

      section.appendChild(row);
      this.root.appendChild(section);
    }

    // Shipping section
    const addresses = this.state.addresses ?? [];
    const shippingSection = document.createElement('div');
    shippingSection.className = 'review-section';

    const shippingHeader = document.createElement('div');
    shippingHeader.className = 'review-section-title';
    shippingHeader.textContent = 'Shipping Address';
    shippingSection.appendChild(shippingHeader);

    let showingNewAddressForm = false;
    const addressDisplay = document.createElement('div');

    const addressSelect = document.createElement('select');
    addressSelect.className = 'address-select';

    addresses.forEach(addr => {
      const opt = document.createElement('option');
      opt.value = addr.id;
      opt.textContent = `${addr.label ? addr.label + ' — ' : ''}${addr.firstName} ${addr.lastName}, ${addr.address}, ${addr.city}`;
      if (this.state.selectedAddress?.id === addr.id) opt.selected = true;
      addressSelect.appendChild(opt);
    });

    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = '+ Enter new address';
    addressSelect.appendChild(newOpt);

    // New address form
    const newAddressForm = document.createElement('div');
    newAddressForm.className = 'new-address-form';
    newAddressForm.style.display = 'none';

    const fields: Record<string, string> = {
      firstName: 'First Name', lastName: 'Last Name', address: 'Street Address',
      city: 'City', state: 'State', zip: 'ZIP Code', country: 'Country',
    };

    const inputMap: Record<string, HTMLInputElement> = {};
    Object.entries(fields).forEach(([key, label]) => {
      const wrap = document.createElement('div');
      wrap.className = ['address', 'city'].includes(key) ? 'full-width' : '';

      const lbl = document.createElement('label');
      lbl.className = 'demo-label';
      lbl.textContent = label;
      wrap.appendChild(lbl);

      const inp = document.createElement('input');
      inp.className = 'demo-input';
      inp.placeholder = label;
      if (key === 'country') inp.value = 'US';
      inputMap[key] = inp;
      wrap.appendChild(inp);
      newAddressForm.appendChild(wrap);
    });

    addressSelect.addEventListener('change', () => {
      if (addressSelect.value === '__new__') {
        newAddressForm.style.display = 'grid';
        showingNewAddressForm = true;
      } else {
        newAddressForm.style.display = 'none';
        showingNewAddressForm = false;
        this.orchestrator.sendAction('SELECT_SHIPPING', { addressId: addressSelect.value });
      }
    });

    addressDisplay.appendChild(addressSelect);
    addressDisplay.appendChild(newAddressForm);
    shippingSection.appendChild(addressDisplay);
    this.root.appendChild(shippingSection);

    const subtotal = this.state.subtotal;
    const shippingCost = this.state.shippingCost;
    const tax = this.state.tax;
    const total = this.state.total;

    const hasTotals = [subtotal, shippingCost, tax, total].every(v => typeof v === 'number');

    const totals = document.createElement('div');
    totals.className = 'totals';
    totals.innerHTML = `
      <div class="total-row"><span>Subtotal</span><span>${hasTotals ? formatCurrency(subtotal as number) : '—'}</span></div>
      <div class="total-row"><span>Shipping</span><span>${hasTotals ? formatCurrency(shippingCost as number) : '—'}</span></div>
      <div class="total-row"><span>Tax</span><span>${hasTotals ? formatCurrency(tax as number) : '—'}</span></div>
      <div class="total-row grand"><span>Total</span><span>${hasTotals ? formatCurrency(total as number) : '—'}</span></div>
    `;
    this.root.appendChild(totals);

    const placeOrderBtn = document.createElement('button');
    placeOrderBtn.className = 'demo-btn demo-btn-primary';
    placeOrderBtn.textContent = 'Place Order';
    placeOrderBtn.addEventListener('click', async () => {
      if (showingNewAddressForm) {
        const newAddr: Record<string, string> = {};
        Object.keys(inputMap).forEach(k => { newAddr[k] = inputMap[k].value; });
        const ok = await this.orchestrator.sendAction('SELECT_SHIPPING', { newAddress: newAddr });
        if (!ok) return;
      }
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = 'Placing order...';
      await this.orchestrator.submitCheckout();
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    });
    this.root.appendChild(placeOrderBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'demo-btn demo-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      window.parent.postMessage(
        { type: 'DEMO_CANCEL', nonce: this.state.nonce, payload: { nonce: this.state.nonce } },
        this.state.parentOrigin
      );
    });
    this.root.appendChild(cancelBtn);

    this.renderPasskeyManagement().catch(() => {
      // Non-blocking section; keep checkout flow available even if this request fails.
    });

    this.orchestrator.sendResize();
  }

  private async renderPasskeyManagement(): Promise<void> {
    if (!this.state.authToken) {
      return;
    }

    let passkeys: PasskeyDto[] = [];
    try {
      passkeys = await this.orchestrator.listPasskeys();
    } catch {
      return;
    }

    const section = document.createElement('div');
    section.className = 'review-section';

    const header = document.createElement('div');
    header.className = 'review-section-title';
    header.textContent = 'Saved Passkeys';
    section.appendChild(header);

    if (passkeys.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'review-card-info';
      empty.textContent = 'No passkeys registered yet.';
      section.appendChild(empty);
      this.root.appendChild(section);
      this.orchestrator.sendResize();
      return;
    }

    passkeys.forEach(passkey => {
      const row = document.createElement('div');
      row.className = 'passkey-row';

      const info = document.createElement('div');
      info.className = 'passkey-info';
      const label = passkey.label ?? `Passkey ${passkey.credentialId.slice(0, 10)}...`;
      const created = new Date(passkey.createdAt).toLocaleDateString();
      info.textContent = `${label} • Added ${created}`;
      row.appendChild(info);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'review-change-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        removeBtn.disabled = true;
        try {
          await this.orchestrator.revokePasskey(passkey.credentialId);
          row.remove();
          if (!section.querySelector('.passkey-row')) {
            const none = document.createElement('div');
            none.className = 'review-card-info';
            none.textContent = 'No passkeys registered yet.';
            section.appendChild(none);
          }
          this.orchestrator.sendResize();
        } catch (err) {
          this.orchestrator.showError(err instanceof Error ? err.message : 'Failed to remove passkey');
        } finally {
          removeBtn.disabled = false;
        }
      });
      row.appendChild(removeBtn);

      section.appendChild(row);
    });

    this.root.appendChild(section);
    this.orchestrator.sendResize();
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
