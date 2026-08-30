// Database Management System for VOX AI Party Game & User Accounts
// Supports local persistence (localStorage/IndexedDB fallback) & server sync

export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  avatarPreset: string;
  avatarUrl?: string;
  createdAt: string;
  totalGames: number;
  totalWins: number;
  totalPoints: number;
  themeAccent?: string;
}

export interface GameHistoryRecord {
  id: string;
  timestamp: string;
  lobbyCode: string;
  teamAScore: number;
  teamBScore: number;
  winningTeam: "Team Alpha" | "Team Omega" | "Tie";
  roundsPlayed: number;
  gameMode: string;
  mvpPlayer?: string;
  promptsGuessed: number;
}

export interface LeaderboardEntry {
  username: string;
  displayName: string;
  avatarPreset: string;
  totalPoints: number;
  gamesPlayed: number;
  winRatePct: number;
}

const USERS_KEY = "vox_db_users_v1";
const SESSIONS_KEY = "vox_db_sessions_v1";
const CURRENT_USER_KEY = "vox_db_current_user_v1";
const GAME_HISTORY_KEY = "vox_db_game_history_v1";

export const dbManager = {
  // --- USER AUTHENTICATION & PROFILE DB ---
  getUsers(): StoredUser[] {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse users DB:", e);
    }
    return [
      {
        id: "usr_default_1",
        username: "alex_boss",
        displayName: "Alex",
        avatarPreset: "⚡",
        createdAt: new Date().toISOString(),
        totalGames: 12,
        totalWins: 8,
        totalPoints: 1450,
      },
      {
        id: "usr_default_2",
        username: "cyber_sam",
        displayName: "Sam",
        avatarPreset: "🚀",
        createdAt: new Date().toISOString(),
        totalGames: 9,
        totalWins: 5,
        totalPoints: 980,
      },
    ];
  },

  getCurrentUser(): StoredUser | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to read current user DB:", e);
    }
    const users = this.getUsers();
    return users[0] || null;
  },

  loginUser(username: string): { user: StoredUser; isNew: boolean } {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    const users = this.getUsers();
    let existingUser = users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (existingUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));
      return { user: existingUser, isNew: false };
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      username: cleanUsername,
      displayName: username.trim(),
      avatarPreset: ["⚡", "🦁", "🚀", "👑", "🔥", "🏆"][Math.floor(Math.random() * 6)],
      createdAt: new Date().toISOString(),
      totalGames: 0,
      totalWins: 0,
      totalPoints: 0,
    };

    const updatedUsers = [newUser, ...users];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return { user: newUser, isNew: true };
  },

  logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateUserStats(username: string, addedPoints: number, isWin: boolean) {
    const users = this.getUsers();
    const cleanUser = username.trim().toLowerCase().replace(/^@/, "");
    const updated = users.map((u) => {
      if (u.username.toLowerCase() === cleanUser || u.displayName.toLowerCase() === cleanUser) {
        return {
          ...u,
          totalGames: u.totalGames + 1,
          totalWins: isWin ? u.totalWins + 1 : u.totalWins,
          totalPoints: u.totalPoints + addedPoints,
        };
      }
      return u;
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(updated));

    const current = this.getCurrentUser();
    if (current && (current.username.toLowerCase() === cleanUser || current.displayName.toLowerCase() === cleanUser)) {
      const updatedCurrent = updated.find((u) => u.id === current.id);
      if (updatedCurrent) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
      }
    }
  },

  // --- GAME HISTORY DB ---
  getGameHistory(): GameHistoryRecord[] {
    try {
      const data = localStorage.getItem(GAME_HISTORY_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to read game history DB:", e);
    }
    return [
      {
        id: "gh_1",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        lobbyCode: "VX941",
        teamAScore: 450,
        teamBScore: 320,
        winningTeam: "Team Alpha",
        roundsPlayed: 6,
        gameMode: "AI Boss Round",
        mvpPlayer: "Alex",
        promptsGuessed: 14,
      },
      {
        id: "gh_2",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        lobbyCode: "VX108",
        teamAScore: 280,
        teamBScore: 310,
        winningTeam: "Team Omega",
        roundsPlayed: 5,
        gameMode: "Speed Round",
        mvpPlayer: "Sam",
        promptsGuessed: 11,
      },
    ];
  },

  saveGameSession(record: Omit<GameHistoryRecord, "id">): GameHistoryRecord {
    const history = this.getGameHistory();
    const newRecord: GameHistoryRecord = {
      ...record,
      id: `gh_${Date.now()}`,
    };
    const updated = [newRecord, ...history].slice(0, 50); // Keep last 50 games
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(updated));

    // Try server sync
    try {
      fetch("/api/db/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      }).catch(() => {});
    } catch {}

    return newRecord;
  },

  // --- LEADERBOARD & ANALYTICS DB ---
  getLeaderboard(): LeaderboardEntry[] {
    const users = this.getUsers();
    return users
      .map((u) => ({
        username: u.username,
        displayName: u.displayName,
        avatarPreset: u.avatarPreset,
        totalPoints: u.totalPoints,
        gamesPlayed: u.totalGames,
        winRatePct: u.totalGames > 0 ? Math.round((u.totalWins / u.totalGames) * 100) : 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  },

  clearAllDatabaseData() {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(GAME_HISTORY_KEY);
  },
};
