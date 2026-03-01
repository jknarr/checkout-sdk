export function buildIframeUrl(backendUrl: string, merchantId: string): string {
  return `${backendUrl}/checkout/embed?merchantId=${encodeURIComponent(merchantId)}`;
}
