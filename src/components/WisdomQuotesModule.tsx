import React, { useState } from "react";
import { Figure, QuoteItem, UserProfile } from "../types";
import { sound } from "../utils/audio";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Share2,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Search,
} from "lucide-react";

interface Props {
  savedQuotes: QuoteItem[];
  setSavedQuotes: (quotes: QuoteItem[]) => void;
  user: UserProfile;
  onBadgeUnlock: (badgeId: string) => void;
}

export const FIGURES: Figure[] = [
  { id: "einstein", name: "Albert Einstein", emoji: "🧠", era: "Physicist · 1879–1955", themes: "curiosity, imagination, logic, wonder" },
  { id: "jobs", name: "Steve Jobs", emoji: "🍎", era: "Innovator · 1955–2011", themes: "focus, design, disruption, think different" },
  { id: "maya", name: "Maya Angelou", emoji: "✍️", era: "Poet & Author · 1928–2014", themes: "resilience, grace, rising, courage" },
  { id: "ali", name: "Muhammad Ali", emoji: "🥊", era: "Champion · 1942–2016", themes: "confidence, greatness, heart, will" },
  { id: "suntzu", name: "Sun Tzu", emoji: "⚔️", era: "Strategist · 544–496 BC", themes: "strategy, discipline, mastery, victory" },
  { id: "davinci", name: "Leonardo da Vinci", emoji: "🎨", era: "Polymath · 1452–1519", themes: "wonder, art, discovery, mastery" },
  { id: "mandela", name: "Nelson Mandela", emoji: "🕊️", era: "Statesman · 1918–2013", themes: "perseverance, leadership, freedom" },
  { id: "oprah", name: "Oprah Winfrey", emoji: "👑", era: "Media Icon · 1954–present", themes: "purpose, growth, gratitude, vision" },
  { id: "rumi", name: "Rumi", emoji: "🌹", era: "Mystic Poet · 1207–1273", themes: "love, soul, transcendence, yearning" },
  { id: "aurelius", name: "Marcus Aurelius", emoji: "🏛️", era: "Stoic Emperor · 121–180 AD", themes: "stoicism, duty, mental citadel, virtue" },
  { id: "tesla", name: "Nikola Tesla", emoji: "⚡", era: "Inventor · 1856–1943", themes: "energy, frequency, future, breakthrough" },
  { id: "tubman", name: "Harriet Tubman", emoji: "🌟", era: "Freedom Fighter · 1822–1913", themes: "courage, liberation, faith, boldness" },
  { id: "seneca", name: "Seneca", emoji: "📜", era: "Philosopher · 4 BC–65 AD", themes: "time ownership, calm mind, resilience" },
  { id: "frida", name: "Frida Kahlo", emoji: "🌺", era: "Artist · 1907–1954", themes: "raw strength, authenticity, passion" },
  { id: "mlk", name: "Martin Luther King Jr.", emoji: "✊", era: "Leader · 1929–1968", themes: "justice, vision, nonviolence, dignity" },
  { id: "aristotle", name: "Aristotle", emoji: "🏛️", era: "Philosopher · 384–322 BC", themes: "virtue, excellence, habits, logic" },
];

const TOPICS = [
  "Momentum & Relentless Execution",
  "Overcoming Resistance & Self-Doubt",
  "High Ambition & Creating Legacy",
  "Daily Discipline & Habit Mastery",
  "Creative Breakthroughs & Innovation",
  "Stoic Resilience & Mental Calm",
  "Strategic Focus & Eliminating Distraction",
];

