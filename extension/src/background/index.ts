import { encryptVault, decryptVault } from '../utils/crypto';
import { ExtensionMessage, ExtensionResponse } from '../utils/messages';

// IN-MEMORY KEYRING (The Vault)
// This variable is NOT persisted. It is lost when the browser closes or the service worker goes inactive.
interface Keyring {
    mnemonic: string;
}

let keyring: Keyring | null = null;
let vaultState: { hasWallet: boolean; isLocked: boolean } = { hasWallet: false, isLocked: true };

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
                }
            } catch (e: any) {
                sendResponse({ type: 'ERROR', error: e.message });
            }
        })();

        return true; // Keep channel open for async response
    }
);

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
