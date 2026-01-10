import { useState } from 'react';
import { sendMessageToBackground } from '../utils/messages';

interface SendFormProps {
    onBack: () => void;
    onSuccess: () => void;
}

export default function SendForm({ onBack, onSuccess }: SendFormProps) {
    const [to, setTo] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        if (!to || !amount) return;
        setLoading(true);
        setError(null);

        try {
            const res = await sendMessageToBackground({
                type: 'SEND_TRANSACTION',
                payload: {
                    to,
                    amount: parseFloat(amount)
                }
            });

            if (res.type === 'SUCCESS') {
                onSuccess();
            } else {
                setError(res.error || "Transaction failed");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={onBack} className="text-gray-400 hover:text-white pb-1">←</button>
                <h2 className="text-xl font-bold">Send SOL</h2>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Recipient Address</label>
                    <input
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="Solana Address"
                        className="bg-gray-800 border border-gray-700 rounded p-3 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Amount (SOL)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.000000001"
                        className="bg-gray-800 border border-gray-700 rounded p-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

                <button
                    onClick={handleSend}
                    disabled={loading || !to || !amount}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3 px-4 rounded-lg mt-4 transition-colors"
                >
                    {loading ? 'Sending...' : 'Send Now'}
                </button>
            </div>
        </div>
    );
}
