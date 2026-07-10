import React, { useRef } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
// @ts-ignore
import zoyaLogo from "../assets/images/anime_avatar_1783627825945.jpg";
// @ts-ignore
import oskaLogo from "../assets/images/oska_avatar_1783592172521.jpg";

interface MayaAvatarProps {
  sessionState: "disconnected" | "connecting" | "idle" | "speaking";
  onClick: () => void;
  volume: number; // Volume value (0 to 100) for real-time mouth or pulse scaling!
  avatarQuote?: string;
  uiTheme: string;
  companion?: "maya" | "oska";
}

export default function MayaAvatar({
  sessionState,
  onClick,
  volume,
  avatarQuote,
  uiTheme,
  companion = "maya"
}: MayaAvatarProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Determine ambient colors based on session state, theme, and companion identity
  const getAvatarGlow = () => {
    if (companion === "oska") {
      switch (sessionState) {
        case "speaking":
          return "border-amber-500 bg-amber-950/30 shadow-[0_0_25px_rgba(245,158,11,0.7)]";
        case "connecting":
          return "border-purple-500 bg-purple-950/30 shadow-[0_0_25px_rgba(168,85,247,0.6)]";
        case "idle":
          return "border-orange-400 bg-orange-950/30 shadow-[0_0_25px_rgba(249,115,22,0.6)]";
        case "disconnected":
        default:
          return "border-amber-600/40 bg-amber-950/10 shadow-[0_0_15px_rgba(217,119,6,0.3)]";
      }
    }
    switch (sessionState) {
      case "speaking":
        return "border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.6)]";
      case "connecting":
        return "border-amber-400 bg-amber-950/30 shadow-[0_0_25px_rgba(245,158,11,0.5)]";
      case "idle":
        return "border-emerald-400 bg-emerald-950/30 shadow-[0_0_25px_rgba(16,185,129,0.5)]";
      case "disconnected":
      default:
        return "border-rose-500/40 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
    }
  };

  // Speaks/breathes animation scaling
  const dynamicScale = sessionState === "speaking" ? 1 + (volume / 250) : 1;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" ref={constraintsRef}>
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        whileDrag={{ scale: 1.08 }}
        className="absolute top-1/3 left-1/3 pointer-events-auto flex flex-col items-center select-none cursor-grab active:cursor-grabbing"
      >
        {/* Holographic glowing base ring */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing neon waves in background */}
          <AnimatePresence>
            {(sessionState === "speaking" || sessionState === "connecting") && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                className={`absolute w-32 h-32 rounded-full border ${
                  companion === "oska"
                    ? sessionState === "speaking" ? "border-amber-500/40" : "border-purple-500/40"
                    : sessionState === "speaking" ? "border-cyan-400/40" : "border-amber-400/40"
                } pointer-events-none`}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sessionState === "speaking" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut", delay: 0.6 }}
                className={`absolute w-32 h-32 rounded-full border ${
                  companion === "oska" ? "border-amber-500/20" : "border-cyan-400/20"
                } pointer-events-none`}
              />
            )}
          </AnimatePresence>

          {/* Central Avatar Frame */}
          <motion.div
            style={{ scale: dynamicScale }}
            transition={{ type: "spring", damping: 12 }}
            onClick={onClick}
            className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-2 overflow-hidden flex items-center justify-center relative transition-all duration-300 ${getAvatarGlow()}`}
          >
            {companion === "maya" ? (
              /* Live Video Avatar for Zoya */
              <video
                key={sessionState === "speaking" ? "speaking" : "idle"}
                src={sessionState === "speaking" ? "/gemini_generated_video_8a1e8ee0.mp4" : "/gemini_generated_video_37fe12f5.mp4"}
                autoPlay
                loop
                muted
                playsInline
                className={`w-full h-full object-cover transition duration-500 ${
                  sessionState === "disconnected" ? "grayscale opacity-70 contrast-125" : "grayscale-0 opacity-100 contrast-100"
                }`}
              />
            ) : (
              /* Standard Image Avatar for Oska */
              <img
                src={oskaLogo}
                alt="Oska AI Avatar"
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition duration-500 ${
                  sessionState === "disconnected" ? "grayscale contrast-125 opacity-70" : "grayscale-0 contrast-100 opacity-95"
                }`}
              />
            )}

            {/* Glowing Scanlines overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${
              companion === "oska" ? "via-amber-500/[0.05]" : "via-cyan-500/[0.05]"
            } to-transparent bg-[size:100%_6px] animate-pulse pointer-events-none`} />

            {/* Sound-reactive glowing digital mouth overlay - live reaction */}
            {sessionState === "speaking" && companion === "maya" && (
              <div className="absolute inset-x-0 bottom-3.5 flex justify-center items-center pointer-events-none z-10">
                <div className="flex items-end gap-[1.5px] h-3.5 bg-black/60 backdrop-blur-[2px] px-2 py-0.5 rounded-full border border-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  {[...Array(5)].map((_, i) => {
                    const baseHeight = 2;
                    const randomFactor = Math.sin((Date.now() / 80) + i) * 3;
                    const activeHeight = Math.max(2, baseHeight + (volume * 0.15) + randomFactor);
                    return (
                      <div
                        key={i}
                        className="w-[2px] rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] transition-all duration-75"
                        style={{ height: `${Math.min(10, activeHeight)}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Speaking mic indicator */}
            {sessionState === "speaking" && (
              <div className={`absolute bottom-2 right-2 p-1.5 rounded-full z-10 ${
                companion === "oska" ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
              }`}>
                <Volume2 className="w-3.5 h-3.5 text-black animate-bounce" />
              </div>
            )}

            {/* Listening indicator */}
            {sessionState === "idle" && (
              <div className={`absolute bottom-2 right-2 p-1.5 rounded-full z-10 ${
                companion === "oska" ? "bg-orange-400 shadow-[0_0_8px_#fb923c]" : "bg-emerald-400 shadow-[0_0_8px_#10b981]"
              }`}>
                <Mic className="w-3.5 h-3.5 text-black animate-pulse" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Floating status label or dialogue snippet */}
        <div className="mt-3 flex flex-col items-center">
          <div className={`px-2.5 py-1 rounded-full bg-black/80 border border-white/10 text-[9px] uppercase font-mono font-bold tracking-widest flex items-center gap-1.5 ${
            companion === "oska" ? (
              sessionState === "speaking" ? "text-amber-400 border-amber-500/20" :
              sessionState === "idle" ? "text-orange-400 border-orange-500/20" :
              sessionState === "connecting" ? "text-purple-400 border-purple-500/20" : "text-amber-500/50 border-amber-500/10"
            ) : (
              sessionState === "speaking" ? "text-cyan-400 border-cyan-500/20" :
              sessionState === "idle" ? "text-emerald-400 border-emerald-500/20" :
              sessionState === "connecting" ? "text-amber-400 border-amber-500/20" : "text-rose-400 border-rose-500/20"
            )
          }`}>
            <Sparkles className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>
              {sessionState === "speaking" ? "Speaking" :
               sessionState === "idle" ? "Listening" :
               sessionState === "connecting" ? "Routing" : "Offline"}
            </span>
          </div>

          {/* Quick dialogue bubble if assistant spoke recently */}
          {avatarQuote && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2.5 max-w-[180px] bg-black/90 border border-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] leading-relaxed text-center text-gray-200 shadow-md"
            >
              "{avatarQuote}"
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Simple AnimatePresence import helper
import { AnimatePresence } from "motion/react";
