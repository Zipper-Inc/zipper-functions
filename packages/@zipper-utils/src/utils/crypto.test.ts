import nodeCrypto from 'node:crypto';

const ALGORITHM = {
  // 128 bit auth tag is recommended for GCM
  AUTH_TAG_BYTE_LEN: 16,
  // NIST recommends 96 bits or 12 bytes IV for GCM to promote interoperability, efficiency, and simplicity of design
  IV_BYTE_LEN: 12,
  // NOTE: 256 (in algorithm name) is key size (block size for AES is always 128)
  KEY_BYTE_LEN: 32,
  // to prevent rainbow table attacks
  SALT_BYTE_LEN: 16,
};

const NodeCrypto = (msg: string, key: string) => {
  const iv = nodeCrypto.randomBytes(ALGORITHM.IV_BYTE_LEN);
  const keyInBytes = Buffer.from(key, 'hex');
  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', keyInBytes, iv, {
    authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN,
  });
  let encryptedMessage = cipher.update(msg);
  encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
  return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
};

const NodeDecrypt = (ciphertext: Buffer, key: string) => {
  const authTag = ciphertext.subarray(-16);
  const iv = ciphertext.subarray(0, 12);
  const encryptedMessage = ciphertext.subarray(12, -16);
  const keyInBytes = Buffer.from(key, 'hex');
  const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', keyInBytes, iv, {
    authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN,
  });
  decipher.setAuthTag(authTag);
  const messagetext = decipher.update(encryptedMessage);

  const bufferOut = Buffer.concat([messagetext, decipher.final()]);
  return bufferOut.toString('utf8');
};

const hexToUint8Array = (hexString: string): Uint8Array => {
  const result = new Uint8Array(
    hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  return result;
};

// Used in `slack-install-link` applet
const WebCrypto = async (msg: string, key: string) => {
  const te = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyInBytes = hexToUint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyInBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    te.encode(msg),
  );

  const authTag = new Uint8Array(encrypted.slice(-16));
  const ciphertext = new Uint8Array(encrypted.slice(0, -16));

  return new Uint8Array([...iv, ...ciphertext, ...authTag]);
};

const KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('crypto', () => {
  test('should encrypt and decrypt [NODE]', async () => {
    const msg = 'hello::world';
    const encrypted = NodeCrypto(msg, KEY);
    const decrypted = NodeDecrypt(encrypted, KEY);
    expect(decrypted).toEqual(msg);
  });

  test('should encrypt [WebCrypto] and decrypt [Node]', async () => {
    const msg = 'hello::world';
    const encrypted = await WebCrypto(msg, KEY);
    const decrypted = NodeDecrypt(Buffer.from(encrypted), KEY);
    expect(decrypted).toEqual(msg);
  });
});
