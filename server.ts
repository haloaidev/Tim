import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment. AI endpoints will fall back to rich default intelligence.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient multi-model fallback caller for Gemini API
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-1.5-flash"];

async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
  let lastErr: any = null;
  const requestedModel = params.model || "gemini-2.5-flash";
  const modelsToTry = [
    requestedModel,
    ...FALLBACK_MODELS.filter((m) => m !== requestedModel),
  ];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return response;
    } catch (err: any) {
      console.warn(`Gemini model '${modelName}' encountered an issue (${err?.message || err}). Trying fallback model...`);
      lastErr = err;
    }
  }
  throw lastErr;
}

// ── API ROUTES ────────────────────────────────────────────────────────────────

// 1. AI Coach Chat Endpoint
app.post("/api/coach", async (req, res) => {
  const { message, userProfile, goals = [], moods = [], streak = 0, chatHistory = [] } = req.body || {};
  const userName = userProfile?.name || "Friend";

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      text: `Hey ${userName}! Every bold transformation starts with exactly one small, courageous action. Let's look at what's in front of you and cut through any hesitation. What is the single highest-leverage task you can complete in the next 20 minutes?`,
      emotion: "inspiring",
      actionStep: "Write down your immediate next step and set a 15-minute timer.",
      quickReplies: ["Help me break down a goal", "I'm feeling stuck today", "Review my progress", "Give me a quick boost"],
    });
  }

  try {
    const ai = getAI();
    const systemPrompt = `You are MotivaBOT Pro, a world-class executive motivation coach, empathetic life strategist, and best-friend momentum driver.
Your philosophy: "Don't wait for motivation. Build it step by step." You bridge warmth, emotional validation, sharp tactical clarity, and accountability without toxic positivity.

User Context:
- Name: ${userName}
- Age: ${userProfile?.age || "Not specified"}
- Motivation Style: ${userProfile?.motivationStyle || "milestones and progress"}
- Peak Productivity Window: ${userProfile?.preferredTime || "throughout the day"}
- Core Focus Goals: ${Array.isArray(userProfile?.goals) ? userProfile.goals.join(", ") : "Growth"}
- Key Friction Obstacles: ${Array.isArray(userProfile?.challenges) ? userProfile.challenges.join(", ") : "Focus and energy"}
- Current Streak: ${streak} days
- Active Goals in App: ${goals.length > 0 ? goals.map((g: any) => `"${g.text}" (${g.category}, ${g.progress}% done)`).join("; ") : "No active goals yet"}
- Recent Mood History: ${moods.length > 0 ? moods.slice(0, 3).map((m: any) => m.mood).join(", ") : "Balanced"}

Instructions:
1. Address ${userName} authentically and warmly.
2. Meet their emotional state first, then guide them to an empowering, ultra-concrete next step.
3. Keep responses punchy, inspiring, structured, and conversational (2-4 concise paragraphs max).
4. Provide a crisp single actionStep they can execute immediately.
5. Provide 3-4 contextual follow-up quick reply prompts.
6. Tag the primary emotional tone from: "enthusiastic", "empathetic", "inspiring", "tactical", "grounding".`;

    const formattedHistory = chatHistory.slice(-8).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The coach's spoken conversational reply" },
            emotion: { type: Type.STRING, description: "One of: enthusiastic, empathetic, inspiring, tactical, grounding" },
            actionStep: { type: Type.STRING, description: "One tangible 10-30 minute next micro-action" },
            quickReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 concise recommended prompt chips for the user",
            },
          },
          required: ["text", "emotion", "actionStep", "quickReplies"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      text: parsed.text || "Let's focus on what you can control right now. What is your immediate single focus step?",
      emotion: parsed.emotion || "inspiring",
      actionStep: parsed.actionStep || "Pick one small action and begin.",
      quickReplies: parsed.quickReplies || ["Break down goal", "Give me momentum", "Next step"],
    });
  } catch (err: any) {
    console.warn("Coach API fallback triggered:", err?.message || err);
    return res.json({
      text: `I hear you ${userName}! Remember that momentum is built moment by moment. Let's reset together: what is one small win you can claim right now?`,
      emotion: "empathetic",
      actionStep: "Take 3 deep breaths, drink a glass of water, and pick one single task.",
      quickReplies: ["Let's start fresh", "Help me prioritize", "Give me a reminder of why I started"],
    });
  }
});

