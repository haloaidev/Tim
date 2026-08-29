import React, { useState, useEffect } from "react";
import { UserProfile, Goal, QuoteItem } from "../types";
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
  Zap,
  Target,
  Flame,
  Lightbulb,
  Award,
  Calendar,
} from "lucide-react";

interface DailyQuoteModuleProps {
  user: UserProfile;
  goals: Goal[];
  savedQuotes: QuoteItem[];
  setSavedQuotes: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  onBadgeUnlock?: (badgeId: string) => void;
  onNavigate: (tab: string, prompt?: string) => void;
}

const FEATURED_DAILY_QUOTES = [
  {
    id: "dq-1",
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    theme: "Discipline & Action",
    reflection: "Action precedes momentum. The friction you feel right now is simply inertia waiting to be broken.",
    microChallenge: "Execute 10 minutes of concentrated work on your top priority right now without interruption.",
  },
  {
    id: "dq-2",
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    theme: "Habit Mastery",
    reflection: "Your future is hidden in your daily routine. Today's execution defines tomorrow's reality.",
    microChallenge: "Complete your main habit check-in for today and double down on your focus window.",
  },
  {
    id: "dq-3",
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    theme: "Mindset & Vision",
    reflection: "Doubt vanishes when confronted with immediate physical execution. Move before your mind makes excuses.",
    microChallenge: "Write down the single barrier holding you back and erase it with one bold decision.",
  },
  {
    id: "dq-4",
    quote: "It always seems impossible until it is done.",
    author: "Nelson Mandela",
    theme: "Resilience",
    reflection: "Break massive targets into 15-minute micro-sprints. Impossible is just an un-deconstructed goal.",
    microChallenge: "Use the AI Goal Deconstructor to slice your hardest task into 3 sub-steps.",
  },
  {
    id: "dq-5",
    quote: "Focus is a matter of deciding what things you're NOT going to do.",
    author: "John Carmack",
    theme: "Hyper Focus",
    reflection: "Saying no to distractions is the highest form of self-respect for your vision.",
    microChallenge: "Close all unused browser tabs and put your phone in another room for 45 minutes.",
  },
];

const QUOTE_CATEGORIES = [
  "All Inspirations",
  "Mindset & Mastery",
  "Discipline & Action",
  "Resilience",
  "Leadership & Vision",
  "Hyper Focus",
];

