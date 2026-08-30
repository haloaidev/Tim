import React, { useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  Goal,
  MoodEntry,
  QuoteItem,
  AffirmationItem,
} from "./types";
import { sound } from "./utils/audio";
import confetti from "canvas-confetti";
import { ThreeBackground } from "./components/ThreeBackground";
import { PersonalityTest } from "./components/PersonalityTest";
import { TodayDashboard } from "./components/TodayDashboard";
import { AICoachChat } from "./components/AICoachChat";
import { GoalsModule } from "./components/GoalsModule";
import { MoodLoggerModule } from "./components/MoodLoggerModule";
import { WisdomQuotesModule } from "./components/WisdomQuotesModule";
import { AffirmationsModule } from "./components/AffirmationsModule";
import { HoroscopeModule } from "./components/HoroscopeModule";
import { BadgesModule, BADGE_DEFS } from "./components/BadgesModule";
import { ExportModule } from "./components/ExportModule";
import { DailyQuoteModule } from "./components/DailyQuoteModule";
import { UserProfileModule } from "./components/UserProfileModule";
import { VoxGameModule } from "./components/VoxGameModule";
import { dbManager } from "./utils/db";

import {
  Home,
  Bot,
  Target,
  Heart,
  Compass,
  Zap,
  Star,
  Award,
  Download,
  Flame,
  Volume2,
  VolumeX,
  User,
  Sparkles,
  RefreshCw,
  Layers,
} from "lucide-react";

