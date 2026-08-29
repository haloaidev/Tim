import React, { useRef } from "react";
import { UserProfile, Goal, MoodEntry, QuoteItem, AffirmationItem } from "../types";
import { sound } from "../utils/audio";
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Trash2,
  ShieldCheck,
  Database,
  RefreshCw,
} from "lucide-react";

interface Props {
  user: UserProfile;
  goals: Goal[];
  moods: MoodEntry[];
  habits: string[];
  streak: number;
  badges: string[];
  savedQuotes: QuoteItem[];
  favoriteAffirmations: AffirmationItem[];
  onImportData: (data: any) => void;
  onResetAll: () => void;
  onBadgeUnlock: (badgeId: string) => void;
}

export const ExportModule: React.FC<Props> = ({
  user,
  goals,
  moods,
  habits,
  streak,
  badges,
  savedQuotes,
  favoriteAffirmations,
  onImportData,
  onResetAll,
  onBadgeUnlock,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadJSON = () => {
    sound.playClick();
    const backupData = {
      version: "2.5.0-pro",
      exportedAt: new Date().toISOString(),
      user,
      goals,
      moods,
      habits,
      streak,
      badges,
      savedQuotes,
      favoriteAffirmations,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motivabot-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onBadgeUnlock("exported");
    sound.playSuccess();
  };

  const handleDownloadCSV = () => {
    sound.playClick();
    const headers = "Date,Mood,EnergyLevel,Notes,HabitsCompleted";
    const rows = moods.map((m) => {
      const dateStr = new Date(m.timestamp).toLocaleDateString();
      const notesClean = `"${(m.notes || "").replace(/"/g, '""')}"`;
      const habitsClean = `"${(m.habits || []).join(" | ")}"`;
      return `${dateStr},${m.mood},${m.energyLevel || 8},${notesClean},${habitsClean}`;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `motivabot-mood-habits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onBadgeUnlock("exported");
    sound.playSuccess();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.user || parsed.goals) {
          onImportData(parsed);
          sound.playSuccess();
          alert("Backup data restored successfully!");
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Data Stats Card */}
      <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
            Data Vault & Export Center
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl font-extrabold text-amber-400">{goals.length}</div>
            <div className="text-[11px] text-white/50">Goals Tracked</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl font-extrabold text-pink-400">{moods.length}</div>
            <div className="text-[11px] text-white/50">Mood Logs</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl font-extrabold text-emerald-400">{savedQuotes.length}</div>
            <div className="text-[11px] text-white/50">Saved Quotes</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl font-extrabold text-orange-400">{badges.length}</div>
            <div className="text-[11px] text-white/50">Badges Unlocked</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <FileJson className="w-6 h-6 text-amber-400" />
              <h3 className="font-bold text-white text-sm sm:text-base">Full JSON Backup</h3>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Export your entire MotivaBOT profile, goals, habits, mood history, and saved wisdom into a portable JSON snapshot.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:opacity-95 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download JSON Backup
          </button>
        </div>

        <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-white text-sm sm:text-base">Spreadsheet CSV</h3>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Export your daily mood logs and habit streaks into a CSV format compatible with Excel, Google Sheets, and Notion.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition border border-white/15 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV Spreadsheet
          </button>
        </div>
      </div>

      {/* Restore & Danger Zone */}
      <div className="bg-[#0e0c28]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
          Backup Restore & Reset
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div>
            <h4 className="text-xs font-bold text-white">Restore from Backup</h4>
            <p className="text-[11px] text-white/40">Import a previously exported JSON backup file.</p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Backup
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div>
            <h4 className="text-xs font-bold text-rose-300">Reset Local Profile & Data</h4>
            <p className="text-[11px] text-rose-200/50">Clear all local storage and return to onboarding.</p>
          </div>

          <button
            type="button"
            onClick={onResetAll}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
