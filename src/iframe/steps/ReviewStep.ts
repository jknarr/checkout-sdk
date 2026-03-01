import type { CheckoutOrchestrator, CheckoutState, AddressDto } from '../CheckoutOrchestrator';

export class ReviewStep {
  constructor(
    private root: HTMLElement,
    private state: CheckoutState,
    private orchestrator: CheckoutOrchestrator
  ) {}

  render(): void {
    this.root.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'paze-title';
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
      lbl.className = 'paze-label';
      lbl.textContent = label;
      wrap.appendChild(lbl);

      const inp = document.createElement('input');
      inp.className = 'paze-input';
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

    // Totals (placeholder — real values come from submit response)
    const totals = document.createElement('div');
    totals.className = 'totals';
    totals.innerHTML = `
      <div class="total-row"><span>Subtotal</span><span>—</span></div>
      <div class="total-row"><span>Shipping</span><span>—</span></div>
      <div class="total-row"><span>Tax</span><span>—</span></div>
      <div class="total-row grand"><span>Total</span><span>—</span></div>
    `;
    this.root.appendChild(totals);

    const placeOrderBtn = document.createElement('button');
    placeOrderBtn.className = 'paze-btn paze-btn-primary';
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
    cancelBtn.className = 'paze-btn paze-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      window.parent.postMessage(
        { type: 'PAZE_CANCEL', nonce: this.state.nonce, payload: { nonce: this.state.nonce } },
        this.state.parentOrigin
      );
    });
    this.root.appendChild(cancelBtn);

    this.orchestrator.sendResize();
  }
}
