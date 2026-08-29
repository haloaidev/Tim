import React, { useState, useEffect } from "react";
import { Goal } from "../types";
import { sound } from "../utils/audio";
import {
  Star,
  Sparkles,
  Moon,
  Clock,
  Zap,
  Compass,
  RefreshCw,
} from "lucide-react";

interface Props {
  goals: Goal[];
}

const ZODIAC_SIGNS = [
  { id: "aries", label: "Aries", glyph: "♈", dates: "Mar 21 – Apr 19", element: "Fire 🔥" },
  { id: "taurus", label: "Taurus", glyph: "♉", dates: "Apr 20 – May 20", element: "Earth 🌍" },
  { id: "gemini", label: "Gemini", glyph: "♊", dates: "May 21 – Jun 20", element: "Air 💨" },
  { id: "cancer", label: "Cancer", glyph: "♋", dates: "Jun 21 – Jul 22", element: "Water 🌊" },
  { id: "leo", label: "Leo", glyph: "♌", dates: "Jul 23 – Aug 22", element: "Fire 🔥" },
  { id: "virgo", label: "Virgo", glyph: "♍", dates: "Aug 23 – Sep 22", element: "Earth 🌍" },
  { id: "libra", label: "Libra", glyph: "♎", dates: "Sep 23 – Oct 22", element: "Air 💨" },
  { id: "scorpio", label: "Scorpio", glyph: "♏", dates: "Oct 23 – Nov 21", element: "Water 🌊" },
  { id: "sagittarius", label: "Sagittarius", glyph: "♐", dates: "Nov 22 – Dec 21", element: "Fire 🔥" },
  { id: "capricorn", label: "Capricorn", glyph: "♑", dates: "Dec 22 – Jan 19", element: "Earth 🌍" },
  { id: "aquarius", label: "Aquarius", glyph: "♒", dates: "Jan 20 – Feb 18", element: "Air 💨" },
  { id: "pisces", label: "Pisces", glyph: "♓", dates: "Feb 19 – Mar 20", element: "Water 🌊" },
];

const MOON_PHASES = [
  { name: "🌑 New Moon", desc: "Setting bold new intentions and seeding momentum" },
  { name: "🌒 Waxing Crescent", desc: "Building consistent daily operational velocity" },
  { name: "🌓 First Quarter", desc: "Overcoming resistance and executing key decisions" },
  { name: "🌔 Waxing Gibbous", desc: "Refining details and compounding output" },
  { name: "🌕 Full Moon", desc: "Peak clarity, celebration of wins, and illumination" },
  { name: "🌖 Waning Gibbous", desc: "Synthesizing lessons and sharing insights" },
  { name: "🌗 Last Quarter", desc: "Releasing friction, unburdening mental clutter" },
  { name: "🌘 Waning Crescent", desc: "Deep rest, recharge, and inner vision alignment" },
];

export const HoroscopeModule: React.FC<Props> = ({ goals }) => {
  const [selectedSign, setSelectedSign] = useState<string>(() => {
    return localStorage.getItem("mb_zodiac_sign") || "aries";
  });

  const [horoscopeData, setHoroscopeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const curSign = ZODIAC_SIGNS.find((z) => z.id === selectedSign) || ZODIAC_SIGNS[0];
  const dayOfMonth = new Date().getDate();
  const moonPhase = MOON_PHASES[dayOfMonth % MOON_PHASES.length];

  const fetchHoroscope = async (signId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sign: signId,
          userGoals: goals,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch horoscope");
      const data = await response.json();
      setHoroscopeData(data);
    } catch (err) {
      console.error(err);
      setHoroscopeData({
        summary: `Dynamic cosmic energy aligns with your focus today. Trust your operational discipline and execute your top priority without hesitation.`,
        powerHours: "9:30 AM – 12:00 PM",
        luckyNumber: 8,
        luckyColor: "Auric Gold",
        elementFocus: "Grounded Momentum",
        alignmentTip: "Guard your morning clarity; single-tasking creates extraordinary compounding leverage.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoroscope(selectedSign);
    try {
      localStorage.setItem("mb_zodiac_sign", selectedSign);
    } catch {}
  }, [selectedSign]);

  const handleSelectSign = (signId: string) => {
    sound.playClick();
    setSelectedSign(signId);
  };

  return (
    <div className="space-y-6">
      {/* Sign Selector Grid */}
      <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
            Cosmic Momentum & Astrological Alignment
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ZODIAC_SIGNS.map((z) => {
            const isSelected = selectedSign === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => handleSelectSign(z.id)}
                className={`p-2.5 rounded-xl border text-center transition ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10 scale-[1.03]"
                    : "bg-white/[0.03] border-white/5 hover:border-white/20 text-white/70"
                }`}
              >
                <div className="text-xl mb-0.5">{z.glyph}</div>
                <div className="text-xs font-bold text-white truncate">{z.label}</div>
                <div className="text-[9px] text-white/40">{z.dates.split("–")[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sign Cosmic Forecast */}
      <div className="bg-[#0e0c28]/95 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{curSign.glyph}</span>
            <div>
              <h3 className="text-xl font-extrabold text-amber-300">
                {curSign.label} Cosmic Forecast
              </h3>
              <p className="text-xs text-white/50">
                {curSign.dates} · Element: <span className="font-semibold text-white/80">{curSign.element}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              fetchHoroscope(selectedSign);
            }}
            disabled={loading}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-amber-400 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Forecast
          </button>
        </div>

        {/* Forecast Content */}
        {loading ? (
          <div className="py-12 text-center text-amber-300/60 text-xs flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            Synthesizing cosmic alignments & goal trajectories...
          </div>
        ) : horoscopeData ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm sm:text-base text-white/95 leading-relaxed italic">
              "{horoscopeData.summary}"
            </div>

            {/* Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Power Window
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-300">
                  {horoscopeData.powerHours}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Archetype Focus
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {horoscopeData.elementFocus}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Harmonic Color
                </div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {horoscopeData.luckyColor}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1 mb-1">
                  <Compass className="w-3 h-3 text-amber-400" /> Power Number
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-400">
                  #{horoscopeData.luckyNumber}
                </div>
              </div>
            </div>

            {/* Strategic Alignment Tip */}
            {horoscopeData.alignmentTip && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80">
                <strong className="text-amber-300 block mb-0.5 uppercase tracking-wider text-[10px]">
                  Daily Alignment Protocol:
                </strong>
                {horoscopeData.alignmentTip}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Moon Phase Widget */}
      <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex items-center gap-4">
        <div className="text-4xl select-none">{moonPhase.name.split(" ")[0]}</div>
        <div>
          <h4 className="text-sm font-bold text-white">{moonPhase.name}</h4>
          <p className="text-xs text-white/50 mt-0.5">{moonPhase.desc}</p>
        </div>
      </div>
    </div>
  );
};
