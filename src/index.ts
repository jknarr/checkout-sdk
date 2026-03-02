import { mount } from './DemoCheckout';
import type { DemoCheckoutConfig, CheckoutSuccessResult, CheckoutError, CartItemDto, ShippingAddressDto } from './types';

export { mount };
export type { DemoCheckoutConfig, CheckoutSuccessResult, CheckoutError, CartItemDto, ShippingAddressDto };

// UMD global assignment (for <script> tag usage)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).DemoCheckout = { mount };
}
