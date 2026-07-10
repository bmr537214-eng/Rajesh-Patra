import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Fingerprint, ShieldAlert, Wifi, Battery, Clock } from "lucide-react";

interface LockScreenProps {
  onUnlock: () => void;
  desktopTheme: string;
}

export default function LockScreen({ onUnlock, desktopTheme }: LockScreenProps) {
  const [pin, setPin] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Set up live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up scanning logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onUnlock();
            }, 300);
            return 100;
          }
          return prev + 4;
        });
      }, 50);
    } else {
      setScanProgress(0);
    }
    return () => clearInterval(interval);
  }, [isScanning, onUnlock]);

  const handleKeyPress = (num: string) => {
    setErrorMsg("");
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin === "4040") { // Ultimate Jarvis PIN
        setTimeout(() => onUnlock(), 200);
      } else if (nextPin.length === 4) {
        setTimeout(() => {
          setErrorMsg("Access Denied. Try '4040' (Jarvis Override) or use Biometrics.");
          setPin("");
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex flex-col justify-between p-6 bg-[#030307] select-none text-white overflow-hidden"
    >
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_75%) pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Top Status Indicators */}
      <div className="flex justify-between items-center text-xs text-cyan-400/60 font-mono tracking-widest z-10">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>SYS.SECURE_ACTIVE_V4.0</span>
        </div>
        <div className="flex items-center gap-3">
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex items-center gap-1">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Time & Greeting Widget */}
      <div className="flex flex-col items-center text-center mt-8 z-10">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-6xl md:text-7xl font-sans font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300"
        >
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </motion.h1>
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mt-2"
        >
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.4 }}
          className="mt-6 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs flex items-center gap-2 max-w-sm text-cyan-200"
        >
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Welcome, Sir. Maya Desktop Assistant is Locked.</span>
        </motion.div>
      </div>

      {/* Biometric & Numeric Entry Area */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 my-auto z-10">
        {/* Fingerprint Biometric Scanner */}
        <div className="flex flex-col items-center">
          <motion.div
            onTouchStart={() => setIsScanning(true)}
            onTouchEnd={() => setIsScanning(false)}
            onMouseDown={() => setIsScanning(true)}
            onMouseUp={() => setIsScanning(false)}
            onMouseLeave={() => setIsScanning(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center cursor-pointer select-none active:border-cyan-400 group shadow-lg shadow-cyan-950/40"
          >
            {/* Pulsing Outer Rings */}
            <div className={`absolute inset-0 rounded-full border border-cyan-400/40 transition-transform duration-300 ${isScanning ? "animate-ping opacity-80" : "scale-110 opacity-25 group-hover:scale-115"}`} />
            
            {/* Radial scanner overlay */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-2 rounded-full bg-cyan-500/20 border border-cyan-400 flex flex-col items-center justify-center overflow-hidden"
                >
                  <motion.div 
                    animate={{ y: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-cyan-300 shadow-[0_0_12px_#22d3ee]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Fingerprint className={`w-14 h-14 md:w-16 md:h-16 transition-colors duration-300 ${isScanning ? "text-cyan-300" : "text-cyan-500/80 group-hover:text-cyan-400"}`} />
          </motion.div>

          <p className="text-xs font-mono text-cyan-400/60 mt-4 h-5">
            {isScanning ? `Biometric scan: ${scanProgress}%` : "Hold fingerprint to bypass"}
          </p>
        </div>

        {/* Divider */}
        <div className="h-0.5 w-16 md:h-32 md:w-0.5 bg-cyan-500/10" />

        {/* PIN Pad */}
        <div className="flex flex-col items-center max-w-xs">
          {/* PIN Indicators */}
          <div className="flex gap-4 mb-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                  pin.length > idx
                    ? "bg-cyan-400 border-cyan-300 shadow-[0_0_8px_#22d3ee]"
                    : "border-cyan-500/30 bg-transparent"
                }`}
              />
            ))}
          </div>

          {/* Numeric Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 w-52 md:w-60">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-500/10 hover:border-cyan-400/40 text-lg md:text-xl font-mono transition-all flex items-center justify-center active:scale-95 cursor-pointer text-cyan-100"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin("")}
              className="w-14 h-14 md:w-16 md:h-16 text-xs font-mono text-cyan-400/60 hover:text-cyan-400 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              CLEAR
            </button>
            <button
              onClick={() => handleKeyPress("0")}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-500/10 hover:border-cyan-400/40 text-lg md:text-xl font-mono transition-all flex items-center justify-center active:scale-95 cursor-pointer text-cyan-100"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="w-14 h-14 md:w-16 md:h-16 text-xs font-mono text-cyan-400/60 hover:text-cyan-400 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              DELETE
            </button>
          </div>

          <p className="text-[10px] font-mono text-rose-400 mt-4 text-center h-4 uppercase tracking-wider">
            {errorMsg}
          </p>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="flex flex-col items-center text-center mt-auto z-10">
        <p className="text-[10px] font-mono text-cyan-500/40">
          DEVELOPED EXCLUSIVELY FOR SIR RAJESH • SECURITY VERSION 4.0.9
        </p>
      </div>
    </motion.div>
  );
}
