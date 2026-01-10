function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-6 flex justify-between items-center border-b border-white/10">
        <h1 className="text-3xl font-bold tracking-tighter text-emerald-400">VANDAL</h1>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">GitHub</a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          The Devnet Wallet needed by Developers.
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mb-10">
          VANDAL is an advanced, non-custodial browser extension wallet built for educational and portfolio purposes on Solana Devnet.
        </p>

        <div className="flex gap-4">
          <button className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105">
            Download Extension
          </button>
          <button className="border border-white/20 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors">
            View Source
          </button>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-600 text-sm">
        &copy; 2026 VANDAL Project. Built for Solana Devnet.
      </footer>
    </div>
  )
}

export default App
