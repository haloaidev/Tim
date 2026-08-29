import React, { useState, useEffect } from "react";
import { UserProfile, Goal, MoodEntry } from "../types";
import { sound } from "../utils/audio";
import {
  Sparkles,
  Flame,
  Target,
  Heart,
  TrendingUp,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Circle,
  Zap,
  Clock,
  Compass,
  MessageSquare,
} from "lucide-react";

interface Props {
  user: UserProfile;
  goals: Goal[];
  moods: MoodEntry[];
  streak: number;
  onNavigate: (tab: string, prompt?: string) => void;
  onToggleGoal: (id: number) => void;
}

const DEFAULT_QUOTES = [
  {
    quote: "Don't wait for motivation. Build it step by step.",
    author: "MotivaBOT Principle",
    theme: "Execution",
  },
  {
    quote: "The secret of getting ahead is getting started. Break your complex overwhelming tasks into small manageable tasks.",
    author: "Mark Twain",
    theme: "Momentum",
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    theme: "Habit",
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    theme: "Action",
  },
  {
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    theme: "Initiative",
  },
];

export const TodayDashboard: React.FC<Props> = ({
  user,
  goals,
  moods,
  streak,
  onNavigate,
  onToggleGoal,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quickInput, setQuickInput] = useState("");

  const curQuote = DEFAULT_QUOTES[quoteIndex % DEFAULT_QUOTES.length];

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: "🌅", tag: "Morning Focus" };
    if (hour < 18) return { text: "Good afternoon", icon: "⚡", tag: "Peak Execution" };
    return { text: "Good evening", icon: "🌙", tag: "Evening Momentum" };
  };

  const greeting = getGreeting();

  const completedGoals = goals.filter((g) => g.completed).length;
  const goalCompletionPct = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const todayStr = new Date().toDateString();
  const todayMood = moods.find((m) => new Date(m.timestamp).toDateString() === todayStr);

  const moodEmojis: Record<string, string> = {
    excellent: "😁 Peak",
    good: "😊 Focused",
    okay: "😐 Neutral",
    down: "😟 Low",
    sad: "😢 Drained",
  };

  const handleSpeakQuote = () => {
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      sound.speak(`"${curQuote.quote}" by ${curQuote.author}`, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleShuffleQuote = () => {
    sound.playClick();
    setQuoteIndex((prev) => (prev + 1) % DEFAULT_QUOTES.length);
    if (isSpeaking) {
      sound.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const handleQuickCoachSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onNavigate("coach", quickInput);
  };

  return (
    <div className="space-y-6">
      {/* Top Split Section: System Analysis & Daily Mood Index */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Analysis Card (Spans 2 columns on lg) */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
          {/* Golden Aura Glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="z-10">
            <span className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-[0.2em] mb-2 block">
              System Analysis · {greeting.tag}
            </span>
            <h3 className="text-xl sm:text-2xl font-light leading-relaxed max-w-xl text-white">
              You are performing in the <span className="text-yellow-400 font-bold">top 2%</span> of execution consistency this week. Your peak focus window is calibrated for{" "}
              <span className="underline underline-offset-4 decoration-yellow-500/40 italic font-medium capitalize">
                {user.preferredTime === "morning" ? "10:15 AM" : user.preferredTime === "afternoon" ? "2:30 PM" : user.preferredTime === "night" ? "9:00 PM" : "Anytime Flow"}
              </span>
              .
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10 mt-6">
            <button
              type="button"
              onClick={() => onNavigate("coach", "Initiate a high-intensity 45-minute deep focus sprint protocol right now.")}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-full transition-all shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Activate Deep Focus
            </button>
            <button
              type="button"
              onClick={() => onNavigate("goals")}
              className="px-5 py-2.5 border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-xs font-bold rounded-full hover:bg-white/10 transition-all cursor-pointer uppercase tracking-wider"
            >
              View Performance
            </button>
          </div>
        </div>

        {/* Daily Mood Index Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[220px]">
          <div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 block">
              Daily Mood Index
            </span>

            {/* Mood Emojis Row */}
            <div className="flex justify-between items-center px-1 pt-1">
              {[
                { mood: "sad", label: "DRAINED", emoji: "😢" },
                { mood: "okay", label: "NEUTRAL", emoji: "😐" },
                { mood: "good", label: "FOCUSED", emoji: "😊" },
                { mood: "excellent", label: "PEAK", emoji: "😁" },
              ].map((m) => {
                const isActive = todayMood ? todayMood.mood === m.mood : m.mood === "good";

                return (
                  <button
                    key={m.mood}
                    type="button"
                    onClick={() => onNavigate("mood")}
                    className={`text-center cursor-pointer transition-all ${
                      isActive
                        ? "scale-115 border-b-2 border-yellow-500 pb-1 font-bold text-yellow-400"
                        : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl">{m.emoji}</div>
                    <div className={`text-[8px] mt-1 tracking-wider ${isActive ? "text-yellow-400 font-bold" : "text-white/60"}`}>
                      {m.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] text-white/40 leading-relaxed italic">
              'Consistency velocity is up {Math.min(100, 10 + streak * 4)}% with your {user.motivationStyle} motivation calibration.'
            </p>
          </div>
        </div>
      </section>

      {/* Second Split Section: Active Targets & Nova AI Coach Quick Window */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Targets Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-400" />
                Active Growth Targets
              </h4>
              <span className="text-xs font-semibold text-yellow-500/90">
                {completedGoals}/{goals.length} Complete
              </span>
            </div>

            <div className="space-y-5">
              {goals.length === 0 ? (
                <div className="text-xs text-white/40 italic py-4 text-center">
                  No active targets yet. Add your first goal to ignite momentum.
                </div>
              ) : (
                goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white/90 truncate max-w-[280px] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleGoal(goal.id)}
                          className="hover:text-yellow-400 transition"
                        >
                          {goal.completed ? "✅" : "○"}
                        </button>
                        <span className={goal.completed ? "line-through text-white/40" : ""}>
                          {goal.text}
                        </span>
                      </span>
                      <span className="text-yellow-400 font-bold ml-2 shrink-0">{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate("goals")}
              className="text-[10px] font-bold text-yellow-400 border border-yellow-500/30 px-3.5 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors uppercase tracking-wider cursor-pointer"
            >
              + Add New Target
            </button>
          </div>
        </div>

        {/* Nova AI Coach Interactive Terminal Card */}
        <div className="bg-[#0a081e] border border-yellow-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-2xl shadow-black/40">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-yellow-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Nova AI Coach</h4>
                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    OPERATIONAL · READY
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("coach")}
                className="text-[10px] text-yellow-400/80 hover:text-yellow-300 font-bold uppercase tracking-wider"
              >
                Expand Coach ↗
              </button>
            </div>

            {/* Quick Dialogue Preview */}
            <div className="bg-black/40 rounded-2xl p-4 mb-4 overflow-hidden border border-white/5 space-y-3">
              <div className="bg-white/5 p-3 rounded-xl rounded-tl-none max-w-[90%] border border-white/5">
                <p className="text-xs text-white/80 leading-relaxed italic">
                  'I noticed your focus window is approaching. What single high-leverage friction shall we eliminate first?'
                </p>
              </div>
              <div className="bg-yellow-500/15 p-3 rounded-xl rounded-tr-none ml-auto max-w-[90%] text-right border border-yellow-500/20">
                <p className="text-xs text-yellow-100">
                  Let's break down my next milestone into 15-minute action sprints.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleQuickCoachSubmit} className="relative">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Ask Nova for strategy or mindset reset..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 h-9 w-9 bg-yellow-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-yellow-400 transition-colors text-black"
              title="Send to Coach"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Daily Anchor Quote */}
      <div className="bg-[#0a081e]/90 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Daily Anchor Quote
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSpeakQuote}
              title={isSpeaking ? "Mute" : "Read aloud"}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-yellow-400 transition cursor-pointer"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-yellow-400 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleShuffleQuote}
              title="Next Quote"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-yellow-400 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <blockquote className="text-base sm:text-lg font-medium italic text-white/90 leading-relaxed my-2">
          "{curQuote.quote}"
        </blockquote>

        <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
          <span className="font-semibold text-yellow-300">— {curQuote.author}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
            {curQuote.theme}
          </span>
        </div>
      </div>

      {/* Quick AI Coaching Accelerators */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Quick AI Coaching Accelerators
          </h3>
          <span className="text-xs text-white/40">Select a prompt to ignite</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "Break Down My Next Goal",
              desc: "Deconstruct your top objective into immediate 15-minute action steps.",
              prompt: "Help me break down my top active goal into clear, immediate actionable steps for today.",
              icon: "🎯",
            },
            {
              title: "Overcome Friction & Procrastination",
              desc: "Get an empathetic, high-leverage reset to cut through resistance.",
              prompt: "I am feeling resistance and procrastinating on what I need to do right now. Give me a concrete reset protocol.",
              icon: "🛡️",
            },
            {
              title: "Daily Momentum Audit",
              desc: "Synthesize your wins, audit energy, and plan tomorrow's power hours.",
              prompt: "Let's do a fast daily momentum audit: review my progress, celebrate micro-wins, and set tomorrow's focus.",
              icon: "⚡",
            },
          ].map((q) => (
            <button
              key={q.title}
              type="button"
              onClick={() => onNavigate("coach", q.prompt)}
              className="p-5 rounded-3xl bg-[#0a081e]/80 border border-yellow-500/15 hover:border-yellow-500/40 text-left transition hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="text-2xl mb-2">{q.icon}</div>
                <div className="font-bold text-sm text-white group-hover:text-yellow-300 transition">
                  {q.title}
                </div>
                <div className="text-xs text-white/50 mt-1 leading-relaxed">{q.desc}</div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-yellow-400">
                Launch Coach <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
