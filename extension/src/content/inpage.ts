import { PublicKey } from '@solana/web3.js';

class VandalProvider {
    isVandal = true;
    publicKey: PublicKey | null = null;
    isConnected = false;
    _callbacks: Map<string, (response: any) => void> = new Map();
    _nextId = 1;

    constructor() {
        window.addEventListener('message', this._handleMessage.bind(this));
    }

    connect() {
        return this._request('CONNECT_DAPP', { origin: window.location.origin });
    }

    signTransaction(transaction: any) {
        // transaction should be serialized base58 or similar, depending on what we decide
        // For now, let's assume it's passed as a base64 string or we serialize it here.
        // Simplifying for MVP: assume it's a serialized string
        return this._request('SIGN_TRANSACTION', { transaction, origin: window.location.origin });
    }

    signAllTransactions(transactions: any[]) {
        // TODO: Implement
        return Promise.reject("Not implemented");
    }

    signMessage(message: Uint8Array, display: string = 'utf8') {
        return this._request('SIGN_MESSAGE', { message, display });
    }

    disconnect() {
        this.publicKey = null;
        this.isConnected = false;
        this.emit('disconnect');
        return Promise.resolve();
    }

    _request(type: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = this._nextId.toString();
            this._nextId++;

            this._callbacks.set(id, (response: any) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.payload);
                }
            });

            window.postMessage({
                source: 'vandal-inpage',
                id,
                type,
                payload
            }, window.location.origin);
        });
    }

    _handleMessage(event: MessageEvent) {
        const data = event.data;
        if (data && data.source === 'vandal-content' && data.id) {
            const callback = this._callbacks.get(data.id);
            if (callback) {
                if (data.type === 'CONNECTED') {
                    this.publicKey = new PublicKey(data.payload.publicKey);
                    this.isConnected = true;
                    this.emit('connect', this.publicKey);
                }
                callback(data); // Pass full data including payload/error
                this._callbacks.delete(data.id);
            }
        }
    }

    // Simple EventEmitter mock
    _listeners: Record<string, Function[]> = {};
    on(event: string, cb: Function) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(cb);
    }
    emit(event: string, ...args: any[]) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(...args));
        }
    }
}

// Inject
(window as any).solana = new VandalProvider();
console.log("VANDAL provider injected");
