import React from "react";
import { BadgeDef } from "../types";
import { Award, Flame, Zap, CheckCircle, ShieldCheck } from "lucide-react";

interface Props {
  badges: string[];
  streak: number;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: "first_goal", icon: "🎯", label: "Goal Setter", desc: "Added your first target goal in MotivaBOT", category: "goals" },
  { id: "five_goals", icon: "🏆", label: "Master Achiever", desc: "Created 5 or more structured target goals", category: "goals" },
  { id: "goal_done", icon: "🌟", label: "Goal Crusher", desc: "Successfully completed and claimed a target goal", category: "goals" },
  { id: "first_mood", icon: "💜", label: "Self-Awareness", desc: "Logged your first daily mood check-in", category: "habits" },
  { id: "streak3", icon: "🔥", label: "Momentum Spark", desc: "Maintained a 3-day active streak", category: "streak" },
  { id: "streak7", icon: "⚡", label: "Week Warrior", desc: "Achieved a 7-day relentless operational streak", category: "streak" },
  { id: "all_habits", icon: "✅", label: "Habit Master", desc: "Completed 100% of daily habits in a single day", category: "habits" },
  { id: "quote_saved", icon: "💬", label: "Wisdom Keeper", desc: "Saved a legendary historical figure quote", category: "wisdom" },
  { id: "ai_chat", icon: "🤖", label: "AI Synchronized", desc: "Engaged in an interactive AI coaching session", category: "coach" },
  { id: "exported", icon: "📦", label: "Data Architect", desc: "Exported a comprehensive data backup", category: "wisdom" },
];

export const BadgesModule: React.FC<Props> = ({ badges, streak }) => {
  const earnedCount = badges.length;
  const totalCount = BADGE_DEFS.length;
  const progressPct = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Achievements & Momentum Ranks
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Unlock milestones as you build daily habits, crush goals, and channel wisdom.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-orange-300">{streak} Days</div>
                <div className="text-[9px] text-orange-200/60 uppercase">Streak</div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-amber-300">
                  {earnedCount} / {totalCount}
                </div>
                <div className="text-[9px] text-amber-200/60 uppercase">Badges</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/60 mb-1.5 font-semibold">
            <span>Overall Milestone Completion</span>
            <span className="text-amber-400 font-bold">{progressPct}%</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {BADGE_DEFS.map((badge) => {
          const isEarned = badges.includes(badge.id);

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                isEarned
                  ? "bg-[#0e0c28]/95 border-amber-400/50 shadow-lg shadow-amber-500/10"
                  : "bg-white/[0.02] border-white/5 opacity-40 grayscale"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md ${
                  isEarned ? "bg-amber-500/20 border border-amber-400/40" : "bg-white/5"
                }`}
              >
                {badge.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm font-bold ${
                      isEarned ? "text-amber-300" : "text-white/60"
                    }`}
                  >
                    {badge.label}
                  </h3>
                  {isEarned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
