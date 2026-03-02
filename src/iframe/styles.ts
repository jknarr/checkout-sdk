export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #1a1a1a; background: #fff; padding: 16px; }
    #demo-root { max-width: 480px; margin: 0 auto; }

    .demo-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111; }
    .demo-subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }

    .demo-field { margin-bottom: 14px; }
    .demo-label { display: block; font-size: 12px; font-weight: 500; color: #555; margin-bottom: 4px; }
    .demo-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.15s; }
    .demo-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

    .demo-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .demo-btn-primary { background: #2563eb; color: #fff; }
    .demo-btn-primary:hover { background: #1d4ed8; }
    .demo-btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
    .demo-btn-secondary { background: #f3f4f6; color: #374151; margin-top: 8px; }
    .demo-btn-secondary:hover { background: #e5e7eb; }

    .otp-inputs { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
    .otp-input { width: 44px; height: 52px; text-align: center; font-size: 22px; font-weight: 600; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
    .otp-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

    .demo-banner { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #92400e; }

    .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .card-item { border: 2px solid #e5e7eb; border-radius: 10px; padding: 12px; cursor: pointer; transition: all 0.15s; }
    .card-item:hover { border-color: #93c5fd; }
    .card-item.selected { border-color: #2563eb; background: #eff6ff; }
    .card-art { width: 80px; height: 50px; border-radius: 6px; margin-bottom: 8px; object-fit: cover; }
    .card-type { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-last4 { font-size: 14px; font-weight: 600; color: #111; }
    .card-expiry { font-size: 11px; color: #9ca3af; }

    .review-section { background: #f9fafb; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
    .review-section-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .review-change-btn { font-size: 12px; color: #2563eb; background: none; border: none; cursor: pointer; font-weight: 500; }
    .review-card-row { display: flex; align-items: center; gap: 10px; }
    .review-card-art { width: 48px; height: 30px; border-radius: 4px; object-fit: cover; }
    .review-card-info { font-size: 13px; font-weight: 500; }
    .passkey-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px solid #e5e7eb; }
    .passkey-row:first-of-type { border-top: none; }
    .passkey-info { font-size: 12px; color: #374151; }

    .address-select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }

    .new-address-form { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .new-address-form .full-width { grid-column: 1 / -1; }

    .totals { margin-bottom: 20px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #555; margin-bottom: 6px; }
    .total-row.grand { font-size: 15px; font-weight: 700; color: #111; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px; }

    .device-warning-banner { background: #fef3c7; border: 1px solid #d97706; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 13px; color: #92400e; }
    .error-msg { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 13px; color: #dc2626; }

    .loading { text-align: center; padding: 40px; color: #9ca3af; }
    .spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}
