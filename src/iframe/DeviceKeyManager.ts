const DB_NAME = 'paze-device';
const STORE_NAME = 'keys';
const KEY_ID = 'device-private-key';
const DEVICE_ID_KEY = 'paze_device_id';

export class DeviceKeyManager {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        (e.target as IDBOpenDBRequest).result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  getStoredDeviceId(): string | null {
    return localStorage.getItem(DEVICE_ID_KEY);
  }

  storeDeviceId(deviceId: string): void {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  async generateAndStoreKeyPair(): Promise<JsonWebKey> {
    if (!crypto?.subtle) throw new Error('Web Crypto unavailable (non-secure context)');
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify']
    );

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(keyPair.privateKey, KEY_ID);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return crypto.subtle.exportKey('jwk', keyPair.publicKey);
  }

  async signChallenge(challenge: string): Promise<string> {
    if (!crypto?.subtle) throw new Error('Web Crypto unavailable (non-secure context)');
    const privateKey = await this.getStoredPrivateKey();
    if (!privateKey) throw new Error('No device key found');

    const data = new TextEncoder().encode(challenge);
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data);
    return btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private getStoredPrivateKey(): Promise<CryptoKey | null> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(KEY_ID);
      req.onsuccess = () => resolve((req.result as CryptoKey) ?? null);
      req.onerror = () => reject(req.error);
    });
  }
}
