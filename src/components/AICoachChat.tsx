import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Goal, MoodEntry, ChatMessage } from "../types";
import { sound } from "../utils/audio";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Zap,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface Props {
  user: UserProfile;
  goals: Goal[];
  moods: MoodEntry[];
  streak: number;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onBadgeUnlock: (badgeId: string) => void;
}

export const AICoachChat: React.FC<Props> = ({
  user,
  goals,
  moods,
  streak,
  initialPrompt,
  onClearInitialPrompt,
  onBadgeUnlock,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("mb_chat_history_pro");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "welcome-1",
        sender: "coach",
        text: `Hey ${user.name || "friend"}! 🚀 I'm your MotivaBOT Pro AI Coach. Whatever friction, big ambition, or resistance you're facing today, we will cut through it together. What are we conquering right now?`,
        emotion: "inspiring",
        actionStep: "Name the single most important target on your plate.",
        quickReplies: [
          "I'm feeling stuck on a task",
          "Help me break down a goal",
          "Give me an energy reset",
          "Plan my deep work session",
        ],
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("mb_chat_history_pro", JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle incoming initial prompt from other screens
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "en-US";

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recog.onerror = () => {
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, []);

  const toggleListening = () => {
    sound.playClick();
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    sound.playClick();
    setInput("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          userProfile: user,
          goals,
          moods,
          streak,
          chatHistory: messages.slice(-6),
        }),
      });

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();

      const coachMessage: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: data.text || "Let's keep building momentum. What's your immediate next step?",
        emotion: data.emotion || "inspiring",
        actionStep: data.actionStep,
        quickReplies: data.quickReplies || ["Tell me more", "Next action", "Thanks Coach!"],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, coachMessage]);
      sound.playSuccess();
      onBadgeUnlock("ai_chat");
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        text: `Remember: Clarity comes from action, not from overthinking. Let's take the single easiest sub-step available right now.`,
        emotion: "grounding",
        actionStep: "Set a 15-minute timer and focus solely on your immediate task.",
        quickReplies: ["I'm ready", "Help me break it down", "Reset my mindset"],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      sound.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      sound.speak(text, () => {
        setSpeakingMsgId(null);
      });
    }
  };

  const handleResetChat = () => {
    if (confirm("Reset conversation history?")) {
      sound.playClick();
      const initial: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: "coach",
          text: `Hey ${user.name}! Let's restart fresh with total focus. What is on your mind today?`,
          emotion: "inspiring",
          actionStep: "Identify your main focus for this session.",
          quickReplies: ["Goal Planning", "Overcoming Resistance", "Daily Review"],
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(initial);
      localStorage.removeItem("mb_chat_history_pro");
    }
  };

  const emotionPills: Record<string, { label: string; bg: string; text: string }> = {
    enthusiastic: { label: "🔥 High Voltage", bg: "bg-orange-500/20 border-orange-400/40", text: "text-orange-300" },
    empathetic: { label: "💜 Empathetic Listening", bg: "bg-purple-500/20 border-purple-400/40", text: "text-purple-300" },
    inspiring: { label: "✨ Visionary Drive", bg: "bg-amber-500/20 border-amber-400/40", text: "text-amber-300" },
    tactical: { label: "⚔️ Tactical Execution", bg: "bg-emerald-500/20 border-emerald-400/40", text: "text-emerald-300" },
    grounding: { label: "🌊 Grounded Calm", bg: "bg-blue-500/20 border-blue-400/40", text: "text-blue-300" },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[750px] bg-[#0a081e] backdrop-blur-2xl border border-yellow-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 border-b border-yellow-600/15 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated Glowing Coach Orb */}
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#0a081e] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">MotivaBOT AI Coach</h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30 uppercase tracking-wider">
                Gemini 3.7 Pro
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Calibrated to {user.name} ({user.motivationStyle})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset Chat"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const emotion = msg.emotion ? emotionPills[msg.emotion] : null;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md ${
                  isUser
                    ? "bg-yellow-500 text-black font-bold text-xs"
                    : "bg-gradient-to-tr from-yellow-400 to-orange-500 text-black"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl leading-relaxed text-xs sm:text-sm ${
                    isUser
                      ? "bg-yellow-500/20 text-yellow-100 font-medium rounded-tr-none border border-yellow-500/30 shadow-md shadow-yellow-500/10"
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none shadow-lg"
                  }`}
                >
                  {/* Emotion Pill if from coach */}
                  {!isUser && emotion && (
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${emotion.bg} ${emotion.text}`}
                      >
                        {emotion.label}
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Immediate Action Step Callout */}
                  {!isUser && msg.actionStep && (
                    <div className="mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs flex items-start gap-2">
                      <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-yellow-400 block mb-0.5 uppercase tracking-wider text-[10px]">
                          Immediate Action Target:
                        </span>
                        {msg.actionStep}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                {!isUser && (
                  <div className="flex items-center gap-2 px-1">
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className="text-[11px] text-white/40 hover:text-yellow-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                          <span className="text-yellow-400 font-semibold">Mute</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Quick Reply Chips from Coach */}
                {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => handleSendMessage(qr)}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/5 hover:bg-yellow-500/20 text-white/70 hover:text-yellow-300 border border-white/10 hover:border-yellow-500/40 transition cursor-pointer"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 text-black flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-yellow-500/20 text-white/60 text-xs flex items-center gap-2 rounded-tl-none">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-yellow-300 font-medium ml-1">Calibrating strategic response...</span>
            </div>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Voice input"}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              isListening
                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                : "bg-white/5 border-white/10 hover:border-yellow-500/40 text-white/70 hover:text-yellow-400"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening ? "Listening to your voice..." : "Ask your AI coach for guidance, strategy, or mindset clarity..."
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-3 rounded-xl font-bold transition flex items-center justify-center ${
              input.trim() && !loading
                ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