export const DailyQuoteModule: React.FC<DailyQuoteModuleProps> = ({
  user,
  goals,
  savedQuotes,
  setSavedQuotes,
  onBadgeUnlock,
  onNavigate,
}) => {
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Pick deterministic quote based on day of year, or custom generated
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const initialDailyQuote = FEATURED_DAILY_QUOTES[dayOfYear % FEATURED_DAILY_QUOTES.length];

  const [currentQuote, setCurrentQuote] = useState(initialDailyQuote);
  const [selectedCategory, setSelectedCategory] = useState("All Inspirations");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goals.length > 0 ? goals[0].id : null
  );

  // Check if current quote is saved
  const isSaved = savedQuotes.some((q) => q.quote === currentQuote.quote);

  const handleToggleSave = () => {
    sound.playClick();
    if (isSaved) {
      setSavedQuotes((prev) => prev.filter((q) => q.quote !== currentQuote.quote));
    } else {
      const newQuoteItem: QuoteItem = {
        id: "daily-" + Date.now(),
        quote: currentQuote.quote,
        context: currentQuote.reflection,
        practicalTakeaway: currentQuote.microChallenge,
        memorableKeyword: currentQuote.theme,
        fig: {
          name: currentQuote.author,
          emoji: "✨",
        },
        saved: true,
        createdAt: new Date().toISOString(),
      };
      setSavedQuotes((prev) => [newQuoteItem, ...prev]);
      if (onBadgeUnlock) onBadgeUnlock("wisdom_keeper");
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const fullText = `${currentQuote.quote}. Authored by ${currentQuote.author}. Reflection: ${currentQuote.reflection}`;
      sound.speak(fullText, () => setIsSpeaking(false));
    }
  };

  const handleCopy = () => {
    sound.playClick();
    const textToCopy = `"${currentQuote.quote}" — ${currentQuote.author}\n\nVia MotivaBOT Pro Daily Inspiration`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateAIQuote = async () => {
    sound.playClick();
    setGeneratingAI(true);
    const activeGoal = goals.find((g) => g.id === selectedGoalId)?.text || "Personal Mastery";

    try {
      const res = await fetch("/api/daily-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: user,
          activeGoalText: activeGoal,
          category: selectedCategory === "All Inspirations" ? "Mindset & Mastery" : selectedCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentQuote({
          id: "ai-" + Date.now(),
          quote: data.quote,
          author: data.author,
          theme: data.theme || selectedCategory,
          reflection: data.reflection,
          microChallenge: data.microChallenge,
        });
        sound.playSuccess();
        if (onBadgeUnlock) onBadgeUnlock("wisdom_keeper");
      }
    } catch (err) {
      console.error("Failed to generate AI quote", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const filteredPresetQuotes = FEATURED_DAILY_QUOTES.filter(
    (q) => selectedCategory === "All Inspirations" || q.theme === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold text-xs mb-2 border border-yellow-500/30">
            <Calendar className="w-3.5 h-3.5" /> {todayStr} · Daily Dose of Inspiration
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Daily Motivational Quote
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Calibrated daily wisdom to fuel your mindset, sharpen your focus, and power your goal execution.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateAIQuote}
          disabled={generatingAI}
          className="z-10 px-5 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${generatingAI ? "animate-spin" : ""}`} />
          <span>{generatingAI ? "Generating..." : "Generate AI Custom Quote"}</span>
        </button>
      </div>

      {/* Hero Quote of the Day Card */}
      <div className="relative bg-[#0a081e] border border-yellow-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                ✨ {currentQuote.theme}
              </span>
              <span className="text-xs text-white/40 font-medium hidden sm:inline">
                Daily Anchor Wisdom
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeak}
                title={isSpeaking ? "Stop Voice Reader" : "Listen to Quote"}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isSpeaking
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-300 animate-pulse"
                    : "bg-white/5 border-white/10 hover:border-yellow-500/40 text-white/70 hover:text-yellow-400"
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                title="Copy Quote"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/40 text-white/70 hover:text-yellow-400 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleSave}
                title={isSaved ? "Remove from Saved Quotes" : "Save Quote to Vault"}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isSaved
                    ? "bg-yellow-500 text-black border-yellow-400 font-bold"
                    : "bg-white/5 border-white/10 hover:border-yellow-500/40 text-white/70 hover:text-yellow-400"
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Main Quote Text */}
          <blockquote className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-relaxed italic tracking-tight font-serif">
            "{currentQuote.quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-base shadow-md">
              {currentQuote.author.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-400">{currentQuote.author}</div>
              <div className="text-xs text-white/50">Inspiring Mentor & Mindset Catalyst</div>
            </div>
          </div>

          {/* Psychological Reflection & Actionable Micro-Challenge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            {/* Reflection */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Executive Reflection
              </div>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {currentQuote.reflection}
              </p>
            </div>

            {/* Micro Challenge */}
            <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" /> 10-Minute Micro-Challenge
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playSuccess();
                    setChallengeCompleted(!challengeCompleted);
                    if (!challengeCompleted && onBadgeUnlock) onBadgeUnlock("streak_3");
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    challengeCompleted
                      ? "bg-green-500 text-black"
                      : "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                  }`}
                >
                  {challengeCompleted ? "✓ Completed" : "Mark Done"}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-yellow-100/90 leading-relaxed font-medium">
                {currentQuote.microChallenge}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Quote Personalizer for Active Goal */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              Tailor Daily Inspiration to Your Active Goal
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Select one of your current targets to generate a custom motivation prompt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("coach", `Give me a deep motivational breakdown for goal: "${goals.find((g) => g.id === selectedGoalId)?.text || "My top goal"}"`)}
            className="text-xs font-bold text-yellow-400 border border-yellow-500/30 px-3.5 py-2 rounded-xl hover:bg-yellow-500/10 transition cursor-pointer self-start sm:self-auto"
          >
            Discuss with AI Coach ↗
          </button>
        </div>

        {goals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((goal) => {
              const isSelected = selectedGoalId === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    setSelectedGoalId(goal.id);
                    sound.playClick();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-yellow-500/15 border-yellow-500 text-yellow-200 font-semibold"
                      : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      {goal.category}
                    </span>
                    <span className="font-bold text-yellow-400">{goal.progress}%</span>
                  </div>
                  <div className="text-xs font-medium truncate">{goal.text}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-white/40 italic py-2">
            No goals found. Add a goal in the Goals tab to unlock tailored inspiration!
          </div>
        )}
      </div>

      {/* Category Deck & Preset Quotes Archive */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-yellow-400" />
            Inspiration Vault & Category Decks
          </h3>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUOTE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  sound.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quotes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPresetQuotes.map((q) => {
            const isSelectedQuote = currentQuote.quote === q.quote;
            return (
              <div
                key={q.id}
                onClick={() => {
                  setCurrentQuote(q);
                  sound.playClick();
                }}
                className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden ${
                  isSelectedQuote
                    ? "bg-gradient-to-br from-[#120e32] to-[#1a1440] border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                    : "bg-[#0a081e]/80 border-white/10 hover:border-yellow-500/30 hover:bg-white/5"
                }`}
              >
                {isSelectedQuote && (
                  <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-black">
                    ACTIVE ANCHOR
                  </div>
                )}
                <div className="text-xs font-bold text-yellow-400/90 mb-2">{q.theme}</div>
                <blockquote className="text-sm font-semibold text-white leading-relaxed italic mb-3">
                  "{q.quote}"
                </blockquote>
                <div className="flex items-center justify-between text-xs text-white/50 pt-3 border-t border-white/5">
                  <span className="font-bold text-yellow-300">— {q.author}</span>
                  <span className="text-[10px] text-white/40 group-hover:text-yellow-400 transition">
                    Tap to set active →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
