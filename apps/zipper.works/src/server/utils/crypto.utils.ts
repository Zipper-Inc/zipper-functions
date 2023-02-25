import crypto from 'crypto';

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

export const getRandomKey = () => crypto.randomBytes(ALGORITHM.KEY_BYTE_LEN);

/**
 * To prevent rainbow table attacks
 * */
export const getSalt = () => crypto.randomBytes(ALGORITHM.SALT_BYTE_LEN);

/**
 *
 * @param {Buffer} password - The password to be used for generating key
 *
 * To be used when key needs to be generated based on password.
 * The caller of this function has the responsibility to clear
 * the Buffer after the key generation to prevent the password
 * from lingering in the memory
 */
export const getKeyFromPassword = (password: Buffer, salt: Buffer) => {
  return crypto.scryptSync(password, salt, ALGORITHM.KEY_BYTE_LEN);
};

/**
 *
 * @param {Buffer} messagetext - The clear text message to be encrypted
 * @param {Buffer} key - The key to be used for encryption
 *
 * The caller of this function has the responsibility to clear
 * the Buffer after the encryption to prevent the message text
 * and the key from lingering in the memory
 */

export const encrypt = (messagetext: string, key: string) => {
  const iv = crypto.randomBytes(ALGORITHM.IV_BYTE_LEN);
  const keyInBytes = Buffer.from(key, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', keyInBytes, iv, {
    authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN,
  });
  let encryptedMessage = cipher.update(messagetext);
  encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
  return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
};

export const encryptToBase64 = (messagetext: string, key?: string) => {
  if (!key) {
    throw new Error('Missing ENCRYPTION_KEY');
  }

  return encrypt(messagetext, key).toString('base64');
};

export const encryptToHex = (messagetext: string, key?: string) => {
  if (!key) {
    throw new Error('Missing ENCRYPTION_KEY');
  }

  return encrypt(messagetext, key).toString('hex');
};

export const decrypt = (ciphertext: Buffer, key: string) => {
  const authTag = ciphertext.subarray(-16);
  const iv = ciphertext.subarray(0, 12);
  const encryptedMessage = ciphertext.subarray(12, -16);
  const keyInBytes = Buffer.from(key, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyInBytes, iv, {
    authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN,
  });
  decipher.setAuthTag(authTag);
  const messagetext = decipher.update(encryptedMessage);

  const bufferOut = Buffer.concat([messagetext, decipher.final()]);
  return bufferOut.toString('utf8');
};

export const decryptFromBase64 = (cipherInBase64: string, key?: string) => {
  const ciphertext = Buffer.from(cipherInBase64, 'base64');

  if (!key) {
    throw new Error('Missing ENCRYPTION_KEY');
  }

  return decrypt(ciphertext, key);
};

export const decryptFromHex = (cipherInHex: string, key?: string) => {
  const ciphertext = Buffer.from(cipherInHex, 'hex');

  if (!key) {
    throw new Error('Missing ENCRYPTION_KEY');
  }

  return decrypt(ciphertext, key);
};

export default {
  getRandomKey,
  getSalt,
  getKeyFromPassword,
  encrypt,
  decrypt,
  encryptToBase64,
  decryptFromBase64,
};
