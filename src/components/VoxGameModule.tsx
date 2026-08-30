import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  Music,
  Trophy,
  Play,
  ShieldCheck,
  Zap,
  RefreshCcw,
  Volume2,
  ChevronRight,
  Terminal,
  MessageSquare,
  Users,
  Dices,
  Sparkles,
  UserPlus,
  ArrowRight,
  Timer,
  BrainCircuit,
  Swords,
  Ghost,
  Flame,
  Layout,
  Settings as SettingsIcon,
  Crown,
  UserCheck,
  Star,
  Activity,
  Award,
  LogOut,
  User,
  History,
} from "lucide-react";
import confetti from "canvas-confetti";
import { dbManager, StoredUser, GameHistoryRecord } from "../utils/db";
import { VoxPerformanceProfiler } from "./VoxPerformanceProfiler";

// --- GAME DATA & ENGINE CONFIG ---
export const MINI_GAMES = [
  { id: "SPEED", name: "Speed Round", icon: <Zap size={20} />, color: "text-yellow-400", bg: "bg-yellow-400/10", description: "20s rapid fire guessing!", bonus: 2 },
  { id: "EMOJI", name: "Emoji Decode", icon: <Ghost size={20} />, color: "text-purple-400", bg: "bg-purple-400/10", description: "Guess phrases from emojis." },
  { id: "SOUND", name: "Sound Mode", icon: <Volume2 size={20} />, color: "text-blue-400", bg: "bg-blue-400/10", description: "Only sound clues allowed." },
  { id: "BOSS", name: "AI Boss Round", icon: <BrainCircuit size={20} />, color: "text-red-500", bg: "bg-red-500/10", description: "Defeat the AI's riddles." },
];

export const CATEGORIES = [
  { name: "Movies", items: ["Jurassic Park", "The Matrix", "Avatar", "Inception", "Titanic", "Interstellar"] },
  { name: "Actions", items: ["Skateboarding", "Deep Sea Diving", "Baking a Cake", "Climbing Everest", "Dj-ing a Party"] },
  { name: "Animals", items: ["Kangaroo", "Honey Badger", "Platypus", "Electric Eel", "Chameleon"] },
  { name: "Sci-Fi & Tech", items: ["Cyberpunk Drone", "Quantum Computer", "Mars Rover", "Virtual Reality"] },
];

export type VoxAppState =
  | "HERO"
  | "LOBBY"
  | "ROUND_START"
  | "PLAYING"
  | "MINI_GAME"
  | "ROUND_RESULTS"
  | "FINAL_LEADERBOARD"
  | "AUTH"
  | "PROFILER";

interface VoxGameModuleProps {
  user: StoredUser | null;
  onUserChange: (user: StoredUser | null) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const VoxGameModule: React.FC<VoxGameModuleProps> = ({
  user,
  onUserChange,
  onNavigateToTab,
}) => {
  // --- STATE MACHINE ---
  const [appState, setAppState] = useState<VoxAppState>("HERO");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auth Modal/Input State
  const [authUsernameInput, setAuthUsernameInput] = useState("");

  // Lobby & Setup
  const [lobbyCode] = useState(() => Math.random().toString(36).substring(2, 7).toUpperCase());
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedMiniGame, setSelectedMiniGame] = useState<typeof MINI_GAMES[0] | null>(null);

  const [teams, setTeams] = useState({
    A: { name: "Team Alpha", score: 0, players: user ? [user.displayName] : ["Player 1", "Alex"] },
    B: { name: "Team Omega", score: 0, players: ["Sam", "Taylor"] },
  });

