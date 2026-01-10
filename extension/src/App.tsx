import { useState, useEffect } from 'react';
import { generateMnemonic } from './utils/crypto';
import { sendMessageToBackground } from './utils/messages';
import Dashboard from './components/Dashboard';
import SendForm from './components/SendForm';

type AppStep = 'loading' | 'welcome' | 'create' | 'password' | 'unlock' | 'ready' | 'send';

function App() {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>('loading');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await sendMessageToBackground({ type: 'GET_STATUS' });
      if (response.type === 'STATUS') {
        const { hasWallet, isLocked } = response.payload;
        if (!hasWallet) {
          setStep('welcome');
        } else if (isLocked) {
          setStep('unlock');
        } else {
          setStep('ready');
        }
      }
    } catch (e) {
      console.error("Failed to check status", e);
      setStep('welcome'); // Fallback
    }
  };

  const handleCreate = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setStep('create');
  };

  const handleSaveWallet = async () => {
    if (!mnemonic || !password) return;
    setLoading(true);
    try {
      const res = await sendMessageToBackground({
        type: 'CREATE_WALLET',
        payload: { mnemonic, password }
      });

      if (res.type === 'SUCCESS') {
        setStep('ready');
      } else {
        setError(res.error || 'Failed to create wallet');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendMessageToBackground({
        type: 'UNLOCK_WALLET',
        payload: { password }
      });

      if (res.type === 'SUCCESS') {
        setStep('ready');
        setPassword('');
      } else {
        setError('Incorrect password');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    await sendMessageToBackground({ type: 'LOCK_WALLET' });
    setStep('unlock');
  };

  if (step === 'loading') {
    return <div className="bg-gray-900 text-white flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="w-[360px] h-[600px] bg-gray-900 text-white flex flex-col p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">VANDAL</h1>
          <p className="text-gray-400 text-sm">Devnet Wallet</p>
        </div>
        {(step === 'ready' || step === 'send') && (
          <button onClick={handleLock} className="text-xs bg-gray-800 p-2 rounded hover:bg-gray-700">Lock</button>
        )}
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

        {step === 'unlock' && (
          <div className="flex flex-col gap-4 mt-10">
            <h2 className="text-xl font-bold">Welcome Back</h2>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-emerald-500 focus:outline-none"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleUnlock}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
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

            {error && <p className="text-red-500 text-sm">{error}</p>}

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
          <Dashboard
            onLock={handleLock}
            onSend={() => setStep('send')}
          />
        )}

        {step === 'send' && (
          <SendForm
            onBack={() => setStep('ready')}
            onSuccess={() => setStep('ready')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