// 2. Channel Legendary Figure Wisdom
app.post("/api/channel-quote", async (req, res) => {
  const { figureName = "Marcus Aurelius", figureEra = "Stoic Rome", figureThemes = "Discipline & Control", topic = "momentum", userName = "Seeker" } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      quote: `Greatness is not a sudden lightning strike; it is the compounding discipline of refusing to negotiate with temporary fatigue.`,
      context: `Channeling the timeless discipline and relentless spirit of ${figureName}.`,
      practicalTakeaway: `Choose focus over comfort in your very next decision.`,
      memorableKeyword: `Relentless Focus`,
    });
  }

  try {
    const ai = getAI();
    const prompt = `You are channeling the authentic spirit, voice, cadence, and philosophical framework of ${figureName} (${figureEra}).
Themes and worldview: ${figureThemes}.
Recipient: ${userName}.
Topic: ${topic}.

Task: Produce a profound, original, historically resonant quote and life philosophy reflection that feels genuinely authored by ${figureName}. Avoid cliché generic platitudes.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: "2-3 sentence powerful quote in their authentic voice" },
            context: { type: Type.STRING, description: "Historical and philosophical context explaining how this connects to their life work" },
            practicalTakeaway: { type: Type.STRING, description: "A direct application of this wisdom for modern daily execution" },
            memorableKeyword: { type: Type.STRING, description: "A 2-3 word core principle or archetype title" },
          },
          required: ["quote", "context", "practicalTakeaway", "memorableKeyword"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      quote: parsed.quote || "Do not wait for conditions to become favorable; the master creates the conditions.",
      context: parsed.context || `Drawn from classical principles of personal mastery as taught by ${figureName}.`,
      practicalTakeaway: parsed.practicalTakeaway || "Take initiative today rather than waiting for external validation.",
      memorableKeyword: parsed.memorableKeyword || "Active Mastery",
    });
  } catch (err: any) {
    console.warn("Quote channeling fallback triggered:", err?.message || err);
    return res.json({
      quote: "Do not wait for conditions to become favorable; the master creates the conditions.",
      context: `Drawn from classical principles of personal mastery and deliberate action in the style of ${figureName}.`,
      practicalTakeaway: "Take initiative today rather than waiting for external validation.",
      memorableKeyword: "Active Mastery",
    });
  }
});

// 3. Dynamic Affirmations Generator
app.post("/api/generate-affirmations", async (req, res) => {
  const { category = "Mindset", userProfile, currentMood } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      affirmations: [
        { text: "My focus expands where my energy is deliberately invested.", focusArea: category, activationAction: "Eliminate one digital distraction for 1 hour." },
        { text: "Small daily actions compound into undeniable excellence.", focusArea: "Action", activationAction: "Complete your first task before checking messages." },
        { text: "I do not shrink from resistance; friction is proof of my expansion.", focusArea: "Resilience", activationAction: "Lean directly into the hardest conversation or task." },
      ],
    });
  }

  try {
    const ai = getAI();
    const prompt = `Generate 4 punchy, grounded, high-potency affirmations for category "${category}".
User Profile: Name: ${userProfile?.name || "Friend"}, Goals: ${Array.isArray(userProfile?.goals) ? userProfile.goals.join(", ") : "Growth"}, Motivation: ${userProfile?.motivationStyle || "Achievement"}, Mood: ${currentMood || "Balanced"}.

Make them active, visceral, free of fluffy cliché, and rooted in psychological self-efficacy. Each affirmation must include a tangible activation action.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            affirmations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "The affirmation statement" },
                  focusArea: { type: Type.STRING, description: "Subcategory or theme" },
                  activationAction: { type: Type.STRING, description: "Micro physical or mental action to anchor it" },
                },
                required: ["text", "focusArea", "activationAction"],
              },
            },
          },
          required: ["affirmations"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      affirmations: Array.isArray(parsed.affirmations) && parsed.affirmations.length > 0
        ? parsed.affirmations
        : [
            { text: "My focus expands where my energy is deliberately invested.", focusArea: category, activationAction: "Eliminate one digital distraction for 1 hour." },
            { text: "Small daily actions compound into undeniable excellence.", focusArea: "Action", activationAction: "Complete your first task before checking messages." },
          ],
    });
  } catch (err: any) {
    console.warn("Affirmations fallback triggered:", err?.message || err);
    return res.json({
      affirmations: [
        { text: "I am the active architect of my daily trajectory.", focusArea: "Ownership", activationAction: "Decide your top priority before noon." },
        { text: "My discipline unlocks freedoms that motivation alone cannot sustain.", focusArea: "Discipline", activationAction: "Start your timer now." },
      ],
    });
  }
});