  // Gameplay Loop
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(6);
  const [activeTeam, setActiveTeam] = useState<"A" | "B">("A");
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentCategory, setCurrentCategory] = useState("Movies");
  const [timer, setTimer] = useState(45);
  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isMiniGameRound, setIsMiniGameRound] = useState(false);

  // Game History State
  const [matchHistory, setMatchHistory] = useState<GameHistoryRecord[]>(() => dbManager.getGameHistory());

  // Refs
  const timerRef = useRef<any>(null);

  // --- VOICE SYNTHESIS WITH MEMORY LEAK PREVENTION ---
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const handleStart = () => setIsSpeaking(true);
      const handleEnd = () => setIsSpeaking(false);

      utterance.onstart = handleStart;
      utterance.onend = handleEnd;
      utterance.onerror = handleEnd;
      utterance.pitch = 0.7; // Robotic VOX pitch
      utterance.rate = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis error:", e);
    }
  }, []);

  // --- AI PROMPT GENERATION (SERVER PROXY WITH FALLBACK) ---
  const generateAIContent = async (isMiniGame = false, gameModeObj?: any) => {
    setLoading(true);
    const difficulty = round > 3 ? "hard" : "medium";
    const modeName = gameModeObj ? gameModeObj.name : isMiniGame ? "Mini Game" : "Standard Charades";

    try {
      const response = await fetch("/api/vox-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: currentCategory,
          isMiniGame,
          modeName,
          difficulty,
          round,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const promptText = data.prompt || "Cyberpunk Neon City";
        setCurrentPrompt(promptText);
        speak(`The prompt for round ${round} is: ${promptText}`);
      } else {
        throw new Error("Server response not ok");
      }
    } catch (error) {
      // Fallback generator from local category pool
      const cat = CATEGORIES.find((c) => c.name === currentCategory) || CATEGORIES[0];
      const fallbackPrompt = cat.items[Math.floor(Math.random() * cat.items.length)];
      setCurrentPrompt(fallbackPrompt);
      speak(`The prompt is: ${fallbackPrompt}`);
    } finally {
      setLoading(false);
    }
  };

  // --- AI SARCASTIC JUDGMENT (SERVER PROXY WITH FALLBACK) ---
  const getVoxJudgment = async (wasGuessed: boolean) => {
    setLoading(true);
    try {
      const response = await fetch("/api/vox-judgment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrompt,
          wasGuessed,
          teamName: teams[activeTeam].name,
          playerName: teams[activeTeam].players[activePlayerIdx] || "Player",
          score: teams[activeTeam].score,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const judgment = data.judgment || "I've seen better acting from a floppy disk.";
        setAiAnalysis(judgment);
        speak(judgment);
      } else {
        throw new Error("Judgment failed");
      }
    } catch (e) {
      const defaultJudgment = wasGuessed
        ? "VOX is impressed! Quantum nodes updated."
        : "Analysis complete. Points awarded strictly for survival.";
      setAiAnalysis(defaultJudgment);
      speak(defaultJudgment);
    } finally {
      setLoading(false);
    }
  };

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (appState === "PLAYING" || appState === "MINI_GAME") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState]);

  // --- TIMER EXPIRATION HANDLER ---
  const handleTimeUp = () => {
    speak("Time is up! Round complete.");
    getVoxJudgment(false);
    setAppState("ROUND_RESULTS");
  };

  // --- PLAYER & TEAM MANAGEMENT ---
  const handleAddPlayer = (teamKey: "A" | "B") => {
    if (!newPlayerName.trim()) return;
    const name = newPlayerName.trim();
    setTeams((prev) => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        players: [...prev[teamKey].players, name],
      },
    }));
    setNewPlayerName("");
  };

  // --- GAMEPLAY ACTIONS ---
  const startGame = () => {
    setRound(1);
    setTeams((prev) => ({
      A: { ...prev.A, score: 0 },
      B: { ...prev.B, score: 0 },
    }));
    setActiveTeam("A");
    setActivePlayerIdx(0);
    setAppState("ROUND_START");
    speak("Welcome to VOX Charades! Prepare for high-stakes AI gaming.");
  };

  const startRound = (miniGameObj?: typeof MINI_GAMES[0]) => {
    const isMini = !!miniGameObj;
    setIsMiniGameRound(isMini);
    setSelectedMiniGame(miniGameObj || null);
    setGuesses([]);
    setAiAnalysis("");
    setTimer(miniGameObj?.id === "SPEED" ? 20 : 45);

    generateAIContent(isMini, miniGameObj);

    setAppState(isMini ? "MINI_GAME" : "PLAYING");
  };

  const handleCorrectGuess = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const bonusMultiplier = selectedMiniGame?.bonus || 1;
    const addedPoints = (100 + timer * 5) * bonusMultiplier;

    setTeams((prev) => ({
      ...prev,
      [activeTeam]: {
        ...prev[activeTeam],
        score: prev[activeTeam].score + addedPoints,
      },
    }));

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}

    speak(`Correct! ${teams[activeTeam].name} scores ${addedPoints} points!`);
    getVoxJudgment(true);
    setAppState("ROUND_RESULTS");
  };

  const handleAddGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;

    const clean = guessInput.trim();
    setGuesses((prev) => [clean, ...prev]);

    if (clean.toLowerCase() === currentPrompt.toLowerCase()) {
      handleCorrectGuess();
    }
    setGuessInput("");
  };

  const nextTurn = () => {
    if (round >= maxRounds) {
      // Game Over -> Final Leaderboard
      const winnerName =
        teams.A.score > teams.B.score
          ? teams.A.name
          : teams.B.score > teams.A.score
          ? teams.B.name
          : "Tie";

      // Save Game Record to DB
      const record = dbManager.saveGameSession({
        timestamp: new Date().toISOString(),
        lobbyCode,
        teamAScore: teams.A.score,
        teamBScore: teams.B.score,
        winningTeam: winnerName as any,
        roundsPlayed: round,
        gameMode: selectedMiniGame ? selectedMiniGame.name : "Classic VOX",
        mvpPlayer: teams.A.players[0] || "Player 1",
        promptsGuessed: round * 2,
      });

      setMatchHistory(dbManager.getGameHistory());

      if (user) {
        dbManager.updateUserStats(user.username, teams.A.score, winnerName === teams.A.name);
        onUserChange(dbManager.getCurrentUser());
      }

      try {
        confetti({ particleCount: 100, spread: 100 });
      } catch {}

      speak(`Game Over! Victory belongs to ${winnerName}!`);
      setAppState("FINAL_LEADERBOARD");
      return;
    }

    // Switch team and player index
    if (activeTeam === "A") {
      setActiveTeam("B");
    } else {
      setActiveTeam("A");
      setRound((prev) => prev + 1);
      setActivePlayerIdx((prev) => (prev + 1) % Math.max(1, teams.A.players.length));
    }

    setAppState("ROUND_START");
  };

  // Auth Handler
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsernameInput.trim()) return;
    const { user: loggedInUser } = dbManager.loginUser(authUsernameInput);
    onUserChange(loggedInUser);
    setAuthUsernameInput("");
    setAppState("HERO");
  };

  const handleLogout = () => {
    dbManager.logoutUser();
    onUserChange(null);
  };

  const activePlayerName = teams[activeTeam].players[activePlayerIdx] || "Player";

  return (
    <div className="space-y-6">
      {/* HEADER & AUTH BAR */}
      <div className="bg-[#0b081e] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400">
            <BrainCircuit className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">VOX AI Party Games</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                Lobby #{lobbyCode}
              </span>
            </div>
            <p className="text-xs text-white/60">Multi-mode AI Charades, Speech Synthesis & Performance Engine</p>
          </div>
        </div>

        {/* User Account Bar */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-sm">
                {user.avatarPreset}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{user.displayName}</div>
                <div className="text-[10px] text-yellow-400 font-medium">
                  {user.totalPoints} pts • {user.totalWins} wins
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAppState("AUTH")}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition cursor-pointer"
            >
              <User className="w-4 h-4" /> Sign In / Create Profile
            </button>
          )}

          <button
            type="button"
            onClick={() => setAppState("PROFILER")}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Activity className="w-4 h-4" /> System Profiler
          </button>
        </div>
      </div>

      {/* --- STAGE 1: HERO VIEW --- */}
      {appState === "HERO" && (
        <div className="relative bg-[#0d0926] border border-cyan-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-black border border-yellow-500/30 uppercase tracking-wider">
              AI-Powered Party Game Engine
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Unleash <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">VOX AI Charades</span> & Sarcastic Judgments
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Experience rapid-fire charades, emoji phrase decoding, sound clues, and AI riddles guided by VOX—your sarcastic robotic host with real-time speech synthesis!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <button
              type="button"
              onClick={() => setAppState("LOBBY")}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-cyan-500/20 flex items-center gap-3 transition hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-current" /> Enter Game Lobby
            </button>
          </div>

          {/* Feature Showcase Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-left relative z-10">
            {MINI_GAMES.map((mg) => (
              <div key={mg.id} className={`p-5 rounded-3xl border border-white/10 ${mg.bg} space-y-2`}>
                <div className={`flex items-center justify-between ${mg.color}`}>
                  {mg.icon}
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40">
                    {mg.id}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white">{mg.name}</div>
                <div className="text-xs text-white/60">{mg.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- STAGE 2: LOBBY VIEW --- */}
      {appState === "LOBBY" && (
        <div className="bg-[#0a081e] border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-2xl font-black text-white">Match Setup & Team Roster</h2>
              <p className="text-xs text-white/60 mt-0.5">Configure teams, select prompt categories, and lock in your players.</p>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition hover:scale-105 cursor-pointer uppercase tracking-wider"
            >
              <Swords className="w-4 h-4" /> Launch Match ({maxRounds} Rounds)
            </button>
          </div>

          {/* Category Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Select Prompt Deck Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCurrentCategory(cat.name)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    currentCategory === cat.name
                      ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <div className="text-sm font-bold text-white">{cat.name}</div>
                  <div className="text-[10px] text-white/50 mt-1">{cat.items.length} prompts</div>
                </button>
              ))}
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Alpha */}
            <div className="p-6 rounded-3xl bg-cyan-950/20 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" /> Team Alpha
                </h3>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full">
                  {teams.A.players.length} Players
                </span>
              </div>

              <div className="space-y-2">
                {teams.A.players.map((p, idx) => (
                  <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-semibold text-white">
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-cyan-400" /> {p}
                    </span>
                    {idx === 0 && <span className="text-[10px] text-yellow-400 uppercase font-bold">Captain</span>}
                  </div>
                ))}
              </div>

              {/* Add Player Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add player to Alpha..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddPlayer("A")}
                  className="px-3 py-2 bg-cyan-500 text-black text-xs font-bold rounded-xl hover:bg-cyan-400 transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Team Omega */}
            <div className="p-6 rounded-3xl bg-purple-950/20 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-purple-300 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-purple-400" /> Team Omega
                </h3>
                <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">
                  {teams.B.players.length} Players
                </span>
              </div>

              <div className="space-y-2">
                {teams.B.players.map((p, idx) => (
                  <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-semibold text-white">
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-purple-400" /> {p}
                    </span>
                    {idx === 0 && <span className="text-[10px] text-yellow-400 uppercase font-bold">Captain</span>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add player to Omega..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddPlayer("B")}
                  className="px-3 py-2 bg-purple-500 text-black text-xs font-bold rounded-xl hover:bg-purple-400 transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 3: ROUND START ANNOUNCEMENT --- */}
      {appState === "ROUND_START" && (
        <div className="bg-[#0a081e] border border-cyan-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/30">
            Round {round} of {maxRounds}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">
              Up Next: <span className="text-yellow-400">{teams[activeTeam].name}</span>
            </h2>
            <p className="text-sm text-white/70">
              Active Actor: <strong className="text-white">{activePlayerName}</strong>
            </p>
          </div>

          {/* Standard or Special Mini-Game Selector */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="text-xs font-bold text-white/60 uppercase tracking-wider">Choose Round Type</div>

            <button
              type="button"
              onClick={() => startRound()}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" /> Play Standard Charades Round (45s)
            </button>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {MINI_GAMES.map((mg) => (
                <button
                  key={mg.id}
                  type="button"
                  onClick={() => startRound(mg)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${mg.bg} border-white/10 hover:border-white/30`}
                >
                  <div className={`flex items-center gap-2 text-xs font-extrabold ${mg.color}`}>
                    {mg.icon} {mg.name}
                  </div>
                  <div className="text-[10px] text-white/50 mt-1">{mg.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 4: ACTIVE PLAYING / MINI GAME STAGE --- */}
      {(appState === "PLAYING" || appState === "MINI_GAME") && (
        <div className="bg-[#0a081e] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                {teams[activeTeam].name}
              </span>
              <span className="text-xs text-white/60">
                Actor: <strong className="text-white">{activePlayerName}</strong>
              </span>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-2 bg-black/40 border border-yellow-500/30 px-4 py-2 rounded-2xl">
              <Timer className="w-5 h-5 text-yellow-400 animate-spin" />
              <span className="text-2xl font-black text-yellow-400 font-mono">{timer}s</span>
            </div>
          </div>

          {/* Prompt Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-black border-2 border-cyan-400/50 rounded-3xl p-8 text-center space-y-4 shadow-xl relative overflow-hidden">
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Secret Prompt for {activePlayerName}</div>

            {loading ? (
              <div className="py-6 flex flex-col items-center gap-2 text-cyan-400">
                <RefreshCcw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">VOX Neural Prompt Generation...</span>
              </div>
            ) : (
              <div className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {currentPrompt || "Generating..."}
              </div>
            )}

            <p className="text-xs text-white/50">
              {isMiniGameRound
                ? selectedMiniGame?.description
                : "Act out the prompt without speaking! Team mates submit guesses below."}
            </p>
          </div>

          {/* Guesses Input & Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <form onSubmit={handleAddGuess} className="space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">Submit Guess</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Type guess and press Enter..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-2xl shadow-lg transition cursor-pointer"
                >
                  Submit
                </button>
              </div>

              <button
                type="button"
                onClick={handleCorrectGuess}
                className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 text-emerald-400" /> Mark Correctly Guessed (+Points)
              </button>
            </form>

            {/* Guesses Log Stream */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Live Guess Log</div>
              {guesses.length > 0 ? (
                <div className="space-y-1">
                  {guesses.map((g, idx) => (
                    <div key={idx} className="text-xs text-white/80 bg-white/5 px-3 py-1.5 rounded-xl flex items-center justify-between">
                      <span>"{g}"</span>
                      <span className="text-[10px] text-red-400 font-mono">Incorrect</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/40 italic py-4 text-center">No guesses submitted yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE 5: ROUND RESULTS & SARCASTIC JUDGMENT --- */}
      {appState === "ROUND_RESULTS" && (
        <div className="bg-[#0a081e] border border-cyan-500/30 rounded-3xl p-8 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold text-xs border border-yellow-500/30">
              Round {round} Completed
            </span>
            <h2 className="text-3xl font-black text-white">VOX AI Judgment & Performance Audit</h2>
          </div>

          {/* Sarcastic Judgment Card */}
          <div className="p-6 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 rounded-3xl space-y-3 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4 text-purple-400" /> VOX Host Commentary
            </div>
            {loading ? (
              <div className="text-xs text-purple-300 animate-pulse">VOX is formulating judgment...</div>
            ) : (
              <p className="text-base sm:text-lg text-white font-medium italic leading-relaxed">
                "{aiAnalysis || "Points awarded strictly for effort and structural survival."}"
              </p>
            )}
          </div>

          {/* Current Scores Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center">
              <div className="text-xs font-bold text-cyan-300 uppercase">Team Alpha</div>
              <div className="text-3xl font-black text-white mt-1">{teams.A.score} pts</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-center">
              <div className="text-xs font-bold text-purple-300 uppercase">Team Omega</div>
              <div className="text-3xl font-black text-white mt-1">{teams.B.score} pts</div>
            </div>
          </div>

          <button
            type="button"
            onClick={nextTurn}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            Continue to Next Turn <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- STAGE 6: FINAL MATCH LEADERBOARD --- */}
      {appState === "FINAL_LEADERBOARD" && (
        <div className="bg-[#0a081e] border border-yellow-500/40 rounded-3xl p-8 shadow-2xl space-y-8 text-center">
          <div className="space-y-2">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
            <h2 className="text-3xl sm:text-4xl font-black text-white">Match Concluded! Victory Showcase</h2>
            <p className="text-xs text-white/60">Final scores logged to database & user leaderboard</p>
          </div>

          {/* Winner Showcase */}
          <div className="p-6 bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 border border-yellow-500/40 rounded-3xl space-y-2">
            <div className="text-xs font-bold text-yellow-300 uppercase tracking-widest">Winning Champion</div>
            <div className="text-4xl font-black text-white">
              {teams.A.score > teams.B.score
                ? teams.A.name
                : teams.B.score > teams.A.score
                ? teams.B.name
                : "It's a Tie!"}
            </div>
            <div className="text-sm font-extrabold text-yellow-400">
              High Score: {Math.max(teams.A.score, teams.B.score)} Points
            </div>
          </div>

          {/* Match Log History */}
          <div className="space-y-3 text-left">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> Recent Database Match History
            </h3>
            <div className="space-y-2">
              {matchHistory.slice(0, 3).map((m) => (
                <div key={m.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{m.winningTeam} Won</span>
                    <span className="text-white/40 ml-2">({m.gameMode})</span>
                  </div>
                  <div className="font-mono text-cyan-300 font-bold">
                    {m.teamAScore} - {m.teamBScore} pts
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAppState("LOBBY")}
            className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-2xl shadow-xl transition cursor-pointer uppercase tracking-wider"
          >
            Play Another Match
          </button>
        </div>
      )}

      {/* --- STAGE 7: SIMPLE USERNAME AUTH MODAL --- */}
      {appState === "AUTH" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b081e] border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <UserCheck className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-2xl font-black text-white">VOX Simple Username Auth</h3>
              <p className="text-xs text-white/60">Enter your username to sign in or create a persistent game profile.</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-cyan-300">Username</label>
                <input
                  type="text"
                  value={authUsernameInput}
                  onChange={(e) => setAuthUsernameInput(e.target.value)}
                  placeholder="e.g. alex_boss"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAppState("HERO")}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Save / Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STAGE 8: SYSTEM PROFILER MODAL --- */}
      {appState === "PROFILER" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAppState("HERO")}
              className="px-4 py-2 bg-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/20 transition cursor-pointer"
            >
              Back to Game Engine
            </button>
          </div>
          <VoxPerformanceProfiler />
        </div>
      )}
    </div>
  );
};
