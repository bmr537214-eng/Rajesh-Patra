import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Minus, Square, Shrink } from "lucide-react";
import { DesktopTheme } from "../types";

interface AppWindowProps {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  theme: DesktopTheme;
  initialX?: number;
  initialY?: number;
  width?: string;
  height?: string;
  key?: any;
}

export default function AppWindow({
  id,
  title,
  onClose,
  children,
  theme,
  initialX = 100,
  initialY = 100,
  width = "w-[500px]",
  height = "h-[400px]"
}: AppWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  // Styling selectors based on theme
  const getWindowStyles = () => {
    if (isMaximized) {
      return "fixed inset-x-0 top-0 bottom-14 z-30 rounded-none border-b";
    }

    switch (theme) {
      case "neon":
        return `absolute z-30 rounded-2xl border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-cyan-100 ${width} ${height}`;
      case "cyberpunk":
        return `absolute z-30 rounded-2xl border border-yellow-500/40 shadow-[0_0_25px_rgba(234,179,8,0.2)] text-yellow-100 ${width} ${height}`;
      case "amoled":
        return `absolute z-30 rounded-2xl border border-zinc-850 bg-black text-zinc-100 ${width} ${height}`;
      case "light":
        return `absolute z-30 rounded-2xl border border-white/60 bg-white/90 text-gray-800 backdrop-blur-xl shadow-2xl ${width} ${height}`;
      case "dark":
        return `absolute z-30 rounded-2xl border border-zinc-800/85 bg-zinc-950/95 text-zinc-100 shadow-2xl ${width} ${height}`;
      case "glass":
      default:
        return `absolute z-30 rounded-2xl border border-white/10 bg-white/[0.03] text-white backdrop-blur-2xl shadow-2xl ${width} ${height}`;
    }
  };

  const getHeaderStyles = () => {
    switch (theme) {
      case "light":
        return "bg-gray-100 border-b border-gray-200";
      case "dark":
        return "bg-zinc-900 border-b border-zinc-800";
      case "amoled":
        return "bg-black border-b border-zinc-900";
      default:
        return "bg-white/[0.02] border-b border-white/5";
    }
  };

  const accentColor = theme === "neon" ? "text-cyan-400" : theme === "cyberpunk" ? "text-yellow-400" : theme === "light" ? "text-rose-500" : "text-rose-400";

  return (
    <motion.div
      drag={!isMaximized}
      dragMomentum={false}
      dragHandleClassName="window-drag-bar"
      initial={isMaximized ? { x: 0, y: 0 } : { x: initialX, y: initialY, scale: 0.9, opacity: 0 }}
      animate={isMaximized ? { x: 0, y: 0, scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={`flex flex-col overflow-hidden select-none pointer-events-auto ${getWindowStyles()}`}
    >
      {/* Draggable Title Bar */}
      <div className={`window-drag-bar px-4 py-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing ${getHeaderStyles()}`}>
        <div className="flex items-center gap-2">
          {/* Futuristic bullet */}
          <span className={`w-2 h-2 rounded-full ${theme === "neon" ? "bg-cyan-400" : theme === "cyberpunk" ? "bg-yellow-400" : "bg-rose-500"}`} />
          <span className="text-[11px] font-mono tracking-widest font-bold uppercase">{title}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? <Shrink className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition cursor-pointer"
            title="Close Program"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Window Client Area */}
      <div className="flex-1 overflow-auto p-4 min-h-0 bg-transparent">
        {children}
      </div>
    </motion.div>
  );
}
