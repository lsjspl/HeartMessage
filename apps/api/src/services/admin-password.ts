const encoder = new TextEncoder();
const PASSWORD_ITERATIONS = 120000;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}

async function derivePasswordHash(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits"
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBytes(salt),
      iterations
    },
    key,
    256
  );

  return bytesToBase64(new Uint8Array(bits));
}

export async function hashAdminPassword(password: string) {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = bytesToBase64(saltBytes);
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);

  return {
    hash,
    salt,
    iterations: PASSWORD_ITERATIONS
  };
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string,
  salt: string,
  iterations: number
) {
  const hash = await derivePasswordHash(password, salt, iterations);

  return constantTimeEqual(hash, storedHash);
}
