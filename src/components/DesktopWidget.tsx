import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CloudRain, Sun, Cloud, Thermometer, Calendar as CalIcon, MapPin, ListTodo, Battery, BatteryCharging, Zap } from "lucide-react";
import { DesktopTheme } from "../types";

interface DesktopWidgetProps {
  theme: DesktopTheme;
  location: { latitude: number; longitude: number } | null;
  tasksCount: number;
}

export default function DesktopWidgets({ theme, location, tasksCount }: DesktopWidgetProps) {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: 28,
    condition: "Scattered Clouds",
    city: "Kolkata, IN",
    humidity: 72,
    icon: "cloud"
  });
  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
    supported: boolean;
  }>({
    level: 0.85,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      let batteryManager: any = null;

      const handleChange = () => {
        if (batteryManager) {
          setBattery({
            level: batteryManager.level,
            charging: batteryManager.charging,
            supported: true,
          });
        }
      };

      (navigator as any).getBattery().then((manager: any) => {
        batteryManager = manager;
        setBattery({
          level: manager.level,
          charging: manager.charging,
          supported: true,
        });

        manager.addEventListener("chargingchange", handleChange);
        manager.addEventListener("levelchange", handleChange);
      }).catch((err: any) => {
        console.warn("Battery API access error:", err);
      });

      return () => {
        if (batteryManager) {
          batteryManager.removeEventListener("chargingchange", handleChange);
          batteryManager.removeEventListener("levelchange", handleChange);
        }
      };
    }
  }, []);

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Set up mock weather details based on current coords or default to New Delhi / Kolkata IST
  useEffect(() => {
    if (location) {
      setWeather({
        temp: 31,
        condition: "Partly Cloudy",
        city: "Mumbai, IN",
        humidity: 65,
        icon: "partly-cloudy"
      });
    }
  }, [location]);

  // Define styling classes based on selected theme
  const getThemeClasses = () => {
    switch (theme) {
      case "neon":
        return "bg-black/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-200";
      case "cyberpunk":
        return "bg-amber-950/20 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)] text-yellow-200";
      case "amoled":
        return "bg-black border-zinc-800 text-zinc-100";
      case "light":
        return "bg-white/80 border-white text-gray-800 backdrop-blur-md shadow-lg";
      case "dark":
        return "bg-zinc-950/80 border-zinc-800 text-zinc-100 shadow-2xl";
      case "glass":
      default:
        return "bg-white/[0.03] border-white/10 text-white backdrop-blur-xl shadow-lg";
    }
  };

  const accentColor = theme === "neon" ? "text-cyan-400" : theme === "cyberpunk" ? "text-yellow-400" : theme === "light" ? "text-rose-500" : "text-rose-400";

  return (
    <div className="absolute top-16 right-6 flex flex-col gap-4 pointer-events-auto z-10 w-72 max-w-full">
      {/* Clock & Date Widget */}
      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.02, zIndex: 30 }}
        className={`p-4 rounded-2xl border flex flex-col cursor-grab active:cursor-grabbing transition-shadow duration-300 ${getThemeClasses()}`}
      >
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-mono opacity-50 tracking-widest font-bold uppercase">Chronometer V4.0</span>
          <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} />
        </div>
        <div className="text-4xl font-light font-sans tracking-tight mt-1 flex items-baseline gap-1">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          <span className="text-xs font-mono opacity-60">:{time.toLocaleTimeString([], { second: '2-digit' })}</span>
        </div>
        <div className="text-xs font-medium opacity-80 font-sans mt-0.5">
          {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Weather Widget */}
      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.02, zIndex: 30 }}
        className={`p-4 rounded-2xl border flex flex-col cursor-grab active:cursor-grabbing transition-shadow duration-300 ${getThemeClasses()}`}
      >
        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className={`w-3.5 h-3.5 ${accentColor}`} />
            <span className="text-xs font-medium font-sans">{weather.city}</span>
          </div>
          <span className="text-[10px] font-mono opacity-50 uppercase tracking-wider font-semibold">IST Status</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {weather.icon === "cloud" ? (
              <Cloud className="w-10 h-10 text-cyan-400 animate-bounce" style={{ animationDuration: '4s' }} />
            ) : (
              <Sun className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
            )}
            <div>
              <span className="text-3xl font-light">{weather.temp}°C</span>
              <p className="text-[10px] opacity-75 font-sans leading-none mt-0.5">{weather.condition}</p>
            </div>
          </div>
          <div className="text-right text-[10px] font-mono opacity-60 leading-tight">
            <p>Humidity: {weather.humidity}%</p>
            <p>Wind: 14 km/h</p>
          </div>
        </div>
      </motion.div>

      {/* Schedule Summary Widget */}
      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.02, zIndex: 30 }}
        className={`p-4 rounded-2xl border flex flex-col cursor-grab active:cursor-grabbing transition-shadow duration-300 ${getThemeClasses()}`}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <ListTodo className={`w-3.5 h-3.5 ${accentColor}`} />
            <span className="text-xs font-medium font-sans">Daily Agenda</span>
          </div>
          <span className="text-[10px] font-mono opacity-50 font-bold uppercase tracking-wider">Sync Log</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="opacity-75">Pending To-Dos:</span>
            <strong className={`font-mono ${accentColor}`}>{tasksCount}</strong>
          </div>
          <div className="flex justify-between items-center text-[11px] opacity-50">
            <span>Next Task:</span>
            <span className="truncate max-w-[140px] italic">No urgent schedules</span>
          </div>
        </div>
      </motion.div>

      {/* Battery Status Widget */}
      <motion.div
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.02, zIndex: 30 }}
        className={`p-4 rounded-2xl border flex flex-col cursor-grab active:cursor-grabbing transition-shadow duration-300 ${getThemeClasses()}`}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            {battery.charging ? (
              <BatteryCharging className={`w-3.5 h-3.5 ${accentColor}`} />
            ) : (
              <Battery className={`w-3.5 h-3.5 ${accentColor}`} />
            )}
            <span className="text-xs font-medium font-sans">Power Core</span>
          </div>
          <span className="text-[10px] font-mono opacity-50 font-bold uppercase tracking-wider">
            {battery.supported ? "System Live" : "Virtual"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Battery Cell Graphic */}
          <div className="relative flex items-center">
            <div className="w-14 h-7 border-2 border-current opacity-80 rounded-md p-0.5 relative flex items-center">
              <div
                className={`h-full rounded-[2px] transition-all duration-500 ${
                  battery.charging
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"
                    : battery.level <= 0.20
                    ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    : battery.level <= 0.50
                    ? "bg-amber-400"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(6, Math.min(100, battery.level * 100))}%` }}
              />
              {battery.charging && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-black fill-black" />
                </div>
              )}
            </div>
            {/* Battery Cap */}
            <div className="w-1 h-2.5 bg-current opacity-80 rounded-r-sm ml-[1px]" />
          </div>

          {/* Battery Status Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light font-sans tracking-tight">
                {Math.round(battery.level * 100)}%
              </span>
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest font-semibold">CAP</span>
            </div>
            <div className="text-[10px] opacity-75 font-sans leading-none mt-1 truncate">
              {battery.charging ? (
                <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
                  Charging via AC
                </span>
              ) : battery.level <= 0.20 ? (
                <span className="text-rose-400 font-semibold">Battery critically low</span>
              ) : (
                <span className="opacity-75">Discharging / On Battery</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