export const WisdomQuotesModule: React.FC<Props> = ({
  savedQuotes,
  setSavedQuotes,
  user,
  onBadgeUnlock,
}) => {
  const [activeTab, setActiveTab] = useState<"channel" | "saved">("channel");
  const [selectedFigure, setSelectedFigure] = useState<Figure>(FIGURES[0]);
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuote, setCurrentQuote] = useState<QuoteItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredFigures = FIGURES.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.themes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChannelWisdom = async () => {
    sound.playClick();
    setLoading(true);
    setCurrentQuote(null);
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch("/api/channel-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figureName: selectedFigure.name,
          figureEra: selectedFigure.era,
          figureThemes: selectedFigure.themes,
          topic: selectedTopic,
          userName: user.name,
        }),
      });

      if (!response.ok) throw new Error("Quote generation failed");
      const data = await response.json();

      const item: QuoteItem = {
        id: Date.now(),
        quote: data.quote,
        context: data.context,
        practicalTakeaway: data.practicalTakeaway,
        memorableKeyword: data.memorableKeyword,
        fig: selectedFigure,
        saved: false,
        createdAt: new Date().toISOString(),
      };

      setCurrentQuote(item);
      sound.playSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuote = (quoteToSave: QuoteItem) => {
    sound.playClick();
    if (savedQuotes.some((q) => q.quote === quoteToSave.quote)) return;

    const updated = [{ ...quoteToSave, saved: true }, ...savedQuotes];
    setSavedQuotes(updated);
    if (currentQuote && currentQuote.id === quoteToSave.id) {
      setCurrentQuote({ ...currentQuote, saved: true });
    }
    onBadgeUnlock("quote_saved");
    sound.playSuccess();
  };

  const handleRemoveSaved = (id: number | string) => {
    sound.playClick();
    setSavedQuotes(savedQuotes.filter((q) => q.id !== id));
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      sound.speak(text, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleCopy = (text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("channel");
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              activeTab === "channel"
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/20"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            Channel Figure Wisdom
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("saved");
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "saved"
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/20"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            Saved Wisdom ({savedQuotes.length})
          </button>
        </div>
      </div>

      {activeTab === "channel" ? (
        <div className="space-y-6">
          {/* Figure Selection Grid */}
          <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Select Visionary Figure
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Tap any iconic figure to channel their authentic mindset
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter figure or theme..."
                  className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 w-full sm:w-48"
                />
              </div>
            </div>

            {/* Figures Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {filteredFigures.map((fig) => {
                const isSelected = selectedFigure.id === fig.id;
                return (
                  <button
                    key={fig.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedFigure(fig);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10 scale-[1.02]"
                        : "bg-white/[0.03] border-white/5 hover:border-amber-500/40 text-white/70"
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{fig.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-white truncate">{fig.name}</div>
                      <div className="text-[10px] text-white/40 truncate">{fig.era.split("·")[0]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Figure Card & Topic Form */}
          <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-3xl">{selectedFigure.emoji}</span>
              <div>
                <h3 className="text-sm font-bold text-amber-300">{selectedFigure.name}</h3>
                <p className="text-xs text-white/60">
                  {selectedFigure.era} · <span className="italic">{selectedFigure.themes}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-white/50 mb-1 font-semibold uppercase tracking-wider">
                  Select Topic / Momentum Catalyst
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-[#08061c] border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t} className="bg-[#08061c]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleChannelWisdom}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Channeling {selectedFigure.name}'s Worldview...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Channel Wisdom from {selectedFigure.name}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Quote Display */}
          {currentQuote && (
            <div className="bg-[#0e0c28]/95 backdrop-blur-2xl border border-amber-400/40 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-amber-500/5 select-none text-9xl font-black pointer-events-none">
                "
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentQuote.fig.emoji}</span>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">{currentQuote.fig.name}</h4>
                    <span className="text-[10px] text-white/40">{currentQuote.fig.era}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpeak(`"${currentQuote.quote}" - ${currentQuote.fig.name}`)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-amber-400 transition"
                    title="Read quote aloud"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(`"${currentQuote.quote}" — ${currentQuote.fig.name}`)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-amber-400 transition"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveQuote(currentQuote)}
                    disabled={currentQuote.saved}
                    className={`p-2 rounded-xl border transition ${
                      currentQuote.saved
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/5 border-white/10 hover:border-amber-500/40 text-white/70 hover:text-amber-400"
                    }`}
                    title={currentQuote.saved ? "Saved" : "Bookmark quote"}
                  >
                    {currentQuote.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <blockquote className="text-base sm:text-lg italic font-serif leading-relaxed text-white/95 my-4 border-l-2 border-amber-400 pl-4">
                "{currentQuote.quote}"
              </blockquote>

              {currentQuote.context && (
                <p className="text-xs text-white/60 bg-white/[0.03] p-3 rounded-xl border border-white/5 my-3">
                  <strong className="text-amber-300 block mb-0.5">Philosophy Context:</strong>
                  {currentQuote.context}
                </p>
              )}

              {currentQuote.practicalTakeaway && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
                  <strong className="text-amber-400 block mb-0.5 uppercase tracking-wider text-[10px]">
                    Practical Application Today:
                  </strong>
                  {currentQuote.practicalTakeaway}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Saved Quotes Tab */
        <div className="space-y-4">
          {savedQuotes.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#0e0c28]/60 border border-white/5 rounded-2xl">
              <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white/70">No saved quotes yet</h3>
              <p className="text-xs text-white/40 mt-1">
                Channel quotes from historical figures and tap the bookmark icon to save them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {savedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0e0c28]/90 border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{q.fig.emoji}</span>
                      <span className="text-xs font-bold text-amber-300">{q.fig.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSpeak(`"${q.quote}" - ${q.fig.name}`)}
                        className="p-1.5 text-white/40 hover:text-amber-400 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(q.id)}
                        className="p-1.5 text-white/40 hover:text-rose-400 transition"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>
                  </div>

                  <blockquote className="text-sm italic text-white/90 leading-relaxed font-serif">
                    "{q.quote}"
                  </blockquote>

                  {q.practicalTakeaway && (
                    <div className="text-[11px] text-amber-200/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <strong>Takeaway:</strong> {q.practicalTakeaway}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
