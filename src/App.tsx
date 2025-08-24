import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  ShieldCheck,
  Telescope,
  BadgeCheck,
  Layers,
  BarChart4,
  Building2,
  FileCheck2,
  Users,
  PlayCircle,
  ExternalLink,
  MessageSquare,
  Link2,
  Mail,
  Loader2,
} from "lucide-react";

/**
 * Config
 * - Update DISCORD_INVITE if needed.
 * - Set VITE_DISCORD_SERVER_ID in your .env to show the embedded widget.
 */
const DISCORD_INVITE =
  import.meta.env.VITE_DISCORD_INVITE || "https://discord.gg/N3b774FYby";
const DISCORD_SERVER_ID = import.meta.env.VITE_DISCORD_SERVER_ID || "";

/** Apply the Logo Emerald palette (preferred dark mode) */
const applyLogoEmerald = () => {
  const vars: Record<string, string> = {
    "--bg": "#0E1B26",
    "--bgMuted": "#122434",
    "--card": "rgba(255,255,255,0.06)",
    "--cardBorder": "rgba(255,255,255,0.10)",
    "--accent": "#00D0B0",
    "--accent2": "#14B8A6",
    "--text": "#FFFFFF",
    "--muted": "#BABDC0",
    "--ink": "#0B1220",
    "--heading": "#F59E0B",
  };
  Object.entries(vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
};

const LogoImg: React.FC = () => (
  <img
    src="/publiclogo.png" // file lives in: /public/publiclogo.png
    alt="MacroStructure Connect"
    className="h-12 sm:h-14 md:h-16 w-auto hidden"
    onLoad={(e) => {
      e.currentTarget.classList.remove("hidden");
      e.currentTarget.classList.add("block");
    }}
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).style.display = "none";
    }}
  />
);

type StatProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
};
const StatCard = ({ icon: Icon, title, desc }: StatProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="rounded-2xl bg-[var(--card)] border border-[var(--cardBorder)] p-5"
  >
    <Icon className="h-6 w-6" />
    <div className="mt-3 font-semibold">{title}</div>
    <div className="text-sm text-[var(--muted)]">{desc}</div>
  </motion.div>
);

/** TradingView advanced chart embed */
const TradingViewChart: React.FC<{
  symbol?: string;
  theme?: "light" | "dark";
  height?: number | string; // allow "85vh" / "100%" or a number (px)
}> = ({ symbol = "CME:BTC1!", theme = "dark", height = 720 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // reset container each time symbol/theme changes
    el.innerHTML = "";

    // widget mount point
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    el.appendChild(widget);

    // embed script
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      withdateranges: true,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      studies: [],
      save_image: false,
    });
    el.appendChild(script);

    // cleanup on unmount / change
    return () => {
      el.innerHTML = "";
    };
  }, [symbol, theme]);

  return (
    <div
      className="tradingview-widget-container rounded-2xl overflow-hidden"
      ref={containerRef}
      style={{ height }} // number => px; string => exact value ("85vh"/"100%")
    />
  );
};

// Quick-picks: embed uses public/free proxies; link uses official futures
const FUTS: { label: string; embed: string; tv: string }[] = [
  { label: "ES Â· E-mini S&P",             embed: "OANDA:SPX500USD", tv: "CME_MINI:ES1!" },
  { label: "NQ Â· E-mini Nasdaq",          embed: "OANDA:NAS100USD", tv: "CME_MINI:NQ1!" },
  { label: "YM Â· Mini Dow",               embed: "OANDA:US30USD",   tv: "CBOT_MINI:YM1!" },
  { label: "CL Â· Crude Oil",              embed: "TVC:USOIL",       tv: "NYMEX:CL1!" },
  { label: "GC Â· Gold",                   embed: "TVC:GOLD",        tv: "COMEX:GC1!" },
  { label: "SI Â· Silver",                 embed: "TVC:SILVER",      tv: "COMEX:SI1!" },
  { label: "NG Â· Nat Gas",                embed: "OANDA:NATGASUSD", tv: "NYMEX:NG1!" },
  { label: "ZN Â· 10Y Note (yield proxy)", embed: "TVC:US10Y",       tv: "CBOT:ZN1!" },
  { label: "ZB Â· 30Y Bond (yield proxy)", embed: "TVC:US30Y",       tv: "CBOT:ZB1!" },
  { label: "6E Â· Euro FX (spot proxy)",   embed: "OANDA:EURUSD",    tv: "CME:6E1!" },
  { label: "DXY Â· US Dollar",             embed: "TVC:DXY",         tv: "TVC:DXY" },
];

