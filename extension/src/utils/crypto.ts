import { generateMnemonic as bip39GenerateMnemonic, mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally if needed, though polyfill should handle it.
// but strictly importing it is safer.

export const generateMnemonic = (): string => {
    return bip39GenerateMnemonic(); // default is 128 bit entropy -> 12 words
};

export const deriveKeypairFromMnemonic = async (mnemonic: string, accountIndex = 0): Promise<Keypair> => {
    const seed = await mnemonicToSeed(mnemonic);
    // Solana derivation path: m/44'/501'/0'/0'
    // But usually wallets use: m/44'/501'/index'/0' for multiple accounts
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString('hex')).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    return Keypair.fromSecretKey(secret);
};

// Encryption Constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const KEY_LENGTH = 256; // bits

interface EncryptedData {
    ciphertext: string; // base64
    iv: string;         // base64
    salt: string;       // base64
}

export const encryptVault = async (data: string, password: string): Promise<EncryptedData> => {
    const enc = new TextEncoder();
    const passwordKey = await importPassword(password);

    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await deriveKey(passwordKey, salt);

    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedData = enc.encode(data);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedData
    );

    return {
        ciphertext: bufferToBase64(new Uint8Array(ciphertextBuffer)),
        iv: bufferToBase64(iv),
        salt: bufferToBase64(salt)
    };
};

export const decryptVault = async (encrypted: EncryptedData, password: string): Promise<string> => {
    const salt = base64ToBuffer(encrypted.salt);
    const iv = base64ToBuffer(encrypted.iv);
    const ciphertext = base64ToBuffer(encrypted.ciphertext);

    const passwordKey = await importPassword(password);
    const key = await deriveKey(passwordKey, salt);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
        );
        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
    } catch (e) {
        throw new Error("Invalid password or corrupted data");
    }
};

// Helpers
const importPassword = (password: string): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
};

const deriveKey = (passwordKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> => {
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
    );
};

const bufferToBase64 = (buf: Uint8Array): string => {
    return Buffer.from(buf).toString('base64');
};

const base64ToBuffer = (str: string): Uint8Array => {
    return new Uint8Array(Buffer.from(str, 'base64'));
};
