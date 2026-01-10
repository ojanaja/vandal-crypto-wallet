import { encryptVault, decryptVault, deriveKeypairFromMnemonic } from '../utils/crypto';
import { ExtensionMessage } from '../utils/messages';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

// IN-MEMORY KEYRING (The Vault)
// This variable is NOT persisted. It is lost when the browser closes or the service worker goes inactive.
interface Keyring {
    mnemonic: string;
}

let keyring: Keyring | null = null;
let vaultState: { hasWallet: boolean; isLocked: boolean } = { hasWallet: false, isLocked: true };

// Initialize connection to Devnet
const connection = new Connection("https://api.devnet.solana.com", 'confirmed');

// Initialize state from storage
chrome.storage.local.get(['encryptedVault'], (result) => {
    if (result.encryptedVault) {
        vaultState.hasWallet = true;
    }
});

chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
        (async () => {
            try {
                switch (message.type) {
                    case 'CREATE_WALLET':
                        await handleCreateWallet(message.payload.mnemonic, message.payload.password);
                        sendResponse({ type: 'SUCCESS' });
                        break;

                    case 'UNLOCK_WALLET':
                        await handleUnlockWallet(message.payload.password);
                        sendResponse({ type: 'SUCCESS' });
                        break;

                    case 'LOCK_WALLET':
                        handleLockWallet();
                        sendResponse({ type: 'SUCCESS' });
                        break;

                    case 'GET_STATUS':
                        sendResponse({ type: 'STATUS', payload: vaultState });
                        break;

                    case 'GET_BALANCE':
                        if (!keyring) throw new Error("Wallet is locked");
                        const { balance, pubkey } = await handleGetBalance();
                        sendResponse({ type: 'BALANCE', payload: { balance, pubkey: pubkey.toBase58() } });
                        break;

                    case 'SEND_TRANSACTION':
                        if (!keyring) throw new Error("Wallet is locked");
                        const signature = await handleSendTransaction(message.payload.to, message.payload.amount);
                        sendResponse({ type: 'SUCCESS', payload: { signature } });
                        break;
                }
            } catch (e: any) {
                console.error("Background Error:", e);
                sendResponse({ type: 'ERROR', error: e.message });
            }
        })();

        return true; // Keep channel open for async response
    }
);

async function handleGetBalance() {
    if (!keyring) throw new Error("Locked");
    const kp = await deriveKeypairFromMnemonic(keyring.mnemonic);
    const balance = await connection.getBalance(kp.publicKey);
    return { balance: balance / LAMPORTS_PER_SOL, pubkey: kp.publicKey };
}

async function handleSendTransaction(toAddress: string, amountSOL: number) {
    if (!keyring) throw new Error("Locked");
    const kp = await deriveKeypairFromMnemonic(keyring.mnemonic);
    const toPubkey = new PublicKey(toAddress);

    // Create Transaction
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: kp.publicKey,
            toPubkey: toPubkey,
            lamports: Math.floor(amountSOL * LAMPORTS_PER_SOL),
        })
    );

    // Send and confirm
    const signature = await connection.sendTransaction(transaction, [kp]);
    // Optionally wait for confirmation here or let UI poll
    return signature;
}

async function handleCreateWallet(mnemonic: string, password: string) {
    // 1. Encrypt mnemonic
    const encrypted = await encryptVault(mnemonic, password);

    // 2. Save credential to local storage
    await chrome.storage.local.set({ encryptedVault: encrypted });

    // 3. Set in-memory keyring
    keyring = { mnemonic };
    vaultState = { hasWallet: true, isLocked: false };
}

async function handleUnlockWallet(password: string) {
    const result = await chrome.storage.local.get(['encryptedVault']);
    if (!result.encryptedVault) {
        throw new Error("No wallet found");
    }

    // Attempt decrypt
    const mnemonic = await decryptVault(result.encryptedVault, password);

    // If successful:
    keyring = { mnemonic };
    vaultState = { hasWallet: true, isLocked: false };
}

function handleLockWallet() {
    keyring = null;
    vaultState.isLocked = true;
}