export default function App() {
  // email/trial form
  const [email, setEmail] = useState("");
  const [status, setStatus] =
    useState<"idle" | "sending" | "success" | "error">("idle");
  const honeypotRef = useRef<HTMLInputElement>(null);

  // --- Futures symbol state & quick-picks (embed vs TV link) ---
  const [embedSymbol, setEmbedSymbol] = useState<string>(FUTS[0].embed);
  const [linkSymbol, setLinkSymbol] = useState<string>(FUTS[0].tv);
  const symbolInputRef = useRef<HTMLInputElement>(null);

  // Optional: allow /?s=NYMEX:CL1! to set the symbol from the URL
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (!s) return;
    const upper = s.toUpperCase();
    const hit = FUTS.find(
      (f) => f.tv.toUpperCase() === upper || f.embed.toUpperCase() === upper
    );
    if (hit) {
      setEmbedSymbol(hit.embed);
      setLinkSymbol(hit.tv);
    } else {
      setEmbedSymbol(upper);
      setLinkSymbol(upper);
    }
  }, []);
  // --- end symbol state ---

  // Expand overlay
  const [chartOpen, setChartOpen] = useState(false);
  useEffect(() => {
    if (!chartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setChartOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [chartOpen]);

  // palette
  useEffect(() => {
    applyLogoEmerald();
  }, []);

  // trial form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (honeypotRef.current && honeypotRef.current.value) {
      setStatus("success");
      return;
    }
    if (!email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing#trial" }),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("success");
      setEmail("");
    } catch {
      window.location.href = `mailto:djfatiaki@gmail.com?subject=Free%20Trial%20Request&body=Email:%20${encodeURIComponent(email)}`;

      setStatus("success");
      setEmail("");
    }
  };

  const trackRecord = [
    {
      date: "Feb 2025",
      headline:
        "Bitcoin, Ethereum, and Ripple's breakout is imminent: Will symmetrical triangle patterns trigger a sell-off?",
      sub: "Symmetrical triangle patterns signal indecisionâ€”mdash;Will Bitcoin, Ethereum, and Ripple follow the Dow's lead?",
      link:
        "https://www.fxstreet.com/cryptocurrencies/news/bitcoin-ethereum-and-ripples-breakout-is-imminent-will-symmetrical-triangle-patterns-trigger-a-sell-off-202502230540",
    },
    {
      date: "23 Mar 2025",
      headline:
        "Markets on the edge: Why recession warnings signal a major stock market correction ahead",
      sub:
        "Nasdaq 100, S&P 500, Dow Jones, and tech giants face critical support levels.",
      link:
        "https://www.fxstreet.com/news/markets-on-the-edge-why-recession-warnings-signal-a-major-stock-market-correction-ahead-202503231952",
    },
    {
      date: "LinkedIn Post",
      headline:
        "Bitcoin Hits First Target at $87,200 Amid Market Sell-Off and Liquidation Spike.",
      sub:
        "Bitcoin (BTC) has fallen over 10% from its $96,400 impact point, breaking the crucial $90,320 support zone within two days and reaching the initial target at $87,200â€”mdash;a major support level from November 2024.",
      link:
        "https://www.linkedin.com/posts/joeli-fatiaki-80393b126_btcusd-bitcoin-tradesignals-activity-7300380593542873088-GB8K",
    },
    {
      date: "Dec 2024",
      headline:
        "Is the US stock market bull run running out of steam? Historical patterns signal possible endgame",
      sub:
        "The US stock market Bull run could be heading to its final lap, as indicated in the attached chart of the US30, US 500, and US 100.",
      link:
        "https://www.fxstreet.com/news/is-the-us-stock-market-bull-run-running-out-of-steam-historical-patterns-signal-possible-endgame-202412260957",
    },
    {
      date: "Apr 2025",
      headline:
        "Bitcoin's safe-haven ascent: Could BTC join Gold as a global hedge against US Dollar and yield decline?",
      sub:
        "As the US dollar teeters on long-term support, yields flash warnings, and USD/JPY unravels, bitcoin's structure points to a reversalâ€”mdash;and a potential role alongside gold as a global safe-haven asset.",
      link:
        "https://www.fxstreet.com/cryptocurrencies/news/bitcoins-safe-haven-ascent-could-btc-join-gold-as-a-global-hedge-against-us-dollar-and-yield-decline-202504191950",
    },
    {
      date: "Feb 2025",
      headline:
        "US Dollar Index faces steep decline as AUD/USD signals a strong reversal",
      sub:
        "DXY's four-month rally breaks down below 106.415, while AUD/USD eyes a bullish turn amid a weakened greenback.",
      link:
        "https://www.fxstreet.com/analysis/us-dollar-index-faces-steep-decline-as-aud-usd-signals-a-strong-reversal-202502240757",
    },
    {
      date: "Mar 17 2024",
      headline: "BTC price- 72000",
      sub:
        "Long-term price targets to the upside are identified at $81,675, $91,647, and $103,620. These targets indicate potential resistance areas or significant price milestones based on historical trends and technical analysis.",
      link:
        "https://www.linkedin.com/posts/joeli-fatiaki-80393b126_btcusd-ethereum-bitcoin-activity-7174913440266801152-DkhZ",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--bg)/0.8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoImg />
            <span className="font-semibold tracking-wide">
              MacroStructure Connect
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[var(--muted)]">
            <a href="#system" className="hover:text-white">System</a>
            <a href="#indicators" className="hover:text-white">Alpha & Beta</a>
            <a href="#playbook" className="hover:text-white">Playbook</a>
            <a href="#track-record" className="hover:text-white">Track Record</a>
            <a href="#videos" className="hover:text-white">Videos</a>
            <a href="#discord" className="hover:text-white">Discord</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--bgMuted)/0.2] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 py-20 lg:py-28">
          <div className="flex flex-col justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight"
            >
              Connect Market Structure
              <span className="block text-[var(--accent)]">Before Price Arrives</span>
            </motion.h1>
            <p className="mt-6 text-[var(--muted)] max-w-xl">
              Institutional-grade Supply & Demand system that maps high-probability
              zones ahead of price. Built for Futures, FX, Crypto, Commodities, and
              Bondsâ€”mdash;engineered to track the major playersâ€™rsquo; footprint from monthly
              down to 1-minute.
            </p>
            <div className="mt-4 bg-[var(--card)] border border-[var(--cardBorder)] rounded-xl p-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)] break-words">
              <ExternalLink className="h-4 w-4 text-[var(--accent)]" />
              <span>As featured in FXStreet:</span>
              <a
                href="https://www.fxstreet.com/news/is-the-us-stock-market-bull-run-running-out-of-steam-historical-patterns-signal-possible-endgame-202412260957"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline break-words max-w-full"
              >
                US stock market crash: December cycle prediction plays out
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#trial"
                className="rounded-2xl bg-[var(--accent)] px-6 py-3 text-[var(--ink)] font-semibold shadow-xl"
              >
                Start Free 14-Day Trial
              </a>
              <a
                href="#indicators"
                className="rounded-2xl border border-[var(--cardBorder)] px-6 py-3 font-semibold hover:bg-[color:var(--bg)/0.2]"
              >
                See Alpha & Beta
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              No credit card. No obligations. Message <span className="font-semibold">@Rotuma</span> on TradingView to activate access.
            </p>
          </div>
          <div className="mt-10 lg:mt-0 lg:pl-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={LineChart} title="Price-Ahead Zones" desc="Projected S&D areas before price" />
              <StatCard icon={Layers} title="System Synergy" desc="Alpha + Beta work together" />
              <StatCard icon={Telescope} title="Top-Down Flow" desc="Monthly â†’rarr; 1m alignment" />
              <StatCard icon={ShieldCheck} title="Rules-Driven" desc="No chase. Wait for setup." />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-[var(--cardBorder)] bg-[var(--bgMuted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-3"><BadgeCheck className="h-5 w-5"/><span>Used by futures & FX traders</span></div>
          <div className="flex items-center gap-3"><BarChart4 className="h-5 w-5"/><span>Works across ES, NQ, YM, CL, GC, 6E, BTC</span></div>
          <div className="flex items-center gap-3"><Building2 className="h-5 w-5"/><span>Institutional-level methodology</span></div>
          <div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5"/><span>Comes with 25-page Guide</span></div>
        </div>
      </section>

      {/* System */}
      <section id="system" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--heading)]">Six Pillars to Supply & Demand Mastery</h2>
            <p className="mt-4 text-[var(--muted)]">
              Our rules are simple: short at <span className="text-white font-semibold">micro 5â†’rarr;4</span> and long at <span className="text-white font-semibold">micro 1â†’rarr;2</span>â€”mdash;only when structure aligns with signals. No chasing.
            </p>
            <ul className="mt-6 space-y-3 text-[var(--muted)] list-disc list-inside">
              <li>Top-down framing: monthly â†’rarr; weekly â†’rarr; daily â†’rarr; intraday</li>
              <li>Projected zones ahead of price with VWAP/volume context</li>
              <li>Clear invalidation & target pivots (micro 1â€“ndash;5)</li>
              <li>TTM and flow confirmation before trigger</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[var(--bgMuted)] to-[var(--bg)] p-6 border border-[var(--cardBorder)]">
            <div className="text-sm text-[var(--muted)]">Signature Setup</div>
            <div className="mt-2 text-xl font-semibold">System Synergy: Alpha + Beta</div>
            <p className="mt-3 text-[var(--muted)]">Alpha projects macro S&D frameworks; Beta refines microstructure with precision.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--card)] p-4 border border-[var(--cardBorder)]"><div className="font-semibold">Alpha</div><div className="text-sm text-[var(--muted)]">Macro zones, trend context, higher-TF bias</div></div>
              <div className="rounded-xl bg-[var(--card)] p-4 border border-[var(--cardBorder)]"><div className="font-semibold">Beta</div><div className="text-sm text-[var(--muted)]">Micro pivots, execution timing, risk control</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Indicators */}
      <section id="indicators" className="border-y border-[var(--cardBorder)] bg-[var(--bgMuted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-semibold">Macro S&D Alpha & Beta â€”mdash; Indicators</h2>
          <p className="mt-3 text-[var(--muted)] max-w-3xl">
            Invite-only on TradingView. Message <span className="font-semibold">@Rotuma</span> with your TradingView username to begin your <span className="font-semibold">14-day free trial</span>.
          </p>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--cardBorder)]">
              <div className="text-sm text-[var(--muted)]">Indicator</div>
              <div className="text-xl font-semibold">Macro S&D Â· Alpha</div>
              <ul className="mt-4 space-y-2 text-[var(--muted)] list-disc list-inside">
                <li>Projects macro supply/demand zones</li>
                <li>Guides bias, context, and risk posture</li>
                <li>Ideal for ES, NQ, YM, CL, GC, 6E, BTC and more</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--cardBorder)]">
              <div className="text-sm text-[var(--muted)]">Indicator</div>
              <div className="text-xl font-semibold">Macro S&D Â· Beta</div>
              <ul className="mt-4 space-y-2 text-[var(--muted)] list-disc list-inside">
                <li>Micro pivots (1â€“ndash;5) and execution zones</li>
                <li>Confirms triggers with volume/flow</li>
                <li>Pairs with Alpha for precise entries</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Playbook Showcase */}
      <section id="playbook" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold">Daily Playbook, Multi-Timeframe Forecast</h2>
            <p className="mt-4 text-[var(--muted)]">
              We publish structured analysis that connects macro context with actionable intraday plans.
              Expect clarity on key levels, confluence, and invalidationsâ€”mdash;no noise, just structure.
            </p>
            <ul className="mt-6 space-y-3 text-[var(--muted)] list-disc list-inside">
              <li>London & New York sessions: execution windows</li>
              <li>Clear rules: engage at micro 1/2 (long) and 5/4 (short)</li>
              <li>â€œNo chaseâ€ discipline to avoid low-quality trades</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[var(--bgMuted)] to-[var(--bg)] p-6 border border-[var(--cardBorder)]">
            <div className="text-sm text-[var(--muted)]">Sample Highlights</div>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-[var(--card)] p-4 border border-[var(--cardBorder)]">
                SPX & SPY: defended VWAP lower band; trend sustained above 2.02â€“ndash;2.22 band, targeting 2.96â€“ndash;3.73 (options context).
              </div>
              <div className="rounded-xl bg-[var(--card)] p-4 border border-[var(--cardBorder)]">
                Nasdaq Futures: micro-1 defense â†’rarr; micro-4 target hit; typical MacroStructure long signal (Asia â†’rarr; London follow-through).
              </div>
              <div className="rounded-2xl bg-[var(--card)] p-4 border border-[var(--cardBorder)]">
                Dow Futures: short micro 5â†’rarr;4 into micro-3; rotation long micro-1â†’rarr;2 on structure alignment.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discord CTA */}
      <section id="discord" className="border-y border-[var(--cardBorder)] bg-[var(--bgMuted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center">Join the Discord â€”mdash; Live Updates & Analysis</h2>
          <p className="mt-3 text-[var(--muted)] text-center max-w-2xl mx-auto">
            All actionable analysis, levels, and session notes are posted in our community Discord.
          </p>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--cardBorder)]">
              <div className="text-sm text-[var(--muted)]">What you'll get</div>
              <ul className="mt-4 space-y-2 text-[var(--muted)] list-disc list-inside">
                <li>Daily structure notes and session prep</li>
                <li>Alpha/Beta screenshots with context</li>
                <li>Q&A threads and trader feedback</li>
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--ink)] font-semibold shadow-xl"
                >
                  <MessageSquare className="h-4 w-4" /> Join Discord
                </a>
                <a
                  href="#trial"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--cardBorder)] px-5 py-3 font-semibold hover:bg-[color:var(--bg)/0.2]"
                >
                  <Link2 className="h-4 w-4" /> Start Free Trial
                </a>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--cardBorder)] overflow-hidden p-0">
              {DISCORD_SERVER_ID ? (
                <iframe
                  title="MacroStructure Discord"
                  src={`https://discord.com/widget?id=${DISCORD_SERVER_ID}&theme=dark`}
                  className="w-full h-80"
                  frameBorder={0}
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                />
              ) : (
                <div className="p-6 text-[var(--muted)] text-sm">
                  Set <code>VITE_DISCORD_SERVER_ID</code> to embed the community widget here.
                  The â€œJoin Discordâ€ button works either way.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Track Record */}
      <section id="track-record" className="border-y border-[var(--cardBorder)] bg-[var(--bgMuted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-[var(--heading)]">Historical Market Predictions</h2>
          <div className="mt-3 flex justify-center">
            <a
              href={trackRecord[1]?.link || trackRecord[0]?.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--cardBorder)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted)] hover:bg-[color:var(--bg)/0.2]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> As featured on <span className="font-semibold">FXStreet</span>
            </a>
          </div>
          <p className="mt-3 text-[var(--muted)] text-center max-w-2xl mx-auto">
            Years of reliable analysis â€”mdash; connecting fundamentals and technicals across Crypto, FX, Commodities, Stocks, Bonds, Options, Futures, and Indices.
          </p>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            {trackRecord.map((item, idx) => (
              <div key={idx} className="rounded-2xl bg-[var(--card)] border border-[var(--cardBorder)] p-6">
                <div className="text-sm text-[var(--muted)]">{item.date}</div>
                <div className="mt-1 font-semibold text-lg">{item.headline}</div>
                <div className="mt-2 text-[var(--muted)] text-sm">{item.sub}</div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-[var(--accent)] hover:underline text-sm"
                >
                  Read Full Analysis <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trial / Pricing */}
      <section id="trial" className="border-y border-[var(--cardBorder)] bg-[var(--bgMuted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--heading)]">Start Your 14-Day Free Trial</h2>
          <p className="mt-3 text-[var(--muted)]">
            Message <span className="font-semibold">@Rotuma</span> on TradingView with your username. Weâ€™rsquo;ll turn on accessâ€”mdash;no forms, no card, no obligations.
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <form onSubmit={handleSubmit} noValidate className="rounded-2xl bg-[var(--card)] border border-[var(--cardBorder)] p-4 sm:p-5">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="trial-email" className="sr-only">Email address</label>
                  <input
                    id="trial-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[var(--cardBorder)] bg-transparent px-3 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-[var(--ink)] font-semibold shadow-xl disabled:opacity-70"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sendingâ€¦
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Request Invite
                      </>
                    )}
                  </button>
                </div>
              </div>
              <input type="text" name="website" ref={honeypotRef} className="hidden" tabIndex={-1} autoComplete="off" />
              {status === "success" && (<p className="mt-3 text-sm text-green-400">Thanks! We'll email instructions shortly.</p>)}
              {status === "error" && (<p className="mt-3 text-sm text-red-400">Something went wrong. Please try again or email us.</p>)}
              <p className="mt-3 text-xs text-[var(--muted)]">Prefer TradingView? Message <span className="font-semibold">@Rotuma</span> and we'll activate your trial.</p>
            </form>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:djfatiaki@gmail.com?subject=Subscribe%20$99%2Fmo%20(USD)&body=Please%20send%20me%20the%20payment%20link%20for%20MacroStructure%20Connect."

                className="rounded-2xl bg-[var(--accent)] px-6 py-3 text-[var(--ink)] font-semibold shadow-xl"
              >
                Subscribe $99/mo (USD)
              </a>
              <a href="#faq" className="rounded-2xl border border-[var(--cardBorder)] px-6 py-3 font-semibold hover:bg-[color:var(--bg)/0.2]">
                Questions? Read FAQ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chart â€”mdash; bigger, screenshots removed */}
      <section id="live-chart" className="border-t border-[var(--cardBorder)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--heading)] mb-1 flex items-center justify-between">
            <span>Live Market Chart</span>
            <button
              onClick={() => setChartOpen(true)}
              className="text-xs sm:text-sm rounded-xl border border-[var(--cardBorder)] px-3 py-2 hover:bg-[color:var(--bg)/0.2]"
              title="Expand chart"
            >
              Expand
            </button>
          </h2>

          <p className="mt-2 text-[var(--muted)]">
            Symbol: <span className="font-mono">{linkSymbol}</span>. Use the buttons or type a TradingView symbol
            (ES, NQ, YM, CL, GC, SI, ZN, ZB, 6E, DXYâ€¦).
          </p>

          {/* Futures quick-picks + manual symbol box */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FUTS.map((f) => (
              <button
                key={f.tv}
                onClick={() => {
                  setEmbedSymbol(f.embed);
                  setLinkSymbol(f.tv);
                }}
                className={`text-xs sm:text-sm rounded-xl border border-[var(--cardBorder)] px-3 py-2 hover:bg-[color:var(--bg)/0.2] ${
                  embedSymbol === f.embed ? "bg-[var(--card)] ring-1 ring-[var(--accent)]" : ""
                }`}
                title={`${f.tv} (embed: ${f.embed})`}
              >
                {f.label}
              </button>
            ))}

            <form
              className="flex items-center gap-2 ml-auto"
              onSubmit={(e) => {
                e.preventDefault();
                const v = symbolInputRef.current?.value?.trim();
                if (!v) return;
                const upper = v.toUpperCase();
                const hit = FUTS.find(
                  (f) =>
                    f.tv.toUpperCase() === upper ||
                    f.embed.toUpperCase() === upper
                );
                if (hit) {
                  setEmbedSymbol(hit.embed);
                  setLinkSymbol(hit.tv);
                } else {
                  setEmbedSymbol(upper);
                  setLinkSymbol(upper);
                }
              }}
            >
              <input
                ref={symbolInputRef}
                defaultValue={linkSymbol}
                placeholder="CME_MINI:ES1!"
                className="w-44 sm:w-56 rounded-xl border border-[var(--cardBorder)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono"
              />
              <button
                type="submit"
                className="text-xs sm:text-sm rounded-xl bg-[var(--accent)] px-3 py-2 text-[var(--ink)] font-semibold shadow"
              >
                Go
              </button>
            </form>

            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(linkSymbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm rounded-xl border border-[var(--cardBorder)] px-3 py-2 hover:bg-[color:var(--bg)/0.2]"
              title="Open on tradingview.com"
            >
              Open in TradingView
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--cardBorder)] bg-[var(--card)] p-2">
            <TradingViewChart symbol={embedSymbol} theme="dark" height={720} />
          </div>

          <p className="mt-6 text-xs text-[var(--muted)]">Live chart by TradingView.</p>
        </div>
      </section>

      {/* Overlay (kept inside top-level wrapper, BEFORE footer) */}
      {chartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-[color:var(--bg)/0.9] backdrop-blur-sm"
          onClick={() => setChartOpen(false)}
        >
          {/* prevent closing when clicking inside */}
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl sm:text-2xl font-semibold text-[var(--heading)]">
                Live Market Chart
              </h3>
              <button
                onClick={() => setChartOpen(false)}
                className="rounded-xl border border-[var(--cardBorder)] px-3 py-2 hover:bg-[color:var(--bg)/0.2]"
                title="Close"
              >
                Close
              </button>
            </div>

            <div
              className="rounded-2xl border border-[var(--cardBorder)] bg-[var(--card)] p-1"
              style={{ height: "calc(100% - 56px)" }}
            >
              <div className="h-full">
                <TradingViewChart symbol={embedSymbol} theme="dark" height="85vh" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Videos */}
      <section id="videos" className="border-y border-[var(--cardBorder)] bg-[var(--bgMuted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center">Market Insights & Walkthroughs</h2>
          <p className="mt-3 text-[var(--muted)] text-center max-w-2xl mx-auto">Coming soon â€”mdash; live analysis & strategy breakdowns.</p>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--cardBorder)] flex flex-col items-center justify-center p-6 h-64"><PlayCircle className="h-12 w-12 text-[var(--accent)]" /><span className="mt-4 text-[var(--muted)]">Video Placeholder #1</span></div>
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--cardBorder)] flex flex-col items-center justify-center p-6 h-64"><PlayCircle className="h-12 w-12 text-[var(--accent)]" /><span className="mt-4 text-[var(--muted)]">Video Placeholder #2</span></div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-semibold">From Institutional Playbook to Public Access</h3>
            <p className="mt-3 text-[var(--muted)]">
              MacroStructure has delivered reliable market analysis for years â€”mdash; connecting fundamentals and technicals across Crypto, FX, Commodities, Stocks, Bonds, Options, Futures, and Indices. Now, weâ€™rsquo;re putting the same strategy directly in your hands so you can take a front-row seat at the battlefield and trade with structure, discipline, and clarity.
            </p>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--cardBorder)]"><div className="font-semibold">Institutional Audience</div><div className="text-sm text-[var(--muted)]">Trusted by professionals across prop, desks, and serious independents.</div></div>
              <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--cardBorder)]"><div className="font-semibold">Content + Tools</div><div className="text-sm text-[var(--muted)]">Daily structure notes, FXStreet posts, and indicators that align.</div></div>
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--cardBorder)]">
            <div className="flex items-center gap-2"><Users className="h-5 w-5"/><span className="text-sm text-[var(--muted)]">What traders say</span></div>
            <div className="mt-4 space-y-4 text-sm text-[var(--muted)]">
              <p>â€œThe levels are there before price. Itâ€™rsquo;s like having the map.â€</p>
              <p>â€œAlpha sets the frame, Beta times the strike. Clean.â€</p>
              <p>â€œFinally, a rule-set that keeps me from chasing.â€</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[var(--cardBorder)] bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-2xl font-semibold">FAQ</h3>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--cardBorder)]"><div className="font-semibold">What platforms do you support?</div><div className="text-[var(--muted)] text-sm mt-2">TradingView indicators (invite-only). Futures, FX, Crypto, Commodities, Bonds.</div></div>
            <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--cardBorder)]"><div className="font-semibold">How do I get access?</div><div className="text-[var(--muted)] text-sm mt-2">Message @Rotuma with your TradingView username. Youâ€™rsquo;ll receive 14-day access.</div></div>
            <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--cardBorder)]"><div className="font-semibold">Whatâ€™rsquo;s included?</div><div className="text-[var(--muted)] text-sm mt-2">Alpha & Beta indicators, the 25-page guide, and regular structure notes/playbooks.</div></div>
            <div className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--cardBorder)]"><div className="font-semibold">Is this financial advice?</div><div className="text-[var(--muted)] text-sm mt-2">No. Educational content and research tools only.</div></div>
          </div>
          <p className="mt-8 text-xs text-[var(--muted)]">Disclaimer: The materials are for informational purposes only and do not constitute investment advice.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--cardBorder)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-sm text-[var(--muted)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>Â© {new Date().getFullYear()} MacroStructure Connect. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#trial" className="hover:text-white">Contact</a>
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="hover:text-white">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


