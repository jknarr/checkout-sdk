export class IframeManager {
  private iframe: HTMLIFrameElement | null = null;

  create(container: HTMLElement, src: string): HTMLIFrameElement {
    this.iframe = document.createElement('iframe');
    this.iframe.src = src;
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin');
    this.iframe.style.cssText = [
      'width: 100%',
      'border: none',
      'min-height: 400px',
      'display: block',
    ].join('; ');
    container.appendChild(this.iframe);
    return this.iframe;
  }

  setHeight(height: number): void {
    if (this.iframe) {
      this.iframe.style.height = `${height}px`;
    }
  }

  destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }

  getContentWindow(): Window | null {
    return this.iframe?.contentWindow ?? null;
  }
}