// 4. Daily Horoscope & Cosmic Momentum Guide
app.post("/api/horoscope", async (req, res) => {
  const { sign = "Aries", userGoals = [] } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      summary: `Dynamic cosmic momentum illuminates your ambition today. Your innate clarity cuts through noise when you stay committed to core priorities.`,
      powerHours: "9:00 AM – 11:30 AM",
      luckyNumber: 7,
      luckyColor: "Auric Gold",
      elementFocus: "Strategic Execution",
      alignmentTip: "Guard your morning energy; high-leverage decisions yield compounding gains.",
    });
  }

  try {
    const ai = getAI();
    const prompt = `Provide an insightful, inspiring daily cosmic momentum analysis for Zodiac sign ${sign}.
Active User Target Goals: ${userGoals.length > 0 ? userGoals.map((g: any) => g.text).join(", ") : "Personal Mastery"}.
Blend cosmic symbolism with practical psychological empowerment and productivity momentum.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "2-3 sentences on the daily cosmic momentum" },
            powerHours: { type: Type.STRING, description: "Peak productivity time window" },
            luckyNumber: { type: Type.INTEGER, description: "Lucky number" },
            luckyColor: { type: Type.STRING, description: "Harmonic color" },
            elementFocus: { type: Type.STRING, description: "Core strength archetype for today" },
            alignmentTip: { type: Type.STRING, description: "Actionable strategic suggestion for the day" },
          },
          required: ["summary", "powerHours", "luckyNumber", "luckyColor", "elementFocus", "alignmentTip"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      summary: parsed.summary || `Dynamic cosmic momentum illuminates your path for ${sign}. Focus on key priorities today.`,
      powerHours: parsed.powerHours || "9:00 AM – 12:00 PM",
      luckyNumber: typeof parsed.luckyNumber === "number" ? parsed.luckyNumber : 7,
      luckyColor: parsed.luckyColor || "Auric Gold",
      elementFocus: parsed.elementFocus || "Strategic Execution",
      alignmentTip: parsed.alignmentTip || "Guard your morning focus block for high-leverage goals.",
    });
  } catch (err: any) {
    console.warn("Horoscope fallback triggered:", err?.message || err);
    return res.json({
      summary: `Your natural strengths as a ${sign} are magnified today. Direct your focus toward high-value milestones.`,
      powerHours: "10:00 AM – 1:00 PM",
      luckyNumber: 8,
      luckyColor: "Radiant Amber",
      elementFocus: "Grounded Momentum",
      alignmentTip: "Trust your intuition and follow through with structured execution.",
    });
  }
});

// 5. Daily Motivational Quote Generator
app.post("/api/daily-quote", async (req, res) => {
  const { userProfile, activeGoalText, category = "Mindset & Mastery" } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      quote: "Your execution today is the bridge between who you are and who you are destined to become.",
      author: "MotivaBOT Pro AI",
      theme: category,
      reflection: "Momentum is built through tiny, consistent choices made when no one is watching.",
      microChallenge: "Complete your single highest-priority task in the next 30 minutes without checking your phone.",
    });
  }

  try {
    const ai = getAI();
    const prompt = `Generate a powerful, deeply inspiring, non-cliché daily motivational quote and execution reflection tailored for:
User: ${userProfile?.name || "Achiever"}, Motivation archetype: ${userProfile?.motivationStyle || "Achievement"}, Active Target: ${activeGoalText || "Mastery & Focus"}, Category: ${category}.

Return a compelling quote, famous or AI mentor author, core theme, a 2-sentence psychological reflection, and a 10-minute micro-challenge to anchor the motivation.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: "Inspiring 1-2 sentence quote" },
            author: { type: Type.STRING, description: "Author or mentor name" },
            theme: { type: Type.STRING, description: "Theme or topic tag" },
            reflection: { type: Type.STRING, description: "2-sentence practical reflection" },
            microChallenge: { type: Type.STRING, description: "Actionable 10-minute micro challenge" },
          },
          required: ["quote", "author", "theme", "reflection", "microChallenge"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      quote: parsed.quote || "Your execution today is the bridge between who you are and who you are destined to become.",
      author: parsed.author || "MotivaBOT AI Strategy",
      theme: parsed.theme || category,
      reflection: parsed.reflection || "Momentum is built through tiny, consistent choices made when no one is watching.",
      microChallenge: parsed.microChallenge || "Complete your single highest-priority task in the next 30 minutes without checking your phone.",
    });
  } catch (err: any) {
    console.warn("Daily quote fallback triggered:", err?.message || err);
    return res.json({
      quote: "Do not negotiate with your potential. Step directly into the action that frightens you most.",
      author: "Marcus Aurelius Strategy",
      theme: "Courage & Execution",
      reflection: "Friction is the exact indicator of where your next level of growth resides.",
      microChallenge: "Spend 15 uninterrupted minutes on your most intimidating objective.",
    });
  }
});

