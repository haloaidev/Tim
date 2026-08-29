import React, { useState } from "react";
import { UserProfile, Goal, MoodEntry, ThemeAccent } from "../types";
import { sound } from "../utils/audio";
import { BADGE_DEFS } from "./BadgesModule";
import confetti from "canvas-confetti";
import {
  User,
  Flame,
  Target,
  Award,
  Palette,
  Edit3,
  Check,
  X,
  Upload,
  Sparkles,
  TrendingUp,
  Heart,
  Calendar,
  ShieldCheck,
  Zap,
  Star,
  RefreshCw,
} from "lucide-react";

interface UserProfileModuleProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  goals: Goal[];
  moods: MoodEntry[];
  streak: number;
  badges: string[];
  savedQuotesCount: number;
  onBadgeUnlock?: (badgeId: string) => void;
  onNavigate: (tab: string, prompt?: string) => void;
}

const PRESET_AVATARS = [
  "⚡", "🦁", "🚀", "👑", "🧠", "🔥", "🏆", "🌌", "💎", "🦅", "⚔️", "🧘"
];

const ACCENT_OPTIONS: { id: ThemeAccent; label: string; colorClass: string; bgClass: string; hex: string }[] = [
  { id: "gold", label: "Sophisticated Gold", colorClass: "text-yellow-400", bgClass: "bg-yellow-500", hex: "#eab308" },
  { id: "indigo", label: "Electric Indigo", colorClass: "text-indigo-400", bgClass: "bg-indigo-500", hex: "#6366f1" },
  { id: "emerald", label: "Emerald Mindset", colorClass: "text-emerald-400", bgClass: "bg-emerald-500", hex: "#10b981" },
  { id: "rose", label: "Cyber Rose", colorClass: "text-rose-400", bgClass: "bg-rose-500", hex: "#f43f5e" },
  { id: "cyan", label: "Cosmic Cyan", colorClass: "text-cyan-400", bgClass: "bg-cyan-500", hex: "#06b6d4" },
  { id: "amber", label: "Solar Amber", colorClass: "text-amber-400", bgClass: "bg-amber-500", hex: "#f59e0b" },
];

