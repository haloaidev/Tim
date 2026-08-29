import React, { useState } from "react";
import { MoodEntry } from "../types";
import { sound } from "../utils/audio";
import confetti from "canvas-confetti";
import {
  Heart,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Calendar,
  Sparkles,
  Smile,
  Edit2,
  Trash2,
  Battery,
} from "lucide-react";

interface Props {
  moods: MoodEntry[];
  setMoods: (moods: MoodEntry[]) => void;
  habits: string[];
  setHabits: (habits: string[]) => void;
  streak: number;
  setStreak: (streak: number) => void;
  onBadgeUnlock: (badgeId: string) => void;
}

const MOOD_OPTIONS = [
  { value: "excellent", emoji: "😁", label: "Peak Momentum", color: "border-amber-400 text-amber-300 bg-amber-500/20" },
  { value: "good", emoji: "😊", label: "Good Focus", color: "border-emerald-400 text-emerald-300 bg-emerald-500/20" },
  { value: "okay", emoji: "😐", label: "Balanced State", color: "border-blue-400 text-blue-300 bg-blue-500/20" },
  { value: "down", emoji: "😟", label: "Low Energy", color: "border-orange-400 text-orange-300 bg-orange-500/20" },
  { value: "sad", emoji: "😢", label: "Drained", color: "border-rose-400 text-rose-300 bg-rose-500/20" },
] as const;

export const MoodLoggerModule: React.FC<Props> = ({
  moods,
  setMoods,
  habits,
  setHabits,
  streak,
  setStreak,
  onBadgeUnlock,
}) => {
  const todayStr = new Date().toDateString();
  const todayEntry = moods.find((e) => new Date(e.timestamp).toDateString() === todayStr);

  const [selectedMood, setSelectedMood] = useState<MoodEntry["mood"]>(todayEntry?.mood || "good");
  const [energyLevel, setEnergyLevel] = useState<number>(todayEntry?.energyLevel || 8);
  const [notes, setNotes] = useState(todayEntry?.notes || "");
  const [doneHabits, setDoneHabits] = useState<Set<string>>(new Set(todayEntry?.habits || []));
  const [newHabitName, setNewHabitName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const toggleHabit = (h: string) => {
    sound.playClick();
    setDoneHabits((prev) => {
      const next = new Set(prev);
      if (next.has(h)) {
        next.delete(h);
      } else {
        next.add(h);
      }
      return next;
    });
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    sound.playClick();
    setHabits([...habits, newHabitName.trim()]);
    setNewHabitName("");
  };

  const handleDeleteHabit = (h: string) => {
    sound.playClick();
    setHabits(habits.filter((x) => x !== h));
  };

  const handleSaveEntry = () => {
    sound.playClick();
    const entry: MoodEntry = {
      id: Date.now(),
      mood: selectedMood,
      energyLevel,
      notes: notes.trim(),
      habits: Array.from(doneHabits),
      timestamp: new Date().toISOString(),
    };

    const remaining = moods.filter((e) => new Date(e.timestamp).toDateString() !== todayStr);
    const updated = [entry, ...remaining];
    setMoods(updated);

    // Compute streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const hadYesterday = moods.some(
      (e) => new Date(e.timestamp).toDateString() === yesterday.toDateString()
    );
    const nextStreak = hadYesterday ? streak + 1 : Math.max(1, streak);
    setStreak(nextStreak);

    // Badges
    if (updated.length === 1) onBadgeUnlock("first_mood");
    if (nextStreak >= 3) onBadgeUnlock("streak3");
    if (nextStreak >= 7) onBadgeUnlock("streak7");
    if (doneHabits.size === habits.length && habits.length > 0) {
      onBadgeUnlock("all_habits");
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } catch {}
    }

    sound.playSuccess();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Today Logged State Banner or Active Form */}
      {todayEntry && !isEditing ? (
        <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 shadow-xl text-center">
          <div className="text-5xl mb-3 animate-bounce">
            {MOOD_OPTIONS.find((m) => m.value === todayEntry.mood)?.emoji}
          </div>
          <h2 className="text-lg font-bold text-white">
            Today's Check-in Recorded!
          </h2>
          <p className="text-xs sm:text-sm text-amber-300/80 mt-1">
            Status: <span className="font-bold">{MOOD_OPTIONS.find((m) => m.value === todayEntry.mood)?.label}</span> · Energy: {todayEntry.energyLevel || 8}/10
          </p>

          {todayEntry.notes && (
            <div className="my-4 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white/80 max-w-md mx-auto italic">
              "{todayEntry.notes}"
            </div>
          )}

          {todayEntry.habits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center max-w-lg mx-auto mb-4">
              {todayEntry.habits.map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold"
                >
                  ✓ {h}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Today's Check-in
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mood Selector Card */}
          <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  How is your momentum today?
                </h2>
              </div>
              <span className="text-xs text-white/40">{new Date().toLocaleDateString()}</span>
            </div>

            {/* 5 Mood Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = selectedMood === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedMood(m.value);
                    }}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? `${m.color} shadow-lg scale-[1.04]`
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 text-white/70"
                    }`}
                  >
                    <span className="text-3xl select-none">{m.emoji}</span>
                    <span className="text-[11px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Energy Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-white/70 mb-2">
                <span className="flex items-center gap-1.5">
                  <Battery className="w-4 h-4 text-amber-400" /> Energy Velocity Level
                </span>
                <span className="text-amber-400 font-bold">{energyLevel} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Reflection Note */}
            <div>
              <label className="block text-[11px] text-white/50 mb-1 font-semibold uppercase tracking-wider">
                Reflections, Wins, or Friction (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What catalyzed your energy today? What micro-win are you claiming?"
                rows={3}
                className="w-full bg-white/5 border border-amber-500/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 transition resize-none"
              />
            </div>
          </div>

          {/* Daily Habit Checklist Card */}
          <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  Daily Habit Execution
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {doneHabits.size} / {habits.length} Completed
              </span>
            </div>

            {/* Habits List */}
            <div className="space-y-2 mb-4">
              {habits.map((habit) => {
                const isDone = doneHabits.has(habit);
                return (
                  <div
                    key={habit}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      isDone
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                        : "bg-white/[0.03] border-white/5 text-white/80 hover:border-white/15"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleHabit(habit)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <span className={isDone ? "text-emerald-400" : "text-white/30"}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isDone ? "line-through text-white/40" : "text-white/90"
                        }`}
                      >
                        {habit}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit)}
                      className="p-1 text-white/30 hover:text-rose-400 transition"
                      title="Remove habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Habit */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
                placeholder="Add custom daily habit..."
                className="flex-1 bg-white/5 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddHabit}
                disabled={!newHabitName.trim()}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSaveEntry}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
          >
            Save Today's Entry & Build Streak 🔥
          </button>
        </div>
      )}

      {/* History Log */}
      {moods.length > 0 && (
        <div className="bg-[#0e0c28]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
            Recent Mood & Habit History
          </h3>

          <div className="space-y-2.5">
            {moods.slice(0, 5).map((entry) => {
              const moodDef = MOOD_OPTIONS.find((m) => m.value === entry.mood);
              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 text-xs"
                >
                  <span className="text-2xl">{moodDef?.emoji || "😊"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{moodDef?.label}</span>
                      <span className="text-white/40">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-white/60 text-[11px] truncate mt-0.5">{entry.notes}</p>
                    )}
                    {entry.habits.length > 0 && (
                      <div className="text-[10px] text-amber-400/80 mt-1">
                        {entry.habits.length} habits completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
