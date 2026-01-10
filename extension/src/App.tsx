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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="w-[360px] h-[600px] flex flex-col p-6">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-emerald-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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

        {/* ... */}

        {step === 'password' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Create a Password</h2>
            <p className="text-sm text-gray-400">This password will unlock your VANDAL wallet on this device only.</p>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-emerald-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full bg-gray-800 border-gray-700 rounded p-3 text-white focus:border-emerald-500 focus:outline-none pr-10"
              />
            </div>

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
