import { mount } from './PazeCheckout';
import type { PazeCheckoutConfig, CheckoutSuccessResult, CheckoutError, CartItemDto, ShippingAddressDto } from './types';

export { mount };
export type { PazeCheckoutConfig, CheckoutSuccessResult, CheckoutError, CartItemDto, ShippingAddressDto };

// UMD global assignment (for <script> tag usage)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).PazeCheckout = { mount };
}