const INITIAL_HABITS = [
  "Hydrate with 2L pure water",
  "30-minute high-energy workout or walk",
  "10 minutes mindful meditation / silence",
  "Read 15 pages of non-fiction",
  "Zero-distraction deep work sprint",
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 1,
    text: "Launch the Q1 product roadmap with supreme clarity",
    category: "Career & Leadership",
    priority: "high",
    completed: false,
    progress: 50,
    createdAt: new Date().toISOString(),
    milestones: [
      { title: "Define high-level architecture", description: "Map out key interfaces", done: true },
      { title: "Execute user flow and UI tests", description: "Verify end-to-end responsiveness", done: true },
      { title: "Deploy to production environment", description: "Run automated health verification", done: false },
    ],
  },
  {
    id: 2,
    text: "Maintain a 14-day consecutive streak of daily morning exercise",
    category: "Health & Fitness",
    priority: "medium",
    completed: false,
    progress: 35,
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  // User Profile
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("mb_user_profile_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>("today");
  const [coachPrompt, setCoachPrompt] = useState<string | undefined>(undefined);

  // Goals
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem("mb_goals_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GOALS;
  });

  // Moods
  const [moods, setMoods] = useState<MoodEntry[]>(() => {
    try {
      const saved = localStorage.getItem("mb_moods_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Habits
  const [habits, setHabits] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("mb_habits_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HABITS;
  });

  // Streak
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("mb_streak_pro");
      if (saved) return Number(saved);
    } catch {}
    return 1;
  });

  // Badges
  const [badges, setBadges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("mb_badges_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return ["first_goal"];
  });

  // Saved Quotes
  const [savedQuotes, setSavedQuotes] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem("mb_saved_quotes_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Favorite Affirmations
  const [favAffirmations, setFavAffirmations] = useState<AffirmationItem[]>(() => {
    try {
      const saved = localStorage.getItem("mb_fav_affirmations_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Sound State
  const [isSoundMuted, setIsSoundMuted] = useState(sound.getMuted());
  const [badgeToast, setBadgeToast] = useState<{ id: string; label: string; icon: string } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem("mb_user_profile_pro", JSON.stringify(user));
      localStorage.setItem("mb_goals_pro", JSON.stringify(goals));
      localStorage.setItem("mb_moods_pro", JSON.stringify(moods));
      localStorage.setItem("mb_habits_pro", JSON.stringify(habits));
      localStorage.setItem("mb_streak_pro", String(streak));
      localStorage.setItem("mb_badges_pro", JSON.stringify(badges));
      localStorage.setItem("mb_saved_quotes_pro", JSON.stringify(savedQuotes));
      localStorage.setItem("mb_fav_affirmations_pro", JSON.stringify(favAffirmations));
    } catch {}
  }, [user, goals, moods, habits, streak, badges, savedQuotes, favAffirmations]);

  // Badge Unlock Handler
  const unlockBadge = useCallback(
    (badgeId: string) => {
      if (!badges.includes(badgeId)) {
        const nextBadges = [...badges, badgeId];
        setBadges(nextBadges);
        sound.playSuccess();
        const badgeDef = BADGE_DEFS.find((b) => b.id === badgeId);
        if (badgeDef) {
          setBadgeToast({ id: badgeDef.id, label: badgeDef.label, icon: badgeDef.icon });
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
              colors: ["#F59E0B", "#FBBF24", "#FFFFFF"],
            });
          } catch {}
          setTimeout(() => setBadgeToast(null), 4000);
        }
      }
    },
    [badges]
  );

  const toggleSound = () => {
    const nextState = sound.toggleMute();
    setIsSoundMuted(nextState);
  };

  const handleNavigate = (tab: string, prompt?: string) => {
    sound.playClick();
    if (prompt) setCoachPrompt(prompt);
    setActiveTab(tab);
  };

  const handleToggleGoal = (id: number) => {
    sound.playClick();
    const updated = goals.map((g) => {
      if (g.id === id) {
        const nextCompleted = !g.completed;
        if (nextCompleted) {
          sound.playSuccess();
          unlockBadge("goal_done");
          try {
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
          } catch {}
        }
        return {
          ...g,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : 0,
        };
      }
      return g;
    });
    setGoals(updated);
  };

  const handleImportData = (imported: any) => {
    if (imported.user) setUser(imported.user);
    if (imported.goals) setGoals(imported.goals);
    if (imported.moods) setMoods(imported.moods);
    if (imported.habits) setHabits(imported.habits);
    if (imported.streak) setStreak(imported.streak);
    if (imported.badges) setBadges(imported.badges);
    if (imported.savedQuotes) setSavedQuotes(imported.savedQuotes);
    if (imported.favoriteAffirmations) setFavAffirmations(imported.favoriteAffirmations);
  };

  const handleResetAll = () => {
    if (confirm("Are you sure you want to reset all profile data? This cannot be undone.")) {
      sound.playClick();
      localStorage.clear();
      setUser(null);
      setGoals(INITIAL_GOALS);
      setMoods([]);
      setHabits(INITIAL_HABITS);
      setStreak(1);
      setBadges(["first_goal"]);
      setSavedQuotes([]);
      setFavAffirmations([]);
      setActiveTab("today");
    }
  };

  // If user has not completed onboarding personality test
  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#07051a] text-white flex items-center justify-center p-4">
        <ThreeBackground />
        <div className="relative z-10 w-full max-w-2xl">
          <PersonalityTest
            onComplete={(profile) => {
              setUser(profile);
              unlockBadge("first_goal");
            }}
          />
        </div>
      </div>
    );
  }

  // Navigation Items
  const NAV_ITEMS = [
    { id: "today", label: "Today", icon: Home },
    { id: "voxgame", label: "VOX AI Party", icon: Sparkles, badge: "NEW" },
    { id: "coach", label: "AI Coach", icon: Bot, badge: "AI" },
    { id: "dailyquote", label: "Daily Quote", icon: Zap },
    { id: "goals", label: "Goals", icon: Target, count: goals.length },
    { id: "mood", label: "Habits & Mood", icon: Heart },
    { id: "wisdom", label: "Wisdom", icon: Compass },
    { id: "affirmations", label: "Affirmations", icon: Zap },
    { id: "horoscope", label: "Cosmic", icon: Star },
    { id: "badges", label: "Ranks", icon: Award, count: badges.length },
    { id: "profile", label: "Profile & Theme", icon: User },
    { id: "export", label: "Vault", icon: Download },
  ];

  return (
    <div className="relative min-h-screen bg-[#07061a] text-white flex flex-col selection:bg-yellow-500 selection:text-black font-sans">
      {/* Dynamic 3D Three.js Interactive Background */}
      <ThreeBackground />

      {/* Main Container with Sophisticated Dark Sidebar & Canvas */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen w-full mx-auto">
        {/* Aside Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-yellow-600/20 bg-[#0a081e]/90 p-4 sm:p-6 flex flex-col justify-between backdrop-blur-md shrink-0">
          <div>
            {/* Logo / Header */}
            <div className="flex items-center justify-between md:justify-start gap-3 mb-6 md:mb-8">
              <button
                type="button"
                onClick={() => handleNavigate("today")}
                className="flex items-center gap-3 text-left group cursor-pointer"
              >
                <div className="h-9 w-9 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-black font-black text-xl italic">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-yellow-200 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    MOTIVA PRO X
                  </h1>
                  <p className="text-[9px] text-white/40 font-medium tracking-wider uppercase">
                    AI Execution Engine
                  </p>
                </div>
              </button>

              {/* Mobile Quick Action Buttons */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-2 rounded-xl border transition ${
                    isSoundMuted
                      ? "bg-white/5 border-white/10 text-white/40"
                      : "bg-yellow-500/15 border-yellow-500/30 text-yellow-300"
                  }`}
                  title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{streak}d</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl font-medium cursor-pointer transition-all text-xs sm:text-sm whitespace-nowrap shrink-0 md:shrink ${
                      isActive
                        ? "bg-white/5 border border-yellow-500/30 text-yellow-400 shadow-lg shadow-yellow-500/10 font-semibold"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-yellow-400" : "text-white/50"}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                          isActive
                            ? "bg-yellow-500 text-black"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && !item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Streak Card & Profile Footnote */}
          <div className="hidden md:flex flex-col gap-3 mt-6">
            {/* Streak Counter Box */}
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">
                  Current Streak
                </span>
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter flex items-end gap-1.5">
                {streak}{" "}
                <span className="text-xs uppercase not-italic text-white/40 mb-1 font-semibold">
                  Days
                </span>
              </div>
            </div>

            {/* Profile & Sound Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => handleNavigate("profile")}
                className="flex items-center gap-2 text-left hover:opacity-80 transition cursor-pointer"
                title="View & Edit Profile"
              >
                <div className="h-8 w-8 rounded-full border border-yellow-500/40 p-0.5 overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-yellow-300">
                      {user.avatarPreset || user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="truncate max-w-[100px]">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[9px] text-yellow-500/80 capitalize truncate">
                    {user.username || `@${user.name.toLowerCase().replace(/\s+/g, "")}`}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isSoundMuted
                    ? "bg-white/5 border-white/10 text-white/40"
                    : "bg-yellow-500/15 border-yellow-500/30 text-yellow-300"
                }`}
                title={isSoundMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 flex flex-col p-4 sm:p-8 bg-gradient-to-tr from-[#07061a] via-[#0a081e] to-[#120e32] overflow-y-auto min-h-screen">
          {/* Header Bar */}
          <header className="flex justify-between items-center mb-6 pb-4 border-b border-yellow-600/15">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
                <span className="bg-gradient-to-r from-white via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
                  {user.name}
                </span>
                .
              </h2>
              <p className="text-white/40 text-xs sm:text-sm italic">
                'Your output today is limited only by the boundaries of your focus.'
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Trophies row */}
              <div className="hidden sm:flex -space-x-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-[#07061a] bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold"
                  title="Milestone Badge"
                >
                  🏆
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 border-[#07061a] bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold"
                  title="Fire Streak"
                >
                  🔥
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 border-[#07061a] bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold"
                  title="Mindset Master"
                >
                  🧠
                </div>
              </div>

              {/* Profile Circle Header Button */}
              <button
                type="button"
                onClick={() => handleNavigate("profile")}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-yellow-500/40 p-0.5 transition hover:scale-105 cursor-pointer overflow-hidden"
                title="Account Profile & Theme Settings"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="h-full w-full rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-yellow-300">
                    {user.avatarPreset || user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </header>

          {/* Unlocked Badge Toast */}
          {badgeToast && (
            <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-2xl shadow-yellow-500/30 flex items-center gap-3 animate-bounce">
              <span className="text-3xl">{badgeToast.icon}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-black/70">
                  New Milestone Unlocked!
                </div>
                <div className="text-sm font-black text-black">{badgeToast.label}</div>
              </div>
            </div>
          )}

          {/* Views */}
          <div className="flex-1 pb-8">
            {activeTab === "today" && (
              <TodayDashboard
                user={user}
                goals={goals}
                moods={moods}
                streak={streak}
                onNavigate={handleNavigate}
                onToggleGoal={handleToggleGoal}
              />
            )}

            {activeTab === "voxgame" && (
              <VoxGameModule
                user={dbManager.getCurrentUser()}
                onUserChange={(updatedUser) => {
                  if (updatedUser) {
                    setUser((prev) =>
                      prev ? { ...prev, name: updatedUser.displayName, username: updatedUser.username } : prev
                    );
                  }
                }}
                onNavigateToTab={(tab) => handleNavigate(tab)}
              />
            )}

            {activeTab === "coach" && (
              <AICoachChat
                user={user}
                goals={goals}
                moods={moods}
                streak={streak}
                initialPrompt={coachPrompt}
                onClearInitialPrompt={() => setCoachPrompt(undefined)}
                onBadgeUnlock={unlockBadge}
              />
            )}

            {activeTab === "dailyquote" && (
              <DailyQuoteModule
                user={user}
                goals={goals}
                savedQuotes={savedQuotes}
                setSavedQuotes={setSavedQuotes}
                onBadgeUnlock={unlockBadge}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === "profile" && (
              <UserProfileModule
                user={user}
                setUser={setUser}
                goals={goals}
                moods={moods}
                streak={streak}
                badges={badges}
                savedQuotesCount={savedQuotes.length}
                onBadgeUnlock={unlockBadge}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === "goals" && (
              <GoalsModule
                goals={goals}
                setGoals={setGoals}
                user={user}
                onBadgeUnlock={unlockBadge}
              />
            )}

            {activeTab === "mood" && (
              <MoodLoggerModule
                moods={moods}
                setMoods={setMoods}
                habits={habits}
                setHabits={setHabits}
                streak={streak}
                setStreak={setStreak}
                onBadgeUnlock={unlockBadge}
              />
            )}

            {activeTab === "wisdom" && (
              <WisdomQuotesModule
                savedQuotes={savedQuotes}
                setSavedQuotes={setSavedQuotes}
                user={user}
                onBadgeUnlock={unlockBadge}
              />
            )}

            {activeTab === "affirmations" && (
              <AffirmationsModule
                user={user}
                favoriteAffirmations={favAffirmations}
                setFavoriteAffirmations={setFavAffirmations}
              />
            )}

            {activeTab === "horoscope" && <HoroscopeModule goals={goals} />}

            {activeTab === "badges" && <BadgesModule badges={badges} streak={streak} />}

            {activeTab === "export" && (
              <ExportModule
                user={user}
                goals={goals}
                moods={moods}
                habits={habits}
                streak={streak}
                badges={badges}
                savedQuotes={savedQuotes}
                favoriteAffirmations={favAffirmations}
                onImportData={handleImportData}
                onResetAll={handleResetAll}
                onBadgeUnlock={unlockBadge}
              />
            )}
          </div>

          {/* Footnote */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs text-white/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              MotivaBOT Pro · Powered by <span className="text-yellow-400 font-semibold">Gemini 3.7 Pro</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate("coach", "Give me a 60-second power mindset reset.")}
                className="text-yellow-400/80 hover:text-yellow-300 transition cursor-pointer"
              >
                Instant Power Reset
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleNavigate("export")}
                className="hover:text-white transition cursor-pointer"
              >
                Backup Data
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
