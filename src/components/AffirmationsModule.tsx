import React, { useState } from "react";
import { AffirmationItem, UserProfile } from "../types";
import { sound } from "../utils/audio";
import {
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Star,
  Layers,
} from "lucide-react";

interface Props {
  user: UserProfile;
  favoriteAffirmations: AffirmationItem[];
  setFavoriteAffirmations: (items: AffirmationItem[]) => void;
}

const CATEGORIES = [
  "Mindset & Vision",
  "Action & Momentum",
  "Resilience & Grit",
  "Deep Focus & Flow",
  "Unshakable Confidence",
  "Wealth & High Value",
  "Inner Calm & Poise",
];

const DEFAULT_AFFIRMATIONS: AffirmationItem[] = [
  {
    id: "d1",
    category: "Mindset & Vision",
    text: "Don't wait for motivation. Build it deliberately step by step.",
    activationAction: "Decide your next action and execute without hesitation.",
  },
  {
    id: "d2",
    category: "Action & Momentum",
    text: "Small daily actions compound into undeniable excellence.",
    activationAction: "Complete the single highest-leverage task on your desk first.",
  },
  {
    id: "d3",
    category: "Resilience & Grit",
    text: "Friction is proof of growth. I do not shrink from resistance; I expand through it.",
    activationAction: "Take three slow breaths and step directly into the challenge.",
  },
  {
    id: "d4",
    category: "Deep Focus & Flow",
    text: "I control my focus, my output, and my reaction. Distractions have no power over my intent.",
    activationAction: "Close all irrelevant tabs and silence notifications for 45 minutes.",
  },
  {
    id: "d5",
    category: "Unshakable Confidence",
    text: "I am fully equipped to master any obstacle placed on my path.",
    activationAction: "Stand tall, roll shoulders back, and speak with conviction.",
  },
  {
    id: "d6",
    category: "Wealth & High Value",
    text: "My skills and strategic focus create compounding leverage and value every day.",
    activationAction: "Deliver 10% more quality than expected on your next output.",
  },
];

export const AffirmationsModule: React.FC<Props> = ({
  user,
  favoriteAffirmations,
  setFavoriteAffirmations,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("Mindset & Vision");
  const [affirmationsList, setAffirmationsList] = useState<AffirmationItem[]>(DEFAULT_AFFIRMATIONS);
  const [activeTab, setActiveTab] = useState<"browse" | "favorites">("browse");
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const filteredAffirmations = affirmationsList.filter((a) => a.category === selectedCategory);

  const handleGenerateFresh = async () => {
    sound.playClick();
    setLoading(true);
    try {
      const response = await fetch("/api/generate-affirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          userProfile: user,
        }),
      });

      if (!response.ok) throw new Error("Affirmation generation failed");
      const data = await response.json();

      const newItems: AffirmationItem[] = (data.affirmations || []).map((item: any, idx: number) => ({
        id: `gen-${Date.now()}-${idx}`,
        category: selectedCategory,
        text: item.text,
        activationAction: item.activationAction,
      }));

      // Keep default affirmations for other categories, replace or prepend for current category
      const others = affirmationsList.filter((a) => a.category !== selectedCategory);
      setAffirmationsList([...newItems, ...others]);
      sound.playSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (item: AffirmationItem) => {
    sound.playClick();
    const isFav = favoriteAffirmations.some((f) => f.text === item.text);
    if (isFav) {
      setFavoriteAffirmations(favoriteAffirmations.filter((f) => f.text !== item.text));
    } else {
      setFavoriteAffirmations([{ ...item, isFavorite: true }, ...favoriteAffirmations]);
      sound.playSuccess();
    }
  };

  const handleSpeak = (id: string | number, text: string) => {
    if (speakingId === id) {
      sound.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      sound.speak(text, () => {
        setSpeakingId(null);
      });
    }
  };

  const handleCopy = (id: string | number, text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("browse");
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              activeTab === "browse"
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/20"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            Mindset Affirmations
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab("favorites");
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "favorites"
                ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/20"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
            Favorites ({favoriteAffirmations.length})
          </button>
        </div>

        {activeTab === "browse" && (
          <button
            type="button"
            onClick={handleGenerateFresh}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating..." : "✨ AI Generate"}
          </button>
        )}
      </div>

      {activeTab === "browse" ? (
        <div className="space-y-6">
          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
                      : "bg-white/[0.03] border-white/5 hover:border-white/20 text-white/60"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Affirmation Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredAffirmations.map((item) => {
              const isFav = favoriteAffirmations.some((f) => f.text === item.text);
              return (
                <div
                  key={item.id}
                  className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-amber-400/80">
                        {item.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSpeak(item.id, item.text)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-amber-400 transition"
                          title="Read aloud"
                        >
                          {speakingId === item.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.text)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-amber-400 transition"
                          title="Copy affirmation"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item)}
                          className={`p-1.5 rounded-lg transition ${
                            isFav ? "text-pink-400" : "text-white/40 hover:text-pink-400"
                          }`}
                          title="Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      "{item.text}"
                    </p>
                  </div>

                  {item.activationAction && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 block text-[10px] uppercase">
                          Anchor Action:
                        </span>
                        {item.activationAction}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Favorites Tab */
        <div className="space-y-3">
          {favoriteAffirmations.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#0e0c28]/60 border border-white/5 rounded-2xl">
              <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white/70">No favorite affirmations yet</h3>
              <p className="text-xs text-white/40 mt-1">
                Browse affirmations and tap the heart icon to save your power mantras here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteAffirmations.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0e0c28]/90 border border-amber-500/25 rounded-2xl p-5 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(item)}
                      className="text-pink-400 p-1"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white leading-relaxed">"{item.text}"</p>
                  {item.activationAction && (
                    <div className="text-[11px] text-amber-200/80 bg-white/5 p-2 rounded-lg">
                      {item.activationAction}
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
