import React from "react";
import { motion } from "motion/react";
import { 
  FolderClosed, 
  FileText, 
  Smartphone, 
  Music, 
  ShieldCheck, 
  Menu, 
  Bell, 
  Search, 
  Wifi, 
  Battery, 
  Cpu, 
  Activity,
  Heart
} from "lucide-react";
import { DesktopTheme } from "../types";

interface TaskbarProps {
  theme: DesktopTheme;
  openStartMenu: () => void;
  openNotificationCenter: () => void;
  unreadNotificationsCount: number;
  openWindow: (appId: string) => void;
  activeWindows: string[];
  batteryLevel: number;
  ramUsage: number;
  wifiOn: boolean;
  avatarState: "disconnected" | "connecting" | "idle" | "speaking";
}

export default function Taskbar({
  theme,
  openStartMenu,
  openNotificationCenter,
  unreadNotificationsCount,
  openWindow,
  activeWindows,
  batteryLevel,
  ramUsage,
  wifiOn,
  avatarState
}: TaskbarProps) {
  // Styles based on theme
  const getTaskbarStyles = () => {
    switch (theme) {
      case "neon":
        return "bg-black/90 border-cyan-500/30 shadow-[0_-4px_20px_rgba(6,182,212,0.15)] text-cyan-200";
      case "cyberpunk":
        return "bg-black/90 border-yellow-500/30 shadow-[0_-4px_20px_rgba(234,179,8,0.15)] text-yellow-100";
      case "amoled":
        return "bg-black border-t border-zinc-800 text-zinc-100";
      case "light":
        return "bg-white/80 border-t border-white/40 text-gray-800 backdrop-blur-md shadow-lg";
      case "dark":
        return "bg-zinc-950/90 border-t border-zinc-800/80 text-zinc-100 shadow-2xl";
      case "glass":
      default:
        return "bg-white/[0.02] border-t border-white/10 text-white backdrop-blur-xl shadow-lg";
    }
  };

  const getAccentGlow = () => {
    switch (avatarState) {
      case "speaking":
        return "bg-cyan-500 shadow-[0_0_10px_#22d3ee]";
      case "connecting":
        return "bg-amber-500 shadow-[0_0_10px_#f59e0b]";
      case "idle":
        return "bg-emerald-500 shadow-[0_0_10px_#10b981]";
      case "disconnected":
      default:
        return "bg-rose-500 shadow-[0_0_10px_#f43f5e]";
    }
  };

  const isWindowActive = (id: string) => activeWindows.includes(id);

  return (
    <footer className={`w-full h-14 border-t px-4 flex items-center justify-between z-40 relative select-none ${getTaskbarStyles()}`}>
      {/* Left: Start Menu Toggle & Quick Search Launcher */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openStartMenu}
          className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2 transition duration-300 text-xs font-bold tracking-wider cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5 text-cyan-400" />
          <span className="hidden md:inline uppercase">START</span>
        </motion.button>
        
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search desktop apps or web..."
            onClick={openStartMenu}
            className="w-48 h-9 pl-8 pr-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 hover:bg-white/10 transition duration-300 cursor-pointer"
            readOnly
          />
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Middle: Active Dock with Favorite Apps */}
      <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl">
        {[
          { id: "explorer", name: "File Explorer", icon: FolderClosed, color: "text-amber-400" },
          { id: "notes", name: "Notes & Checklists", icon: FileText, color: "text-blue-400" },
          { id: "phone", name: "Phone Controls", icon: Smartphone, color: "text-emerald-400" },
          { id: "music", name: "Music Studio", icon: Music, color: "text-purple-400" },
          { id: "security", name: "Lock Screen", icon: ShieldCheck, color: "text-red-400" }
        ].map((app) => {
          const isActive = isWindowActive(app.id);
          return (
            <motion.button
              key={app.id}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => openWindow(app.id)}
              className={`p-2 rounded-lg relative transition duration-300 cursor-pointer ${
                isActive 
                  ? "bg-cyan-500/10 border border-cyan-500/30" 
                  : "bg-transparent border border-transparent hover:bg-white/5"
              }`}
              title={app.name}
            >
              <app.icon className={`w-5 h-5 ${app.color}`} />
              
              {/* Active Indicator bar */}
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-cyan-400 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Right: Quick Settings, Telemetry & Notification Tray */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Status Indicators */}
        <div className="flex items-center gap-2.5 hidden sm:flex border-r border-white/10 pr-4">
          <div className="flex items-center gap-1 opacity-70" title="Simulated RAM Usage">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{ramUsage}% RAM</span>
          </div>
          <div className="flex items-center gap-1 opacity-70" title="Simulated Battery">
            <Battery className={`w-4 h-4 ${batteryLevel < 20 ? "text-red-400" : "text-emerald-400"}`} />
            <span>{batteryLevel}%</span>
          </div>
          {wifiOn ? (
            <Wifi className="w-3.5 h-3.5 text-cyan-400" title="Wi-Fi connected" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-red-500 opacity-50" title="Wi-Fi disabled" />
          )}
        </div>

        {/* Live Assistant Connection Pulsar */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${getAccentGlow()}`} />
          <span className="hidden lg:inline text-[10px] text-gray-400 uppercase font-bold">MAYA_AGENT</span>
        </div>

        {/* Notification Center Trigger */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openNotificationCenter}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition duration-300 relative cursor-pointer"
          title="Notification log & system configurations"
        >
          <Bell className="w-4.5 h-4.5 text-gray-300" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#030307]">
              {unreadNotificationsCount}
            </span>
          )}
        </motion.button>
      </div>
    </footer>
  );
}
