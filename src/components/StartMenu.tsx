import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  FolderClosed, 
  FileText, 
  Smartphone, 
  Music, 
  ShieldCheck, 
  LogOut, 
  Settings, 
  User, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  RefreshCw,
  Cpu
} from "lucide-react";
import { DesktopTheme } from "../types";

interface StartMenuProps {
  theme: DesktopTheme;
  isOpen: boolean;
  onClose: () => void;
  user: any;
  openWindow: (appId: string) => void;
  signInWithGoogle: () => void;
  logOut: () => void;
  tasksCount: number;
  triggerVoicePrompt: (prompt: string) => void;
  toggleDesktopMode: () => void;
}

export default function StartMenu({
  theme,
  isOpen,
  onClose,
  user,
  openWindow,
  signInWithGoogle,
  logOut,
  tasksCount,
  triggerVoicePrompt,
  toggleDesktopMode
}: StartMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  // Apps list for searching
  const appsList = [
    { id: "explorer", name: "File Explorer", desc: "Simulated file manager & recycle bin", icon: FolderClosed, color: "text-amber-400" },
    { id: "notes", name: "Notes & Checklist", desc: "Create records, set timers, and checklist logs", icon: FileText, color: "text-blue-400" },
    { id: "phone", name: "Phone Controls", desc: "Access flashlight, Wi-Fi toggles, camera, and player", icon: Smartphone, color: "text-emerald-400" },
    { id: "music", name: "Music Studio", desc: "AI-powered music generator powered by Gemini Lyria", icon: Music, color: "text-purple-400" },
    { id: "python", name: "Jarvis Python Engine", desc: "Automation scripts, WhatsApp alerts, dialer hooks", icon: Cpu, color: "text-cyan-400" },
    { id: "security", name: "PIN Security", desc: "Biometrics & security credentials manager", icon: ShieldCheck, color: "text-red-400" }
  ];

  const filteredApps = appsList.filter(
    (app) => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMenuStyles = () => {
    switch (theme) {
      case "neon":
        return "bg-black/95 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.3)] text-cyan-100";
      case "cyberpunk":
        return "bg-black/95 border border-yellow-500/30 shadow-[0_0_25px_rgba(234,179,8,0.25)] text-yellow-100";
      case "amoled":
        return "bg-black border border-zinc-800 text-zinc-100";
      case "light":
        return "bg-white/95 border border-gray-300 text-gray-800 backdrop-blur-xl shadow-2xl";
      case "dark":
      default:
        return "bg-[#09090f]/95 border border-white/10 text-white backdrop-blur-xl shadow-2xl";
    }
  };

  const accentText = theme === "neon" ? "text-cyan-400" : theme === "cyberpunk" ? "text-yellow-400" : theme === "light" ? "text-rose-500" : "text-rose-400";
  const accentBg = theme === "neon" ? "bg-cyan-500/10" : theme === "cyberpunk" ? "bg-yellow-500/10" : theme === "light" ? "bg-rose-500/10" : "bg-rose-500/10";

  // Predefined smart voice command suggestions for Mr. Rajesh
  const promptSuggestions = [
    "Tell me today's daily briefing",
    "Turn flashlight on",
    "Show my notes",
    "Translate 'Good morning, my friend' to Hindi",
    "Open Google Maps",
    "Am I productive today?"
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-30 pointer-events-none" onClick={onClose}>
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className={`absolute bottom-16 left-4 w-[600px] max-w-[calc(100vw-32px)] h-[500px] rounded-2xl flex flex-col pointer-events-auto overflow-hidden ${getMenuStyles()}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Search Panel */}
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search programs, notes, shortcuts, or help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition"
              />
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-400" />
            </div>
          </div>

          {/* Core Start Menu Grid */}
          <div className="flex-1 flex min-h-0">
            {/* Left Column: Programs Grid */}
            <div className="flex-1 p-4 overflow-y-auto border-r border-white/5">
              <span className="text-[10px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-3">Programs / Installed Apps</span>
              
              <div className="space-y-1.5">
                {filteredApps.length > 0 ? (
                  filteredApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        openWindow(app.id);
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 flex items-center gap-3 transition cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-white/5">
                        <app.icon className={`w-5 h-5 ${app.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold">{app.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{app.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic p-4 text-center">No apps found matching search</p>
                )}
              </div>
            </div>

            {/* Right Column: Daily Briefing & Suggestions */}
            <div className="w-[240px] p-4 bg-white/[0.01] overflow-y-auto flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-3">Daily Briefing</span>
                
                {/* Briefing console card */}
                <div className={`p-3 rounded-xl border border-white/5 ${accentBg} flex flex-col mb-4`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className={`w-4 h-4 ${accentText} animate-pulse`} />
                    <span className="text-xs font-bold font-sans">Rajesh's Terminal</span>
                  </div>
                  <p className="text-[11px] leading-normal opacity-85">
                    Welcome back, Sir. All systems are operational. You have {tasksCount} checklist goals pending. Keep up the high productivity!
                  </p>
                </div>

                <span className="text-[10px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-2">Voice Actions</span>
                <div className="space-y-1">
                  {promptSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        triggerVoicePrompt(prompt);
                        onClose();
                      }}
                      className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-white/5 text-[10.5px] opacity-80 hover:opacity-100 transition truncate cursor-pointer flex items-center gap-1.5"
                    >
                      <span className={`w-1 h-1 rounded-full ${theme === "neon" ? "bg-cyan-400" : "bg-rose-400"}`} />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Profile and Settings Footer */}
          <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL || "https://www.gstatic.com/images/branding/product/2x/avatar_anonymous_120_120.png"}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-white/10"
                />
                <div className="text-left">
                  <span className="text-xs font-semibold block leading-none">{user.displayName || "Mr. Rajesh"}</span>
                  <span className="text-[9px] text-gray-500 font-mono">System Administrator</span>
                </div>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 text-xs font-bold hover:text-cyan-400 transition cursor-pointer"
              >
                <User className="w-4.5 h-4.5" />
                <span>Log In Admin</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  toggleDesktopMode();
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-white/5 border border-amber-500/20 hover:bg-amber-500/10 text-amber-400 transition cursor-pointer flex items-center justify-center"
                title="Switch to Mobile Assistant View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  openWindow("notes"); // Open settings under notes/to-dos app
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-gray-400 hover:text-white cursor-pointer"
                title="System Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              {user && (
                <button
                  onClick={logOut}
                  className="p-1.5 rounded-lg bg-white/5 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 transition cursor-pointer"
                  title="Disconnect and Lock"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
