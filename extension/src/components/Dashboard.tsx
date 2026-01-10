import { useState, useEffect } from 'react'; // React 18
import { sendMessageToBackground } from '../utils/messages';

interface DashboardProps {
    onLock: () => void;
    onSend: () => void;
}

export default function Dashboard({ onLock, onSend }: DashboardProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const [pubkey, setPubkey] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const res = await sendMessageToBackground({ type: 'GET_BALANCE' });
            if (res.type === 'BALANCE') {
                setBalance(res.payload.balance);
                setPubkey(res.payload.pubkey);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pubkey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const truncate = (str: string) => str.slice(0, 4) + '...' + str.slice(-4);

    return (
        <div className="flex flex-col h-full">
            {/* Account Info Card */}
            <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-2 mb-6">
                <h3 className="text-gray-400 text-sm font-medium">Total Balance</h3>
                <div className="text-4xl font-bold text-emerald-400 tracking-tight">
                    {balance !== null ? balance.toFixed(4) : '...'} <span className="text-lg text-emerald-600">SOL</span>
                </div>

                {pubkey && (
                    <button
                        onClick={copyToClipboard}
                        className="mt-2 text-xs text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full hover:bg-gray-900 flex items-center gap-2 transition-colors"
                    >
                        {truncate(pubkey)}
                        {copied ? <span className="text-green-500">Copied</span> : <span>📋</span>}
                    </button>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={onSend}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-lg flex flex-col items-center gap-1 transition-all hover:scale-105"
                >
                    <span>↑</span>
                    <span className="text-sm">Send</span>
                </button>
                <button
                    onClick={copyToClipboard}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg flex flex-col items-center gap-1 transition-all hover:scale-105"
                >
                    <span>↓</span>
                    <span className="text-sm">Receive</span>
                </button>
            </div>

            {/* Transaction History Placeholder */}
            <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-gray-400 mb-2">Recent Activity</h3>
                <div className="flex-1 bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-600 text-xs">
                    No transactions yet
                </div>
            </div>
        </div>
    );
}
