import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Trash2, 
  Volume2, 
  Volume1,
  Sun, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  Lightbulb, 
  Languages, 
  Palette, 
  Check,
  Cpu,
  BrainCircuit,
  MessageSquareOff
} from "lucide-react";
import { DesktopTheme, SystemNotification, PhoneState } from "../types";

interface NotificationCenterProps {
  theme: DesktopTheme;
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  
  phoneState: PhoneState;
  updatePhoneState: (updated: Partial<PhoneState>) => void;
  
  selectedLanguage: "en" | "hi" | "or" | "bn";
  changeLanguage: (lang: "en" | "hi" | "or" | "bn") => void;
  
  uiTheme: DesktopTheme;
  changeTheme: (theme: DesktopTheme) => void;
  
  personality: "fiesty" | "sarcastic" | "sweetheart" | "girlfriend" | "normal" | "romantic";
  changePersonality: (p: "fiesty" | "sarcastic" | "sweetheart" | "girlfriend" | "normal" | "romantic") => void;
  
  voiceSpeed: number;
  changeVoiceSpeed: (speed: number) => void;

  companion: "maya" | "oska";
  changeCompanion: (companion: "maya" | "oska") => void;
}

export default function NotificationCenter({
  theme,
  isOpen,
  onClose,
  notifications,
  clearNotifications,
  markNotificationAsRead,
  phoneState,
  updatePhoneState,
  selectedLanguage,
  changeLanguage,
  uiTheme,
  changeTheme,
  personality,
  changePersonality,
  voiceSpeed,
  changeVoiceSpeed,
  companion,
  changeCompanion
}: NotificationCenterProps) {
  if (!isOpen) return null;

  const getStyles = () => {
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
  const accentBorder = theme === "neon" ? "border-cyan-500/30" : theme === "cyberpunk" ? "border-yellow-500/30" : theme === "light" ? "border-rose-500/30" : "border-rose-500/30";

  const toggleWifi = () => updatePhoneState({ wifiOn: !phoneState.wifiOn });
  const toggleBluetooth = () => updatePhoneState({ bluetoothOn: !phoneState.bluetoothOn });
  const toggleFlashlight = () => updatePhoneState({ flashlightOn: !phoneState.flashlightOn });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-30 pointer-events-none" onClick={onClose}>
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className={`absolute bottom-16 right-4 w-[360px] max-w-[calc(100vw-32px)] h-[540px] rounded-2xl flex flex-col pointer-events-auto overflow-hidden ${getStyles()}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className={`w-4 h-4 ${accentText}`} />
              <span className="text-xs font-bold font-sans uppercase tracking-wider">Control & Notification Desk</span>
            </div>
            <button
              onClick={onClose}
              className="text-xs font-mono text-gray-500 hover:text-white transition cursor-pointer"
            >
              CLOSE
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* 1. Quick Control Toggles */}
            <div>
              <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-2">Device Controls</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={toggleWifi}
                  className={`py-2 px-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                    phoneState.wifiOn 
                      ? `${accentBg} ${accentBorder} text-white` 
                      : "bg-white/5 border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  <span className="text-[10px]">Wi-Fi</span>
                </button>
                <button
                  onClick={toggleBluetooth}
                  className={`py-2 px-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                    phoneState.bluetoothOn 
                      ? `${accentBg} ${accentBorder} text-white` 
                      : "bg-white/5 border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <Bluetooth className="w-4 h-4" />
                  <span className="text-[10px]">Bluetooth</span>
                </button>
                <button
                  onClick={toggleFlashlight}
                  className={`py-2 px-3 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                    phoneState.flashlightOn 
                      ? `${accentBg} ${accentBorder} text-white animate-pulse` 
                      : "bg-white/5 border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-[10px]">Flashlight</span>
                </button>
              </div>
            </div>

            {/* 2. Device Sliders */}
            <div className="space-y-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-1">Telemetry Sinks</span>
              
              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Sun className="w-3.5 h-3.5" /> Screen Brightness
                  </span>
                  <span className="font-mono text-[10px]">{phoneState.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={phoneState.brightness}
                  onChange={(e) => updatePhoneState({ brightness: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Volume */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Volume2 className="w-3.5 h-3.5" /> Media Volume
                  </span>
                  <span className="font-mono text-[10px]">{phoneState.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={phoneState.volume}
                  onChange={(e) => updatePhoneState({ volume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* System Volume */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Volume1 className="w-3.5 h-3.5 text-cyan-400" /> System Volume
                  </span>
                  <span className="font-mono text-[10px]">{phoneState.systemVolume ?? 60}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={phoneState.systemVolume ?? 60}
                  onChange={(e) => updatePhoneState({ systemVolume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Voice Speed */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Cpu className="w-3.5 h-3.5" /> TTS Voice Speed
                  </span>
                  <span className="font-mono text-[10px]">{voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => changeVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Theme Selector */}
            <div>
              <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-2">Desktop Theme Customizer</span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {(["glass", "dark", "light", "neon", "cyberpunk", "amoled"] as DesktopTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => changeTheme(t)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer capitalize font-sans ${
                      uiTheme === t 
                        ? `${accentBg} ${accentBorder} font-bold text-white` 
                        : "bg-white/5 border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Companion Selection */}
            <div>
              <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-2">Active Desktop Mate</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => changeCompanion("maya")}
                  className={`py-2 px-3 rounded-xl border text-xs flex items-center gap-2 transition cursor-pointer ${
                    companion === "maya"
                      ? `${accentBg} ${accentBorder} text-white font-bold`
                      : "bg-white/5 border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-[9px] text-cyan-400 font-bold">M</div>
                  <div className="text-left">
                    <span className="block font-sans font-medium">Maya AI</span>
                    <span className="text-[8px] text-gray-400 block -mt-0.5 font-mono">Sassy Hologram</span>
                  </div>
                </button>
                <button
                  onClick={() => changeCompanion("oska")}
                  className={`py-2 px-3 rounded-xl border text-xs flex items-center gap-2 transition cursor-pointer ${
                    companion === "oska"
                      ? "bg-amber-500/10 border-amber-500/30 text-white font-bold"
                      : "bg-white/5 border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[9px] text-amber-400 font-bold">O</div>
                  <div className="text-left">
                    <span className="block font-sans font-medium">Oska Mate</span>
                    <span className="text-[8px] text-gray-400 block -mt-0.5 font-mono">Smart Robot</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Language & Personality Selectors */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-2">Maya Personality</span>
                <div className="flex flex-col gap-1 text-[10px]">
                  {(["fiesty", "sarcastic", "sweetheart", "girlfriend", "normal", "romantic"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => changePersonality(p)}
                      className={`py-1.5 px-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer capitalize ${
                        personality === p 
                          ? `${accentBg} ${accentBorder} font-bold text-white` 
                          : "bg-white/5 border-transparent opacity-75 hover:opacity-100"
                      }`}
                    >
                      <span>{p}</span>
                      {personality === p && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase block mb-2">Vocal Dialect</span>
                <div className="flex flex-col gap-1 text-[10px]">
                  {[
                    { id: "en", label: "English" },
                    { id: "hi", label: "Hindi (हिन्दी)" },
                    { id: "bn", label: "Bengali (বাংলা)" },
                    { id: "or", label: "Odia (ଓଡ଼ିଆ)" }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => changeLanguage(l.id as any)}
                      className={`py-1.5 px-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                        selectedLanguage === l.id 
                          ? `${accentBg} ${accentBorder} font-bold text-white` 
                          : "bg-white/5 border-transparent opacity-75 hover:opacity-100"
                      }`}
                    >
                      <span>{l.label}</span>
                      {selectedLanguage === l.id && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Notification Log */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono opacity-50 tracking-widest font-bold uppercase">Notification Feed</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[9px] font-mono text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> CLEAR
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-2 rounded-xl text-xs flex flex-col border transition cursor-pointer ${
                        n.read 
                          ? "bg-white/[0.01] border-transparent opacity-60" 
                          : "bg-white/[0.04] border-white/5"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-semibold text-[11px]">{n.title}</span>
                        <span className="text-[9px] font-mono text-gray-500">{n.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center opacity-50 text-[10px] flex flex-col items-center gap-1">
                    <MessageSquareOff className="w-5 h-5 text-gray-500" />
                    <span>No unread telemetry logs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
