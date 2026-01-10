export type ExtensionMessage =
    | { type: 'CREATE_WALLET'; payload: { mnemonic: string; password: string } }
    | { type: 'UNLOCK_WALLET'; payload: { password: string } }
    | { type: 'LOCK_WALLET' }
    | { type: 'GET_STATUS' };

export type ExtensionResponse =
    | { type: 'SUCCESS'; payload?: any }
    | { type: 'ERROR'; error: string }
    | { type: 'STATUS'; payload: { isLocked: boolean; hasWallet: boolean } };

export const sendMessageToBackground = (
    message: ExtensionMessage
): Promise<ExtensionResponse> => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                resolve({ type: 'ERROR', error: chrome.runtime.lastError.message || 'Unknown error' });
            } else {
                resolve(response);
            }
        });
    });
};
