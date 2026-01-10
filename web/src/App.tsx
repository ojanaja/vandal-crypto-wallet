import { motion } from 'framer-motion';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black">V</div>
            <span className="font-bold text-xl tracking-tight">VANDAL</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-to" className="hover:text-white transition-colors">How to Use</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <a href="#download" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full transition-transform hover:scale-105 active:scale-95">
            Download
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20">
              v1.0.0 Devnet Release
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              The Standard for <br /> Solana Devnet.
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              VANDAL is a non-custodial browser wallet built specifically for developers.
              Injects `window.solana` for seamless dApp testing on Devnet.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a href="#download" className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black text-lg font-bold py-4 px-8 rounded-xl transition-all hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                Add to Chrome
              </a>
              <a href="#learn-more" className="w-full md:w-auto bg-gray-800 hover:bg-gray-700 text-white text-lg font-bold py-4 px-8 rounded-xl transition-colors border border-gray-700">
                View Source
              </a>
            </div>
          </motion.div>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full -z-10 opacity-50" />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16 text-center">Built for Speed & Security</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🛡️"
              title="Non-Custodial"
              desc="Your keys, your crypto. Encrypted locally with AES-GCM. Private keys never leave your device."
            />
            <FeatureCard
              icon="⚡"
              title="Instant Devnet"
              desc="Pre-configured for Solana Devnet. Airdrop yourself funds and start testing in seconds."
            />
            <FeatureCard
              icon="🔌"
              title="dApp Ready"
              desc="Injects the standard window.solana provider. Compatible with Wallet Adapter."
            />
          </div>
        </div>
      </section>

      {/* How to Install */}
      <section id="download" className="py-24 px-6">
        <div className="max-w-3xl mx-auto bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-800">
          <h2 className="text-3xl font-bold mb-8">How to Install</h2>
          <div className="space-y-6">
            <Step number="1" text="Download or Clone the VANDAL repository." />
            <Step number="2" text="Run `npm run build` in the extension directory." />
            <Step number="3" text="Open Chrome and go to `chrome://extensions`." />
            <Step number="4" text="Enable Developer Mode (top right)." />
            <Step number="5" text="Click 'Load Unpacked' and select the `dist` folder." />
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-500 text-sm border-t border-gray-900">
        <p>© 2024 VANDAL Wallet. Open Source.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors group">
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ number, text }: { number: string, text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0 mt-1">
        {number}
      </div>
      <p className="text-gray-300 text-lg">{text}</p>
    </div>
  );
}

export default App;
