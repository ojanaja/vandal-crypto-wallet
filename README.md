# VANDAL Wallet 🟢

> **The Standard for Solana Devnet Development.**

VANDAL is a non-custodial browser extension wallet built specifically for Solana developers. It injects a standard `window.solana` provider, allowing you to test dApps on Devnet without risking mainnet funds or dealing with complex wallet request flows.

![VANDAL Dashboard](https://via.placeholder.com/800x400?text=VANDAL+Dashboard)

## Features

- 🛡️ **Non-Custodial**: Your private keys are encrypted locally using AES-GCM and never leave your device.
- ⚡ **Devnet Native**: Pre-configured for Solana Devnet.
- 🔌 **dApp Ready**: Injects `window.solana` compatible with Solana Wallet Adapter.
- 💸 **Instant Airdrops**: (Planned) Built-in faucet button.
- 🎨 **Modern UI**: Clean, dark-mode interface built with React and Tailwind CSS.

## Installation

### From Source

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/vandal.git
    cd vandal
    ```

2.  **Install Dependencies**:
    ```bash
    cd extension
    npm install
    ```

3.  **Build the Extension**:
    ```bash
    npm run build
    ```
    This creates a `dist` directory in `extension/`.

4.  **Load into Chrome**:
    - Open `chrome://extensions`.
    - Enable **Developer Mode** (top right).
    - Click **Load Unpacked**.
    - Select the `extension/dist` folder.

## Development

The project is structured as a monorepo:

- `extension/`: The browser extension (React, Vite, Manifest V3).
- `web/`: The companion landing page (React, Vite).

### Extension Commands

```bash
cd extension
npm run dev    # Start dev server (for UI development)
npm run build  # Production build
```

### Web App Commands

```bash
cd web
npm run dev
npm run build
```

## Security Architecture

- **Key Management**: The master seed phrase is encrypted with your password using AES-GCM (256-bit).
- **Storage**: The encrypted vault is stored in `chrome.storage.local`.
- **Memory Safety**: Decrypted private keys exist only in the background service worker's memory (`variables`) and are cleared when the browser is closed or the wallet is locked. They are NEVER stored in `localStorage` or `sessionStorage`.

## License

MIT
