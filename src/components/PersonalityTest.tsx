import React, { useState } from "react";
import { UserProfile } from "../types";
import { sound } from "../utils/audio";
import { Sparkles, ArrowRight, ArrowLeft, Target, ShieldAlert, Zap, Clock, UserCheck } from "lucide-react";

interface Props {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}

export const PersonalityTest: React.FC<Props> = ({ onComplete, initialProfile }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<UserProfile>(
    initialProfile || {
      name: "",
      age: "",
      goals: ["Health & Fitness", "Career Growth"],
      challenges: ["Procrastination", "Loss of Focus"],
      motivationStyle: "milestones",
      preferredTime: "morning",
    }
  );

  const update = (key: keyof UserProfile, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const toggleArrayItem = (field: "goals" | "challenges", item: string) => {
    sound.playClick();
    const current = formData[field] || [];
    if (current.includes(item)) {
      update(field, current.filter((x) => x !== item));
    } else {
      update(field, [...current, item]);
    }
  };

  const GOAL_OPTIONS = [
    { label: "Health & Fitness", icon: "💪", desc: "Energy, strength, consistency" },
    { label: "Career & Leadership", icon: "🚀", desc: "Promotion, execution, authority" },
    { label: "Financial Mastery", icon: "📈", desc: "Wealth building, budgeting" },
    { label: "Mindset & Mental Peace", icon: "🧠", desc: "Resilience, calm, self-talk" },
    { label: "Skill & Deep Learning", icon: "📚", desc: "Mastery, craft, reading" },
    { label: "Creative Projects", icon: "🎨", desc: "Art, writing, building" },
    { label: "High Performance Habits", icon: "⚡", desc: "Routines, morning flow" },
    { label: "Relationships & Impact", icon: "🤝", desc: "Connection, empathy, legacy" },
  ];

  const CHALLENGE_OPTIONS = [
    { label: "Procrastination", desc: "Waiting for the 'perfect' moment" },
    { label: "Lack of Motivation", desc: "Inconsistent fire and drive" },
    { label: "Self-Doubt & Overthinking", desc: "Second-guessing decisions" },
    { label: "Loss of Focus & Distraction", desc: "Digital overload, wandering" },
    { label: "Time Management", desc: "Too much to do, poor prioritization" },
    { label: "Stress & Mental Burnout", desc: "Energy depletion, cognitive friction" },
  ];

  const MOTIVATION_OPTIONS = [
    {
      id: "milestones",
      title: "Milestones & Progress Tracking",
      desc: "Driven by tangible checklist wins, metrics, streaks, and visible progress.",
      icon: "🎯",
    },
    {
      id: "growth",
      title: "Personal Expansion & Mastery",
      desc: "Driven by learning, acquiring skills, and becoming 1% better every day.",
      icon: "🌱",
    },
    {
      id: "impact",
      title: "Creating Legacy & High Impact",
      desc: "Driven by purpose, helping others, and building something enduring.",
      icon: "👑",
    },
    {
      id: "tough-love",
      title: "Relentless Discipline & Accountability",
      desc: "Driven by high standards, direct truth, and zero tolerance for excuses.",
      icon: "⚔️",
    },
  ];

  const TIME_OPTIONS = [
    { id: "morning", title: "Early Morning (6:00 AM – 9:00 AM)", desc: "Fresh mind, uninterrupted dawn clarity", icon: "🌅" },
    { id: "midday", title: "Peak Midday (9:00 AM – 2:00 PM)", desc: "High kinetic output and active execution", icon: "☀️" },
    { id: "afternoon", title: "Afternoon Flow (2:00 PM – 6:00 PM)", desc: "Deep work focus and closing loops", icon: "🌤️" },
    { id: "evening", title: "Late Evening (6:00 PM – 11:00 PM)", desc: "Quiet night momentum, planning, synthesis", icon: "🌙" },
  ];

  const STEPS = [
    {
      stepNumber: 1,
      title: "Welcome to MotivaBOT Pro",
      subtitle: "Let's calibrate your personalized AI momentum coach.",
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      isValid: Boolean(formData.name.trim() && formData.age),
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-2">
              What should your coach call you?
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-white/5 border border-amber-500/30 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-2">
              Your Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => update("age", e.target.value)}
              placeholder="e.g. 26"
              className="w-full bg-white/5 border border-amber-500/30 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition"
            />
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/80 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            Your profile context directly shapes the AI Coach's advice and voice tone.
          </div>
        </div>
      ),
    },
    {
      stepNumber: 2,
      title: "Core Target Domains",
      subtitle: "Select the primary arenas where you want maximum momentum.",
      icon: <Target className="w-8 h-8 text-amber-400" />,
      isValid: formData.goals.length > 0,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          {GOAL_OPTIONS.map((g) => {
            const active = formData.goals.includes(g.label);
            return (
              <button
                key={g.label}
                type="button"
                onClick={() => toggleArrayItem("goals", g.label)}
                className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
                  active
                    ? "bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10 text-white"
                    : "bg-white/[0.03] border-white/10 hover:border-amber-500/40 text-white/80"
                }`}
              >
                <span className="text-2xl select-none">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">{g.label}</div>
                  <div className="text-xs text-white/50">{g.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      stepNumber: 3,
      title: "Your Prime Friction Points",
      subtitle: "What obstacles do you encounter most often?",
      icon: <ShieldAlert className="w-8 h-8 text-amber-400" />,
      isValid: formData.challenges.length > 0,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CHALLENGE_OPTIONS.map((c) => {
            const active = formData.challenges.includes(c.label);
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => toggleArrayItem("challenges", c.label)}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  active
                    ? "bg-amber-500/20 border-amber-400 text-white"
                    : "bg-white/[0.03] border-white/10 hover:border-amber-500/40 text-white/80"
                }`}
              >
                <div className="font-semibold text-sm text-white flex items-center justify-between">
                  {c.label}
                  {active && <span className="text-amber-400 text-xs font-bold">✓ Selected</span>}
                </div>
                <div className="text-xs text-white/50 mt-1">{c.desc}</div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      stepNumber: 4,
      title: "Motivation Resonance Style",
      subtitle: "How does your mind best receive fuel and guidance?",
      icon: <Zap className="w-8 h-8 text-amber-400" />,
      isValid: Boolean(formData.motivationStyle),
      content: (
        <div className="space-y-2.5">
          {MOTIVATION_OPTIONS.map((m) => {
            const active = formData.motivationStyle === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  update("motivationStyle", m.id);
                }}
                className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-start gap-3.5 ${
                  active
                    ? "bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10 text-white"
                    : "bg-white/[0.03] border-white/10 hover:border-amber-500/40 text-white/80"
                }`}
              >
                <span className="text-2xl mt-0.5">{m.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-amber-300">{m.title}</div>
                  <div className="text-xs text-white/60 mt-0.5">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      stepNumber: 5,
      title: "Peak Productivity Window",
      subtitle: "When is your mental focus at its sharpest velocity?",
      icon: <Clock className="w-8 h-8 text-amber-400" />,
      isValid: Boolean(formData.preferredTime),
      content: (
        <div className="space-y-2.5">
          {TIME_OPTIONS.map((t) => {
            const active = formData.preferredTime === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  update("preferredTime", t.id);
                }}
                className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-center gap-3.5 ${
                  active
                    ? "bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10 text-white"
                    : "bg-white/[0.03] border-white/10 hover:border-amber-500/40 text-white/80"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-white">{t.title}</div>
                  <div className="text-xs text-white/50">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const currentStep = STEPS[step];

  const handleNext = () => {
    sound.playClick();
    if (step === STEPS.length - 1) {
      sound.playSuccess();
      onComplete({
        ...formData,
        createdAt: new Date().toISOString(),
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    sound.playClick();
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-lg bg-[#0c0a24]/90 backdrop-blur-2xl border border-amber-500/25 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              MotivaBOT Calibration
            </span>
          </div>
          <span className="text-xs font-medium text-white/40">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {currentStep.icon}
            <h2 className="text-xl font-bold text-white tracking-tight">{currentStep.title}</h2>
          </div>
          <p className="text-xs sm:text-sm text-white/60">{currentStep.subtitle}</p>
        </div>

        {/* Step Body */}
        <div className="mb-8">{currentStep.content}</div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              step === 0
                ? "opacity-30 cursor-not-allowed text-white/40"
                : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!currentStep.isValid}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              currentStep.isValid
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            {step === STEPS.length - 1 ? (
              <>
                Ignite Momentum <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
