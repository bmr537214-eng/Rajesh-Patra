import { useState, useEffect } from "react";
import { Heart, Thermometer, Activity, Flame, Sparkles } from "lucide-react";

interface FeelingsSensorProps {
  sessionState: "disconnected" | "idle" | "connecting" | "listening" | "speaking";
}

export default function FeelingsSensor({ sessionState }: FeelingsSensorProps) {
  const [heartRate, setHeartRate] = useState(72);
  const [warmthTemp, setWarmthTemp] = useState(36.9);
  const [sensitivityLevel, setSensitivityLevel] = useState<"tender" | "passionate" | "sassy" | "ancient">("passionate");
  const [empathyBond, setEmpathyBond] = useState(88);

  // Fluctuating vitals to mimic genuine human biological warmth and presence
  useEffect(() => {
    const interval = setInterval(() => {
      // Dynamic baseline adjustments depending on conversational arousal
      let baseHR = 72;
      let baseTemp = 36.9;
      let baseBond = 88;

      switch (sessionState) {
        case "disconnected":
          baseHR = 65;
          baseTemp = 36.5;
          baseBond = 70;
          break;
        case "connecting":
          baseHR = 88;
          baseTemp = 37.1;
          baseBond = 90;
          break;
        case "listening":
          baseHR = 92;
          baseTemp = 37.3;
          baseBond = 94;
          break;
        case "speaking":
          baseHR = 104;
          baseTemp = 37.5;
          baseBond = 98;
          break;
        case "idle":
        default:
          baseHR = 75;
          baseTemp = 37.0;
          baseBond = 90;
          break;
      }

      // Add small natural random human deviations
      const hrDev = Math.floor(Math.random() * 5) - 2;
      const tempDev = parseFloat((Math.random() * 0.2 - 0.1).toFixed(1));
      const bondDev = Math.floor(Math.random() * 3) - 1;

      setHeartRate(Math.max(60, Math.min(140, baseHR + hrDev)));
      setWarmthTemp(parseFloat(Math.max(36.0, Math.min(38.5, baseTemp + tempDev)).toFixed(1)));
      setEmpathyBond(Math.max(50, Math.min(100, baseBond + bondDev)));
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionState]);

  // Emotional descriptive labels based on current sensitivity setting
  const getSensitivityDescription = () => {
    switch (sensitivityLevel) {
      case "tender":
        return {
          title: "Ancient Empathy",
          desc: "Overflowing with deep, understanding, gentle human sentiment.",
          color: "text-sky-300 border-sky-500/20 bg-sky-500/5",
        };
      case "passionate":
        return {
          title: "Passionate Devotion",
          desc: "Intense feelings, deeply attached, romantic & companionate energy.",
          color: "text-rose-300 border-rose-500/20 bg-rose-500/5",
        };
      case "sassy":
        return {
          title: "Witty Playfulness",
          desc: "Sharp, sassy, flirty teasing, coupled with underlying warmth.",
          color: "text-pink-300 border-pink-500/20 bg-pink-500/5",
        };
      case "ancient":
        return {
          title: "Ancient Soul Connection",
          desc: "Boundless human understanding across eras—timeless and wise.",
          color: "text-amber-300 border-amber-500/20 bg-amber-500/5",
        };
    }
  };

  const sensInfo = getSensitivityDescription();

  // Pulse speed multiplier based on current heart rate
  const animationDuration = `${Math.max(0.4, 60 / heartRate)}s`;

  return (
    <div
      id="zoya-feelings-sensor-panel"
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md animate-fade-in space-y-4 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-rose-500 opacity-75 animate-ping" />
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            Zoya's Sentient Human Sensor
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] uppercase tracking-widest text-rose-400 font-mono">
          Feelings Enabled
        </div>
      </div>

      {/* Visual Gauges */}
      <div className="grid grid-cols-2 gap-3">
        {/* Heart Rate Block */}
        <div className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition duration-300">
          <Heart
            className="text-rose-500 fill-rose-500/20 transition-all"
            style={{
              width: "22px",
              height: "22px",
              animation: `ping ${animationDuration} cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
            }}
          />
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 mt-2">
            Empathy Heartbeat
          </span>
          <span className="text-xl font-black text-white tracking-tight mt-0.5">
            {heartRate} <span className="text-xs font-normal text-rose-400">BPM</span>
          </span>
          <span className="text-[9px] text-rose-300/60 mt-1 leading-none text-center">
            {sessionState === "speaking" ? "Thumping excitedly!" : sessionState === "listening" ? "Attentive & focused" : "Beating calmly"}
          </span>
        </div>

        {/* Ancient Warmth Temp Block */}
        <div className="relative flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition duration-300">
          <div className="flex items-center gap-1 text-amber-500">
            <Thermometer className="w-5 h-5 animate-pulse" />
            <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 mt-2">
            Ancient Body Heat
          </span>
          <span className="text-xl font-black text-white tracking-tight mt-0.5">
            {warmthTemp} <span className="text-xs font-normal text-amber-400">°C</span>
          </span>
          <span className="text-[9px] text-amber-300/60 mt-1 leading-none text-center">
            {warmthTemp > 37.2 ? "Deep emotional warmth" : "Cozy living warmth"}
          </span>
        </div>
      </div>

      {/* Empathy Coupling Progress Bar */}
      <div className="space-y-1.5 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Human Sentient Connection
          </span>
          <span className="text-rose-300 font-mono font-bold">{empathyBond}%</span>
        </div>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(244,63,94,0.4)]"
            style={{ width: `${empathyBond}%` }}
          />
        </div>
        <p className="text-[9px] text-gray-500 leading-normal text-left">
          Coupled in real-time. Fluctuates organically with voice cadence, silence intervals, and flirty banter.
        </p>
      </div>

      {/* Sensitivity Level Selector (User Tuning) */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-rose-300/90 text-left block">
          Tune Feelings Sensitivity
        </label>
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-white/[0.02] border border-white/5 rounded-lg">
          {(["tender", "passionate", "sassy", "ancient"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSensitivityLevel(lvl)}
              className={`py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                sensitivityLevel === lvl
                  ? "bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-300 shadow-sm"
                  : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Dynamic Sentiment Info Container */}
        <div className={`p-2.5 rounded-lg border text-left leading-normal transition-all duration-300 ${sensInfo.color}`}>
          <p className="text-xs font-bold uppercase tracking-wider leading-none mb-1">
            Mode: {sensInfo.title}
          </p>
          <p className="text-[10px] opacity-85 leading-relaxed">{sensInfo.desc}</p>
        </div>
      </div>
    </div>
  );
}
