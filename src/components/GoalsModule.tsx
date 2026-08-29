import React, { useState } from "react";
import { Goal, UserProfile } from "../types";
import { sound } from "../utils/audio";
import confetti from "canvas-confetti";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  user: UserProfile;
  onBadgeUnlock: (id: string) => void;
}

const CATEGORIES = [
  "Personal Mindset",
  "Health & Fitness",
  "Career & Leadership",
  "Learning & Education",
  "Financial Wealth",
  "Creative Mastery",
  "High Performance Habits",
  "Other",
];

export const GoalsModule: React.FC<Props> = ({ goals, setGoals, user, onBadgeUnlock }) => {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Personal Mindset");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [targetDate, setTargetDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [breakdownLoadingId, setBreakdownLoadingId] = useState<number | null>(null);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<number | null>(null);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#F59E0B", "#FBBF24", "#10B981", "#FFFFFF"],
      });
    } catch {}
  };

  const handleAddGoal = () => {
    if (!text.trim()) return;
    sound.playClick();

    const newGoal: Goal = {
      id: Date.now(),
      text: text.trim(),
      category,
      priority,
      completed: false,
      progress: 0,
      targetDate: targetDate || undefined,
      createdAt: new Date().toISOString(),
    };

    const nextGoals = [newGoal, ...goals];
    setGoals(nextGoals);
    setText("");
    setTargetDate("");

    if (nextGoals.length === 1) onBadgeUnlock("first_goal");
    if (nextGoals.length >= 5) onBadgeUnlock("five_goals");
  };

  const handleToggleGoal = (id: number) => {
    sound.playClick();
    const updated = goals.map((g) => {
      if (g.id === id) {
        const nextCompleted = !g.completed;
        if (nextCompleted) {
          sound.playSuccess();
          triggerConfetti();
          onBadgeUnlock("goal_done");
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

  const handleAdjustProgress = (id: number, delta: number) => {
    sound.playClick();
    const updated = goals.map((g) => {
      if (g.id === id) {
        const nextProgress = Math.min(100, Math.max(0, g.progress + delta));
        const nextCompleted = nextProgress === 100;
        if (nextCompleted && !g.completed) {
          sound.playSuccess();
          triggerConfetti();
          onBadgeUnlock("goal_done");
        }
        return {
          ...g,
          progress: nextProgress,
          completed: nextCompleted,
        };
      }
      return g;
    });
    setGoals(updated);
  };

  const handleDeleteGoal = (id: number) => {
    sound.playClick();
    setGoals(goals.filter((g) => g.id !== id));
  };

  // AI Goal Milestone Breakdown
  const handleAIBreakdown = async (goal: Goal) => {
    sound.playClick();
    setBreakdownLoadingId(goal.id);
    try {
      const response = await fetch("/api/breakdown-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalText: goal.text,
          category: goal.category,
          priority: goal.priority,
          userProfile: user,
        }),
      });

      if (!response.ok) throw new Error("Breakdown failed");
      const data = await response.json();

      const updated = goals.map((g) => {
        if (g.id === goal.id) {
          return {
            ...g,
            milestones: (data.milestones || []).map((m: any) => ({ ...m, done: false })),
          };
        }
        return g;
      });

      setGoals(updated);
      setExpandedBreakdownId(goal.id);
      sound.playSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setBreakdownLoadingId(null);
    }
  };

  const handleToggleMilestone = (goalId: number, milestoneIndex: number) => {
    sound.playClick();
    const updated = goals.map((g) => {
      if (g.id === goalId && g.milestones) {
        const nextMilestones = [...g.milestones];
        nextMilestones[milestoneIndex] = {
          ...nextMilestones[milestoneIndex],
          done: !nextMilestones[milestoneIndex].done,
        };
        const completedCount = nextMilestones.filter((m) => m.done).length;
        const progress = Math.round((completedCount / nextMilestones.length) * 100);
        return {
          ...g,
          milestones: nextMilestones,
          progress,
          completed: progress === 100,
        };
      }
      return g;
    });
    setGoals(updated);
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return !g.completed;
    if (filter === "completed") return g.completed;
    return true;
  });

  const priorityColors = {
    low: "text-emerald-400 bg-emerald-500/15 border-emerald-400/30",
    medium: "text-amber-400 bg-amber-500/15 border-amber-400/30",
    high: "text-rose-400 bg-rose-500/15 border-rose-400/30",
  };

  const completedTotal = goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-6">
      {/* Create New Goal Card */}
      <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
            Add Core Target Goal
          </h2>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
            placeholder="What outcome or milestone will you conquer?"
            className="w-full bg-white/5 border border-amber-500/30 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 transition"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-white/50 mb-1 font-semibold uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#08061c] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#08061c]">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/50 mb-1 font-semibold uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#08061c] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 capitalize"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/50 mb-1 font-semibold uppercase tracking-wider">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[#08061c] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
              </input>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddGoal}
            disabled={!text.trim()}
            className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              text.trim()
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" /> Add Goal Target
          </button>
        </div>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                sound.playClick();
                setFilter(f);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition ${
                filter === f
                  ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {f} (
              {f === "all"
                ? goals.length
                : f === "active"
                ? goals.length - completedTotal
                : completedTotal}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#0e0c28]/60 border border-white/5 rounded-2xl">
          <Target className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white/70">No goals in this view</h3>
          <p className="text-xs text-white/40 mt-1">Add your next objective above to build momentum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const hasMilestones = goal.milestones && goal.milestones.length > 0;
            const isExpanded = expandedBreakdownId === goal.id;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border transition-all ${
                  goal.completed
                    ? "bg-[#0e0c28]/60 border-white/5 opacity-80"
                    : "bg-[#0e0c28]/90 border-amber-500/20 hover:border-amber-500/40 shadow-lg"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleGoal(goal.id)}
                    className={`mt-0.5 p-0.5 rounded-full transition flex-shrink-0 ${
                      goal.completed
                        ? "text-emerald-400"
                        : "text-white/30 hover:text-amber-400"
                    }`}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          priorityColors[goal.priority]
                        }`}
                      >
                        {goal.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                        {goal.category}
                      </span>
                      {goal.targetDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-amber-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-semibold leading-snug ${
                        goal.completed ? "line-through text-white/40" : "text-white"
                      }`}
                    >
                      {goal.text}
                    </h3>

                    {/* Progress Bar & Controls */}
                    {!goal.completed && (
                      <div className="mt-3 space-y-2">
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-bold">{goal.progress}% complete</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustProgress(goal.id, -25)}
                              className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[11px] font-bold"
                            >
                              -25%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustProgress(goal.id, +25)}
                              className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
                            >
                              +25%
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Deconstruction Button */}
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/5">
                      {!hasMilestones ? (
                        <button
                          type="button"
                          onClick={() => handleAIBreakdown(goal)}
                          disabled={breakdownLoadingId === goal.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {breakdownLoadingId === goal.id ? "Analyzing Milestones..." : "✨ AI Break Down Goal"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedBreakdownId(isExpanded ? null : goal.id)}
                          className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          {goal.milestones?.length} Action Milestones
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Milestones Sub-List */}
                    {hasMilestones && isExpanded && (
                      <div className="mt-3 p-3 rounded-xl bg-black/40 border border-amber-500/20 space-y-2">
                        <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                          Tactical Action Milestones
                        </div>
                        {goal.milestones?.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleMilestone(goal.id, idx)}
                            className="flex items-start gap-2 text-xs p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer transition"
                          >
                            <span className={`mt-0.5 ${m.done ? "text-emerald-400" : "text-white/30"}`}>
                              {m.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            </span>
                            <div className="flex-1">
                              <div className={`font-semibold ${m.done ? "line-through text-white/40" : "text-white/90"}`}>
                                {m.title}
                              </div>
                              <div className="text-[11px] text-white/50">{m.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete Goal */}
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
