import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Mic,
  MicOff,
  RefreshCw,
  X,
  Sparkles,
  Volume2,
  HelpCircle,
  CloudSun,
  Phone,
  FileText,
  Music,
  Heart,
  FolderOpen,
  Activity,
  Bell
} from "lucide-react";
import { DesktopTheme } from "../types";

// Quick action group mapping for context awareness
const ALL_QUICK_ACTIONS = [
  // Weather Category
  {
    keywords: ["weather", "rain", "cold", "hot", "outside", "temperature", "forecast", "sun", "cloud", "wind", "degrees", "summer", "winter"],
    actions: [
      { id: "weather_check", label: "Check Weather", prompt: "How is the weather today?", category: "weather", colorClass: "border-sky-500/20 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10" },
      { id: "weather_rain", label: "Rain Forecast", prompt: "Will it rain later today?", category: "weather", colorClass: "border-blue-500/20 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10" },
      { id: "weather_dress", label: "Dress Advice", prompt: "What should I wear outside today?", category: "weather", colorClass: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10" }
    ]
  },
  // Calling / Communication Category
  {
    keywords: ["call", "home", "mom", "dad", "family", "phone", "contact", "friend", "sister", "brother", "talk", "dial", "number"],
    actions: [
      { id: "call_home", label: "Call Home", prompt: "Dial emergency voice link to call home", category: "comm", colorClass: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10" },
      { id: "msg_mom", label: "Message Mom", prompt: "Compose a quick text message to Mom", category: "comm", colorClass: "border-teal-500/20 text-teal-400 bg-teal-500/5 hover:bg-teal-500/10" },
      { id: "find_contact", label: "Find Contact", prompt: "Open my address contact book", category: "comm", colorClass: "border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10" }
    ]
  },
  // Tasks & Notes Category
  {
    keywords: ["note", "todo", "task", "remember", "remind", "schedule", "meeting", "list", "calendar", "write", "notepad", "checklist"],
    actions: [
      { id: "create_note", label: "Create Note", prompt: "Open notes app and prepare a text draft", category: "task", colorClass: "border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" },
      { id: "add_todo", label: "Add To-Do", prompt: "Add a new urgent item to my task list", category: "task", colorClass: "border-orange-500/20 text-orange-400 bg-orange-500/5 hover:bg-orange-500/10" },
      { id: "set_remind", label: "Set Reminder", prompt: "Remind me in 10 minutes to review my tasks", category: "task", colorClass: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10" }
    ]
  },
  // Music & Media Category
  {
    keywords: ["music", "song", "play", "track", "video", "media", "audio", "listen", "relax", "beat", "sound", "volume", "player"],
    actions: [
      { id: "play_relax", label: "Play Ambient", prompt: "Play a relaxing lofi soundtrack for focusing", category: "media", colorClass: "border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10" },
      { id: "open_media", label: "Open Media Hub", prompt: "Launch the video and file media container", category: "media", colorClass: "border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-500/5 hover:bg-fuchsia-500/10" },
      { id: "next_track", label: "Skip Track", prompt: "Skip to the next audio track in player", category: "media", colorClass: "border-pink-500/20 text-pink-400 bg-pink-500/5 hover:bg-pink-500/10" }
    ]
  },
  // Emotions & Health Category
  {
    keywords: ["feel", "sad", "happy", "tired", "anxious", "stress", "sleep", "heart", "breathe", "calm", "relax", "angry", "lonely"],
    actions: [
      { id: "breath_ex", label: "Breathing Exercise", prompt: "Start a 4-7-8 breathing core exercise", category: "health", colorClass: "border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10" },
      { id: "mood_check", label: "Measure Emotion", prompt: "Open current feelings and biometric sensor", category: "health", colorClass: "border-pink-500/20 text-pink-400 bg-pink-500/5 hover:bg-pink-500/10" },
      { id: "motivate_me", label: "Encourage Me", prompt: "Give me an inspiring motivational speech", category: "health", colorClass: "border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10" }
    ]
  },
  // Files & System Category
  {
    keywords: ["file", "folder", "explorer", "recycle", "bin", "trash", "memory", "space", "storage", "backup", "system", "disk", "clean"],
    actions: [
      { id: "explore_files", label: "Explore Files", prompt: "Open the file explorer navigation application", category: "sys", colorClass: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10" },
      { id: "empty_bin", label: "Check Recycle Bin", prompt: "Open the deleted trash files history bin", category: "sys", colorClass: "border-teal-500/20 text-teal-400 bg-teal-500/5 hover:bg-teal-500/10" },
      { id: "sys_stat", label: "System Status", prompt: "Show CPU core, network latencies, and RAM data", category: "sys", colorClass: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10" }
    ]
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "weather": return CloudSun;
    case "comm": return Phone;
    case "task": return FileText;
    case "media": return Music;
    case "health": return Heart;
    case "sys": return FolderOpen;
    default: return Sparkles;
  }
};

interface ChatMessage {
  id: string;
  sender: "user" | "maya";
  text: string;
  timestamp: string;
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  sessionState: "disconnected" | "connecting" | "idle" | "speaking";
  toggleMic: () => void;
  isMicActive: boolean;
  theme: DesktopTheme;
  transcription: string;
  triggerVoicePrompt: (prompt: string) => void;
}

export default function AssistantDrawer({
  isOpen,
  onClose,
  messages,
  sendMessage,
  sessionState,
  toggleMic,
  isMicActive,
  theme,
  transcription,
  triggerVoicePrompt
}: AssistantDrawerProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll down on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcription]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const getContextActions = () => {
    const contextText = messages
      .slice(-4)
      .map((m) => m.text.toLowerCase())
      .join(" ");

    const matchedActions: any[] = [];

    // 1. Find matched categories and accumulate their actions
    ALL_QUICK_ACTIONS.forEach((group) => {
      const hasMatch = group.keywords.some((keyword) => contextText.includes(keyword));
      if (hasMatch) {
        group.actions.forEach((act) => {
          matchedActions.push(act);
        });
      }
    });

    // 2. Curate the final list (up to 4, unique)
    const finalActions = [...matchedActions];

    // Default actions to fall back to if we need more
    const defaultActions = [
      { id: "weather_check", label: "Check Weather", prompt: "How is the weather today?", category: "weather", colorClass: "border-sky-500/20 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10" },
      { id: "call_home", label: "Call Home", prompt: "Dial emergency voice link to call home", category: "comm", colorClass: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10" },
      { id: "create_note", label: "Create Note", prompt: "Open notes app and prepare a text draft", category: "task", colorClass: "border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" },
      { id: "explore_files", label: "Explore Files", prompt: "Open the file explorer navigation application", category: "sys", colorClass: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10" }
    ];

    // Add defaults if we have fewer than 4 items
    defaultActions.forEach((defAct) => {
      if (finalActions.length < 4 && !finalActions.some((fa) => fa.id === defAct.id)) {
        finalActions.push(defAct);
      }
    });

    return finalActions.slice(0, 4);
  };

  const getStyles = () => {
    switch (theme) {
      case "neon":
        return "bg-black/95 border-l border-cyan-500/30 shadow-[-10px_0_25px_rgba(6,182,212,0.15)] text-cyan-100";
      case "cyberpunk":
        return "bg-black/95 border-l border-yellow-500/30 shadow-[-10px_0_25px_rgba(234,179,8,0.15)] text-yellow-100";
      case "amoled":
        return "bg-black border-l border-zinc-900 text-zinc-100";
      case "light":
        return "bg-white/95 border-l border-gray-300 text-gray-800 backdrop-blur-xl shadow-2xl";
      case "dark":
      default:
        return "bg-[#04040a]/95 border-l border-white/10 text-white backdrop-blur-xl shadow-2xl";
    }
  };

  const accentBg = theme === "neon" ? "bg-cyan-500/10" : theme === "cyberpunk" ? "bg-yellow-500/10" : theme === "light" ? "bg-rose-500/10" : "bg-rose-500/10";
  const accentText = theme === "neon" ? "text-cyan-400" : theme === "cyberpunk" ? "text-yellow-400" : theme === "light" ? "text-rose-500" : "text-rose-400";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-30 pointer-events-none flex justify-end">
        <motion.div
          initial={{ x: "100%", opacity: 0.9 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className={`w-[350px] max-w-[calc(100vw-32px)] h-full pointer-events-auto flex flex-col justify-between ${getStyles()}`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${accentText} animate-pulse`} />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">Maya Terminal</span>
                <span className="text-[9px] text-gray-500 font-mono">CONVERSATION STREAM</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 select-text" ref={scrollRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`p-2.5 rounded-2xl text-[11.5px] leading-relaxed ${
                    m.sender === "user"
                      ? `${accentBg} ${accentText} rounded-tr-none border border-cyan-500/10`
                      : "bg-white/[0.03] text-gray-200 border border-white/5 rounded-tl-none"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[8px] font-mono text-gray-500 mt-1 uppercase tracking-wide">
                  {m.sender === "user" ? "YOU" : "MAYA"} • {m.timestamp}
                </span>
              </div>
            ))}

            {/* Dynamic Real-time Speech Transcription */}
            {transcription && (
              <div className="p-3 rounded-xl border border-dashed border-cyan-500/20 bg-cyan-950/10 text-cyan-200 animate-pulse text-[11px] flex gap-2">
                <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] uppercase font-bold text-cyan-400">Live Transcribe:</span>
                  <p className="mt-0.5 font-sans leading-relaxed">{transcription}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Menu */}
          <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Context Quick Actions</span>
              </div>
              <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10 uppercase tracking-wide">
                Topic Active
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {getContextActions().map((act) => {
                const IconComponent = getCategoryIcon(act.category);
                return (
                  <button
                    key={act.id}
                    onClick={() => triggerVoicePrompt(act.prompt)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-[9.5px] transition cursor-pointer font-medium hover:scale-[1.01] active:scale-95 ${act.colorClass}`}
                  >
                    <IconComponent className="w-3 h-3 shrink-0" />
                    <span className="truncate">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Suggestions Cards */}
          <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex gap-1.5 overflow-x-auto select-none no-scrollbar">
            {[
              "Tell a joke",
              "How's my memory?",
              "Generate audio track",
              "Who built you?"
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => triggerVoicePrompt(prompt)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9.5px] whitespace-nowrap transition text-gray-300 hover:text-white cursor-pointer flex items-center gap-1 shrink-0"
              >
                <HelpCircle className="w-3 h-3 text-cyan-400" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>

          {/* Bottom Chat Bar input controls */}
          <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isMicActive 
                  ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_8px_#22d3ee]" 
                  : "bg-white/5 border-transparent text-gray-400 hover:text-white"
              }`}
              title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicActive ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
            </button>

            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder={isMicActive ? "Speak or type response..." : "Type response here..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-cyan-500/50 text-white placeholder-gray-400 transition"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4 font-bold" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