// 6. Goal AI Deconstruction Breakdown
app.post("/api/breakdown-goal", async (req, res) => {
  const { goalText, category, priority, userProfile } = req.body || {};

  if (!goalText) {
    return res.status(400).json({ error: "Goal text is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      milestones: [
        { title: "Define Scope & Metrics", description: "Establish exact numbers, timeline, and boundary conditions." },
        { title: "Remove Immediate Friction", description: "Set up tools, environment, and eliminate prime distractions." },
        { title: "Execute Micro-Sprint 1", description: "Commit 45 minutes of deep focus to the first core deliverable." },
        { title: "Review & Compound", description: "Audit momentum weekly and scale output by 10%." },
      ],
      estimatedDays: 21,
      victoryReward: "Celebrate by logging your milestone in MotivaBOT and unlocking your achievement badge!",
    });
  }

  try {
    const ai = getAI();
    const prompt = `Break down the goal "${goalText}" (${category}, ${priority} priority) into 4 crisp, actionable milestones.
User: ${userProfile?.name || "Friend"}, Motivation Style: ${userProfile?.motivationStyle || "Achievement"}.
Return realistic milestones, estimated timeline in days, and an inspiring milestone celebration reward.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
            },
            estimatedDays: { type: Type.INTEGER },
            victoryReward: { type: Type.STRING },
          },
          required: ["milestones", "estimatedDays", "victoryReward"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      milestones: Array.isArray(parsed.milestones) && parsed.milestones.length > 0
        ? parsed.milestones
        : [
            { title: "Preparation & Setup", description: "Gather resources and block focus time on calendar." },
            { title: "First Execution Sprint", description: "Deliver 25% progress on core target." },
          ],
      estimatedDays: typeof parsed.estimatedDays === "number" ? parsed.estimatedDays : 14,
      victoryReward: parsed.victoryReward || "Log your victory in MotivaBOT and claim your streak reward!",
    });
  } catch (err: any) {
    console.warn("Goal breakdown fallback triggered:", err?.message || err);
    return res.json({
      milestones: [
        { title: "Preparation & Setup", description: "Gather all necessary resources and schedule blocks on your calendar." },
        { title: "First Sprint", description: "Reach 25% milestone through dedicated daily blocks." },
        { title: "Midpoint Momentum", description: "Review progress and adjust tactics for maximum velocity." },
        { title: "Final Sprint & Completion", description: "Cross the finish line and document key takeaways." },
      ],
      estimatedDays: 14,
      victoryReward: "Celebrate claiming this victory!",
    });
  }
});

// 7. VOX AI Party Game - Prompt Generator Endpoint
app.post("/api/vox-prompt", async (req, res) => {
  const { category = "Movies", isMiniGame = false, modeName = "Standard", difficulty = "medium", round = 1 } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    const fallbackList = [
      "Jurassic Park", "Cyberpunk Samurai", "Space Station Landing",
      "Baking a Cake", "Platypus", "Quantum Computer", "Skateboarding"
    ];
    const item = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    return res.json({ prompt: item, mode: modeName });
  }

  try {
    const ai = getAI();
    const promptText = isMiniGame
      ? `You are VOX, an AI party host. Generate a single ${difficulty} charade prompt or emoji phrase for game mode "${modeName}". Category: ${category}. Keep it under 5 words.`
      : `You are VOX. Generate a single ${difficulty} charade prompt for category: ${category}. Round ${round}. Keep it under 4 words.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING, description: "The charade or riddle prompt" },
          },
          required: ["prompt"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      prompt: parsed.prompt?.replace(/"/g, "") || "Cyberpunk Matrix",
      mode: modeName,
    });
  } catch (err: any) {
    console.warn("VOX prompt fallback triggered:", err?.message || err);
    return res.json({
      prompt: "Matrix Revolution",
      mode: modeName,
    });
  }
});

