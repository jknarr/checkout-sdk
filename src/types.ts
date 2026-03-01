export interface CartItemDto {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface ShippingAddressDto {
  firstName: string;
  lastName: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PazeCheckoutConfig {
  merchantId: string;
  backendUrl: string;
  cart: CartItemDto[];
  onSuccess: (result: CheckoutSuccessResult) => void;
  onError: (error: CheckoutError) => void;
  onCancel: () => void;
}

export interface CheckoutSuccessResult {
  orderId: string;
  transactionId: string;
  timestamp: string;
  shipping: ShippingAddressDto;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export interface CheckoutError {
  code: string;
  message: string;
}