export const UserProfileModule: React.FC<UserProfileModuleProps> = ({
  user,
  setUser,
  goals,
  moods,
  streak,
  badges,
  savedQuotesCount,
  onBadgeUnlock,
  onNavigate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editUsername, setEditUsername] = useState(user.username || `@${user.name.toLowerCase().replace(/\s+/g, "")}`);
  const [editBio, setEditBio] = useState(user.bio || "Building high-performance habits and mastering goal execution.");
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatarUrl || "");
  const [editAvatarPreset, setEditAvatarPreset] = useState(user.avatarPreset || "⚡");
  const [editMotivationStyle, setEditMotivationStyle] = useState(user.motivationStyle || "Achievement & Milestones");
  const [editPreferredTime, setEditPreferredTime] = useState(user.preferredTime || "morning");
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "customization">("overview");

  // Calculate goal stats
  const completedGoalsCount = goals.filter((g) => g.completed).length;
  const goalCompletionPct = goals.length > 0 ? Math.round((completedGoalsCount / goals.length) * 100) : 0;

  // Streak milestone calculation
  const streakMilestones = [7, 14, 30, 60, 100];
  const nextStreakMilestone = streakMilestones.find((m) => m > streak) || 100;
  const streakProgressPct = Math.min(100, Math.round((streak / nextStreakMilestone) * 100));

  // Current accent info
  const currentAccent = ACCENT_OPTIONS.find((a) => a.id === (user.themeAccent || "gold")) || ACCENT_OPTIONS[0];

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarUrl(reader.result as string);
        sound.playSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    const updatedUser: UserProfile = {
      ...user,
      name: editName.trim() || user.name,
      username: editUsername.trim().startsWith("@") ? editUsername.trim() : `@${editUsername.trim()}`,
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl,
      avatarPreset: editAvatarPreset,
      motivationStyle: editMotivationStyle,
      preferredTime: editPreferredTime,
    };
    setUser(updatedUser);
    setIsEditing(false);
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {}
  };

  const handleThemeChange = (accent: ThemeAccent) => {
    sound.playClick();
    const updatedUser: UserProfile = {
      ...user,
      themeAccent: accent,
    };
    setUser(updatedUser);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Hero Card */}
      <div className="relative bg-[#0a081e] border border-yellow-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Avatar & User Meta */}
          <div className="flex items-center gap-5">
            {/* Avatar Display */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 border-yellow-500/40 p-1 bg-gradient-to-br from-yellow-500/20 via-purple-600/20 to-indigo-600/20 shadow-xl overflow-hidden flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-600 flex items-center justify-center text-black font-black text-3xl sm:text-4xl shadow-inner">
                    {user.avatarPreset || user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl shadow-lg transition cursor-pointer"
                title="Edit Avatar & Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold text-xs border border-yellow-500/30">
                  {user.username || `@${user.name.toLowerCase().replace(/\s+/g, "")}`}
                </span>
              </div>

              <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md font-medium">
                {user.bio || "Building high-performance habits and mastering daily goal execution."}
              </p>

              <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-white/50">
                <span className="flex items-center gap-1 font-semibold text-yellow-400">
                  <Sparkles className="w-3.5 h-3.5" /> Archetype: {user.motivationStyle}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-white/40" /> Peak Window: {user.preferredTime}
                </span>
              </div>
            </div>
          </div>

          {/* Right Profile Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-yellow-500/20 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Edit3 className="w-4 h-4" /> Edit Account Profile
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: "overview", label: "Overview & Execution Metrics", icon: TrendingUp },
            { id: "badges", label: `Earned Badges (${badges.length})`, icon: Award },
            { id: "customization", label: "UI Theme Customization", icon: Palette },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id as any);
                  sound.playClick();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview & Streak Analytics Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Streak */}
            <div className="p-5 rounded-3xl bg-[#0a081e] border border-orange-500/30 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                  Momentum
                </span>
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{streak} Days</div>
              <div className="text-xs text-white/50 mt-1">Active daily streak</div>
            </div>

            {/* Stat 2: Goal Completion % */}
            <div className="p-5 rounded-3xl bg-[#0a081e] border border-yellow-500/30 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                  Goals
                </span>
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{goalCompletionPct}%</div>
              <div className="text-xs text-white/50 mt-1">{completedGoalsCount} of {goals.length} completed</div>
            </div>

            {/* Stat 3: Total Badges */}
            <div className="p-5 rounded-3xl bg-[#0a081e] border border-indigo-500/30 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Ranks
                </span>
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{badges.length}</div>
              <div className="text-xs text-white/50 mt-1">Unlocked achievement badges</div>
            </div>

            {/* Stat 4: Check-in Entries */}
            <div className="p-5 rounded-3xl bg-[#0a081e] border border-pink-500/30 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-6 h-6 text-pink-400" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                  Check-ins
                </span>
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{moods.length}</div>
              <div className="text-xs text-white/50 mt-1">Logged mood & energy entries</div>
            </div>
          </div>

          {/* Streak Milestone Progress Card */}
          <div className="bg-[#0a081e] border border-yellow-500/20 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Streak Record & Milestone Roadmap
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Maintain your daily execution habit to unlock higher executive badges.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-yellow-400">
                  Next Rank Milestone: {nextStreakMilestone} Days
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${streakProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                <span>Current: {streak} days</span>
                <span>{streakProgressPct}% to {nextStreakMilestone}-Day Master Badge</span>
              </div>
            </div>

            {/* Milestone Markers */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {streakMilestones.map((m) => {
                const reached = streak >= m;
                return (
                  <div
                    key={m}
                    className={`p-3 rounded-2xl border text-center transition ${
                      reached
                        ? "bg-yellow-500/15 border-yellow-500/50 text-yellow-300 font-bold"
                        : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    <div className="text-sm font-black mb-0.5">{m}d</div>
                    <div className="text-[9px] uppercase tracking-wider">{reached ? "Unlocked" : "Locked"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Goal Execution Breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              Active Goals Execution Breakdown
            </h3>

            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 rounded-2xl bg-[#0a081e] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                      <span className="text-white font-semibold flex items-center gap-2">
                        <span>{goal.completed ? "✅" : "🎯"}</span>
                        <span className={goal.completed ? "line-through text-white/40" : ""}>{goal.text}</span>
                      </span>
                      <span className="text-yellow-400 font-extrabold">{goal.progress}%</span>
                    </div>

                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/40 italic py-4 text-center">
                No active goals added yet. Add goals in the Goals module to track progress here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earned Badges Tab */}
      {activeTab === "badges" && (
        <div className="bg-[#0a081e] border border-yellow-500/20 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Earned Badges & Ranks ({badges.length}/{BADGE_DEFS.length})
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Complete goals, maintain your daily streak, and engage with your AI coach to earn badges.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BADGE_DEFS.map((b) => {
              const isUnlocked = badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-3xl border transition flex flex-col items-center text-center space-y-2 relative overflow-hidden ${
                    isUnlocked
                      ? "bg-white/5 border-yellow-500/40 shadow-lg shadow-yellow-500/10"
                      : "bg-white/[0.02] border-white/5 opacity-50 grayscale"
                  }`}
                >
                  <div className="text-3xl sm:text-4xl p-2 rounded-2xl bg-black/40 border border-white/5">
                    {b.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{b.label}</div>
                    <div className="text-[10px] text-white/50 mt-0.5 leading-snug">{b.desc}</div>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-auto ${
                      isUnlocked
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {isUnlocked ? "✓ Unlocked" : "Locked"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UI Theme Customization Tab */}
      {activeTab === "customization" && (
        <div className="bg-[#0a081e] border border-yellow-500/20 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-yellow-400" />
              Application Visual Theme & Accent Customization
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Select your preferred visual theme accent color to personalize your daily execution workspace.
            </p>
          </div>

          {/* Theme Accent Color Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ACCENT_OPTIONS.map((acc) => {
              const isSelected = (user.themeAccent || "gold") === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleThemeChange(acc.id)}
                  className={`p-5 rounded-3xl border text-left transition cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected
                      ? "bg-white/10 border-yellow-500 shadow-xl shadow-yellow-500/20 scale-[1.02]"
                      : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-full ${acc.bgClass} shadow-lg`} />
                    {isSelected && (
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-yellow-500 text-black">
                        Active Theme
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-white">{acc.label}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">Accent Color: {acc.hex}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview Showcase */}
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Theme Preview</div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl text-xs font-bold text-black ${currentAccent.bgClass}`}>
                Primary Button Preview
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-bold border border-white/20 ${currentAccent.colorClass}`}>
                Accent Text Preview
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a081e] border border-yellow-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-400" />
                Edit Account Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Picker & Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block">
                  Profile Avatar Picture
                </label>

                {/* Avatar Preview */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-yellow-500/40 p-1 bg-black/40 flex items-center justify-center overflow-hidden">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl">{editAvatarPreset}</span>
                    )}
                  </div>

                  {/* File Upload Button */}
                  <label className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 flex items-center gap-2 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" /> Upload Custom Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>

                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl("")}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Preset Avatars Grid */}
                <div className="pt-2">
                  <span className="text-[10px] text-white/50 block mb-1">Or choose a preset icon:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          setEditAvatarPreset(av);
                          setEditAvatarUrl("");
                          sound.playClick();
                        }}
                        className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition cursor-pointer ${
                          editAvatarPreset === av && !editAvatarUrl
                            ? "bg-yellow-500/30 border-yellow-500 scale-110"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Full / Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  placeholder="@alex"
                />
              </div>

              {/* Bio / Tagline */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Bio / Tagline</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-500/50"
                  placeholder="Share your vision or daily motto..."
                />
              </div>

              {/* Motivation Style */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Primary Motivation Driver</label>
                <select
                  value={editMotivationStyle}
                  onChange={(e) => setEditMotivationStyle(e.target.value)}
                  className="w-full bg-[#0a081e] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="Achievement & Milestones">Achievement & Milestones</option>
                  <option value="Relentless Discipline">Relentless Discipline</option>
                  <option value="Vision & Purpose">Vision & Purpose</option>
                  <option value="Competitive Mastery">Competitive Mastery</option>
                </select>
              </div>

              {/* Peak Productivity Window */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white">Peak Focus Window</label>
                <select
                  value={editPreferredTime}
                  onChange={(e) => setEditPreferredTime(e.target.value)}
                  className="w-full bg-[#0a081e] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="morning">Morning Clarity (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon Execution (12 PM - 6 PM)</option>
                  <option value="night">Night Flow (6 PM - 12 AM)</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
