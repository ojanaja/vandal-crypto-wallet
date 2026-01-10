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

    const [transactions, setTransactions] = useState<any[]>([]);
    const [usdPrice, setUsdPrice] = useState<number | null>(null);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const res = await sendMessageToBackground({ type: 'GET_BALANCE' });
            if (res.type === 'BALANCE') {
                setBalance(res.payload.balance);
                setPubkey(res.payload.pubkey);
            }
            // Fetch Transactions
            const txRes = await sendMessageToBackground({ type: 'GET_TRANSACTIONS' });
            if (txRes.type === 'TRANSACTIONS') {
                setTransactions(txRes.payload.signatures);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolPrice = async () => {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await res.json();
            setUsdPrice(data.solana.usd);
        } catch (e) {
            console.error("Failed to fetch price", e);
        }
    };

    useEffect(() => {
        fetchBalance();
        fetchSolPrice();
        const interval = setInterval(() => {
            fetchBalance();
            fetchSolPrice();
        }, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pubkey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const truncate = (str: string) => str.slice(0, 4) + '...' + str.slice(-4);

    const usdValue = (balance && usdPrice) ? (balance * usdPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$0.00';

    return (
        <div className="flex flex-col h-full fade-in">
            {/* Account Info Card */}
            <div className="glass-panel rounded-3xl p-6 flex flex-col items-center gap-2 mb-8 border-white/20">
                <h3 className="text-emerald-100/60 text-sm font-medium tracking-wide">Total Balance (Devnet)</h3>
                <div className="text-5xl font-bold text-white tracking-tight drop-shadow-sm mt-2">
                    {balance !== null ? balance.toFixed(4) : '...'} <span className="text-xl text-emerald-400 font-normal">SOL</span>
                </div>
                <div className="text-emerald-200/80 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    ≈ {usdValue} USD
                </div>

                {pubkey && (
                    <button
                        onClick={copyToClipboard}
                        className="mt-4 text-xs text-white/60 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 transition-all border border-white/5 hover:border-white/20"
                    >
                        {truncate(pubkey)}
                        {copied ? <span className="text-emerald-400 font-bold">Copied</span> : <span>📋</span>}
                    </button>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={onSend}
                    className="glass-button bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-100 font-bold py-4 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="text-2xl bg-emerald-500/20 w-10 h-10 rounded-full flex items-center justify-center">↑</span>
                    <span className="text-sm tracking-wide">Send</span>
                </button>
                <button
                    onClick={copyToClipboard}
                    className="glass-button bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="text-2xl bg-white/10 w-10 h-10 rounded-full flex items-center justify-center">↓</span>
                    <span className="text-sm tracking-wide">Receive</span>
                </button>
            </div>

            {/* Transaction History */}
            <div className="flex-1 flex flex-col h-0 overflow-hidden">
                <h3 className="text-sm font-bold text-white/50 mb-3 ml-2 uppercase tracking-wider text-[10px]">Recent Activity</h3>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {transactions.length === 0 ? (
                        <div className="h-full glass-panel rounded-2xl flex items-center justify-center text-white/30 text-xs border-dashed border-white/10">
                            No transactions yet
                        </div>
                    ) : (
                        transactions.map((tx: any) => (
                            <a
                                key={tx.signature}
                                href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                target="_blank"
                                rel="noreferrer"
                                className="block glass-panel p-3 rounded-xl hover:bg-white/5 transition-colors group border-white/5"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${tx.err ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                            {tx.err ? '✖' : '⚡'}
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/90 font-medium font-mono">
                                                {truncate(tx.signature)}
                                            </div>
                                            <div className="text-[10px] text-white/40">
                                                {tx.confirmationStatus}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-white/40 group-hover:text-emerald-400 transition-colors">
                                        ↗
                                    </div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
