import { encryptVault, decryptVault, deriveKeypairFromMnemonic } from '../utils/crypto';
import { ExtensionMessage } from '../utils/messages';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import nacl from 'tweetnacl';

// IN-MEMORY KEYRING (The Vault)
// This variable is NOT persisted. It is lost when the browser closes or the service worker goes inactive.
interface Keyring {
    mnemonic: string;
}

let keyring: Keyring | null = null;
let vaultState: { hasWallet: boolean; isLocked: boolean } = { hasWallet: false, isLocked: true };

// Helper to restore keyring from session
async function ensureKeyring() {
    if (keyring) return keyring;
    try {
        const result = await chrome.storage.session.get(['mnemonic']);
        if (result.mnemonic) {
            keyring = { mnemonic: result.mnemonic };
            vaultState.isLocked = false;
        }
    } catch (e) {
        console.error("Session storage access failed", e);
    }
    return keyring;
}

// Initialize connection to Devnet
const connection = new Connection("https://api.devnet.solana.com", 'confirmed');

// Try to restore session on startup
ensureKeyring();

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

                    case 'RESET_WALLET':
                        await handleResetWallet();
                        sendResponse({ type: 'SUCCESS' });
                        break;

                    case 'GET_STATUS':
                        sendResponse({ type: 'STATUS', payload: vaultState });
                        break;

                    case 'GET_BALANCE':
                        await ensureKeyring();
                        if (!keyring) throw new Error("Wallet is locked");
                        const { balance, pubkey } = await handleGetBalance();
                        sendResponse({ type: 'BALANCE', payload: { balance, pubkey: pubkey.toBase58() } });
                        break;

                    case 'SEND_TRANSACTION':
                        await ensureKeyring();
                        if (!keyring) throw new Error("Wallet is locked");
                        const signature = await handleSendTransaction(message.payload.to, message.payload.amount);
                        sendResponse({ type: 'SUCCESS', payload: { signature } });
                        break;

                    case 'GET_TRANSACTIONS':
                        await ensureKeyring();
                        if (!keyring) throw new Error("Wallet is locked");
                        const transactions = await handleGetTransactions();
                        sendResponse({ type: 'TRANSACTIONS', payload: { signatures: transactions } });
                        break;

                    case 'SIGN_MESSAGE':
                        await ensureKeyring();
                        if (!keyring) throw new Error("Wallet is locked");
                        const signedMessage = await handleSignMessage(message.payload.message);
                        sendResponse({ type: 'SIGN_MESSAGE', payload: { signature: signedMessage } });
                        break;

                    case 'CONNECT_DAPP':
                        await ensureKeyring();
                        // If locked or no wallet, open popup and wait for user to unlock/create
                        if (!vaultState.hasWallet || vaultState.isLocked) {
                            await openPopup();
                            const unlocked = await waitForUnlock();
                            if (!unlocked) throw new Error("Wallet is locked or setup not completed");
                        }

                        // Ensure we have the keyring now
                        if (!keyring) throw new Error("Wallet state error");

                        const kp = await deriveKeypairFromMnemonic(keyring!.mnemonic);
                        sendResponse({ type: 'CONNECTED', payload: { publicKey: kp.publicKey.toBase58() } });
                        break;

                    case 'SIGN_TRANSACTION_DAPP':
                        await ensureKeyring();
                        if (!keyring) throw new Error("Wallet is locked");
                        // For MVP: we just error if it's not implemented, or we can mock it.
                        // Since we don't have deserialization logic readily available in this file for base64 txs yet,
                        // we can leave this as a placeholder or throw a clear error.
                        throw new Error("Transaction signing via dApp not fully implemented in MVP");
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

    // Recent blockhash is required for signing
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = kp.publicKey;

    // Send and confirm
    const signature = await connection.sendTransaction(transaction, [kp]);
    // Optionally wait for confirmation here or let UI poll
    return signature;
}

async function handleGetTransactions() {
    if (!keyring) throw new Error("Locked");
    const kp = await deriveKeypairFromMnemonic(keyring.mnemonic);
    const signatures = await connection.getSignaturesForAddress(kp.publicKey, { limit: 5 });
    return signatures;
}

async function handleSignMessage(messageConfig: any) {
    if (!keyring) throw new Error("Locked");
    const kp = await deriveKeypairFromMnemonic(keyring.mnemonic);

    // Message comes as a number object or array from the content script usually
    // We need to convert it to Uint8Array
    const messageBytes = new Uint8Array(Object.values(messageConfig));
    const signature = nacl.sign.detached(messageBytes, kp.secretKey);
    return signature;
}

async function handleCreateWallet(mnemonic: string, password: string) {
    // 1. Encrypt mnemonic
    const encrypted = await encryptVault(mnemonic, password);

    // 2. Save credential to local storage
    await chrome.storage.local.set({ encryptedVault: encrypted });

    // 3. Set in-memory keyring AND session
    keyring = { mnemonic };
    await chrome.storage.session.set({ mnemonic });
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
    await chrome.storage.session.set({ mnemonic });
    vaultState = { hasWallet: true, isLocked: false };
}

function handleLockWallet() {
    keyring = null;
    chrome.storage.session.remove('mnemonic');
    vaultState.isLocked = true;
}

async function handleResetWallet() {
    keyring = null;
    vaultState = { hasWallet: false, isLocked: true };
    await chrome.storage.session.remove('mnemonic');
    await chrome.storage.local.remove('encryptedVault');
}

// -----------------------------------------------------------------------------
// Popup & Wait Logic
// -----------------------------------------------------------------------------

async function openPopup() {
    // Check if popup is already open
    // @ts-ignore
    const windows = await chrome.windows.getAll({ populate: true });
    // @ts-ignore
    const existingPopup = windows.find((w: any) => w.type === 'popup' && w.tabs?.some((t: any) => t.url?.includes(chrome.runtime.getId())));

    if (existingPopup && existingPopup.id) {
        // @ts-ignore
        await chrome.windows.update(existingPopup.id, { focused: true });
        return;
    }

    // @ts-ignore
    await chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: 375,
        height: 600
    });
}

async function waitForUnlock(): Promise<boolean> {
    // Poll for up to 2 minutes (120 * 1s)
    for (let i = 0; i < 120; i++) {
        // Check if unlocked in memory (updated by UNLOCK_WALLET handler)
        if (!vaultState.isLocked && keyring) return true;

        // Also check session storage just in case another window unlocked it
        await ensureKeyring();
        if (!vaultState.isLocked && keyring) return true;

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
}
