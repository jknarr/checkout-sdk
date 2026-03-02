function normalizeBase64(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return base64 + padding;
}

export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const binary = atob(normalizeBase64(base64url));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return bytes.buffer;
}

export function arrayBufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function publicKeyCredentialSupported(): boolean {
  return typeof window.PublicKeyCredential !== 'undefined' && !!navigator.credentials;
}

function extractPublicKeyOptions(options: unknown): Record<string, unknown> {
  const root = options as Record<string, unknown>;
  const wrapped = root.publicKey;
  if (wrapped && typeof wrapped === 'object') {
    return wrapped as Record<string, unknown>;
  }
  return root;
}

export function decodeCreationOptions(options: unknown): PublicKeyCredentialCreationOptions {
  const o = extractPublicKeyOptions(options);
  const user = o.user as Record<string, unknown>;

  return {
    ...o,
    challenge: base64UrlToBuffer(String(o.challenge)),
    user: {
      ...user,
      id: base64UrlToBuffer(String(user.id)),
    },
    excludeCredentials: ((o.excludeCredentials as unknown[] | undefined) ?? []).map((cred: unknown) => {
      const c = cred as Record<string, unknown>;
      return {
        ...c,
        id: base64UrlToBuffer(String(c.id)),
      };
    }),
  } as unknown as PublicKeyCredentialCreationOptions;
}

export function decodeRequestOptions(options: unknown): PublicKeyCredentialRequestOptions {
  const o = extractPublicKeyOptions(options);

  return {
    ...o,
    challenge: base64UrlToBuffer(String(o.challenge)),
    allowCredentials: ((o.allowCredentials as unknown[] | undefined) ?? []).map((cred: unknown) => {
      const c = cred as Record<string, unknown>;
      return {
        ...c,
        id: base64UrlToBuffer(String(c.id)),
      };
    }),
  } as unknown as PublicKeyCredentialRequestOptions;
}

export function encodeRegistrationCredential(credential: PublicKeyCredential): object {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      transports: response.getTransports?.() ?? [],
    },
  };
}

export function encodeAssertionCredential(credential: PublicKeyCredential): object {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : null,
    },
  };
}
