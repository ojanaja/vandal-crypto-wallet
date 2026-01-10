export type ExtensionMessage =
    | { type: 'CREATE_WALLET'; payload: { mnemonic: string; password: string } }
    | { type: 'UNLOCK_WALLET'; payload: { password: string } }
    | { type: 'LOCK_WALLET' }
    | { type: 'GET_STATUS' }
    | { type: 'GET_BALANCE' }
    | { type: 'SEND_TRANSACTION'; payload: { to: string; amount: number } }
    | { type: 'CONNECT_DAPP'; payload: { origin: string } }
    | { type: 'SIGN_TRANSACTION_DAPP'; payload: { transaction: string; origin: string } }
    | { type: 'SIGN_MESSAGE'; payload: { message: any; display: string } }
    | { type: 'GET_TRANSACTIONS' };

export type ExtensionResponse =
    | { type: 'SUCCESS'; payload?: any }
    | { type: 'ERROR'; error: string }
    | { type: 'STATUS'; payload: { isLocked: boolean; hasWallet: boolean } }
    | { type: 'BALANCE'; payload: { balance: number; pubkey: string } }
    | { type: 'CONNECTED'; payload: { publicKey: string } }
    | { type: 'SIGNED'; payload: { signature: string } }
    | { type: 'TRANSACTIONS'; payload: { signatures: any[] } };

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