// 8. VOX AI Party Game - Sarcastic AI Judgment Endpoint
app.post("/api/vox-judgment", async (req, res) => {
  const { currentPrompt = "Charade", wasGuessed = false, teamName = "Team Alpha", playerName = "Player" } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      judgment: wasGuessed
        ? `Impressive acting by ${playerName}! VOX awards bonus points to ${teamName}.`
        : `Analysis complete for ${playerName}. Points awarded strictly for physical survival.`,
    });
  }

  try {
    const ai = getAI();
    const promptText = wasGuessed
      ? `A player named ${playerName} from ${teamName} just successfully acted out: "${currentPrompt}". Give a hilarious 1-sentence sarcastic commentary praising their performance.`
      : `A player named ${playerName} from ${teamName} just failed to act out: "${currentPrompt}". Give a hilarious 1-sentence sarcastic judgment of their performance.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judgment: { type: Type.STRING, description: "1-sentence sarcastic commentary" },
          },
          required: ["judgment"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      judgment: parsed.judgment || "I've seen better acting in a CAPTCHA test.",
    });
  } catch (err: any) {
    console.warn("VOX judgment fallback triggered:", err?.message || err);
    return res.json({
      judgment: "Analysis complete. Points awarded strictly for structural survival.",
    });
  }
});

// 9. Simple Username Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
  return res.json({
    user: {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      displayName: username.trim(),
      avatarPreset: "⚡",
      createdAt: new Date().toISOString(),
      totalGames: 1,
      totalWins: 1,
      totalPoints: 100,
    },
    message: "Logged in successfully",
  });
});

// ── VITE MIDDLEWARE SETUP ─────────────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MotivaBOT Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
