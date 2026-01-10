import { useState } from 'react';
import { generateMnemonic, deriveKeypairFromMnemonic, encryptVault } from './utils/crypto';

function App() {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [step, setStep] = useState<'welcome' | 'create' | 'password' | 'ready'>('welcome');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setStep('create');
  };

  const handleSaveWallet = async () => {
    if (!mnemonic || !password) return;
    setLoading(true);
    // Simulate confirming mnemonic and saving
    // In real app, we verify mnemonic
    try {
      const encrypted = await encryptVault(mnemonic, password);
      console.log('Encrypted Vault:', encrypted);
      // TODO: Save to storage
      // const kp = await deriveKeypairFromMnemonic(mnemonic);
      // console.log('Public Key:', kp.publicKey.toBase58());
      setStep('ready');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[360px] h-[600px] bg-gray-900 text-white flex flex-col p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-400">VANDAL</h1>
        <p className="text-gray-400 text-sm">Devnet Wallet</p>
      </header>

      <main className="flex-1 flex flex-col">
        {step === 'welcome' && (
          <div className="flex flex-col gap-4 mt-10">
            <button
              onClick={handleCreate}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Create New Wallet
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              I already have a wallet
            </button>
          </div>
        )}

        {step === 'create' && mnemonic && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Save your Secret Recovery Phrase</h2>
            <p className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
              WARNING: Never disclose your Secret Recovery Phrase. Anyone with this phrase can take your assets forever.
            </p>

            <div className="grid grid-cols-3 gap-2 my-4">
              {mnemonic.split(' ').map((word, i) => (
                <div key={i} className="bg-gray-800 p-2 rounded text-center text-sm font-mono text-gray-300">
                  <span className="text-gray-500 select-none mr-1">{i + 1}.</span>{word}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('password')}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2 px-4 rounded-lg mt-auto"
            >
              I saved it
            </button>
          </div>
        )}

        {step === 'password' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Create a Password</h2>
            <p className="text-sm text-gray-400">This password will unlock your VANDAL wallet on this device only.</p>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-emerald-500 focus:outline-none"
            />

            <button
              onClick={handleSaveWallet}
              disabled={!password || loading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-2 px-4 rounded-lg mt-auto"
            >
              {loading ? 'Encrypting...' : 'Save & Continue'}
            </button>
          </div>
        )}

        {step === 'ready' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold">Wallet Created!</h2>
            <p className="text-center text-gray-400 text-sm">
              You are now ready to use VANDAL on Solana Devnet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
