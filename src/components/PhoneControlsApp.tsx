import React, { useRef, useState, useEffect } from "react";
import { 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  Lightbulb, 
  Sun, 
  Volume2, 
  Volume1,
  Camera, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Search, 
  Battery, 
  Cpu, 
  CameraOff, 
  Compass,
  Radio
} from "lucide-react";
import { PhoneState } from "../types";

interface PhoneControlsAppProps {
  phoneState: PhoneState;
  setPhoneState: React.Dispatch<React.SetStateAction<PhoneState>>;
  addNotification: (title: string, message: string, type: "info" | "success" | "warning") => void;
  accentText: string;
}

export default function PhoneControlsApp({
  phoneState,
  setPhoneState,
  addNotification,
  accentText
}: PhoneControlsAppProps) {
  const [activeTab, setActiveTab] = useState<"toggles" | "camera" | "media">("toggles");
  
  // Camera feed states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  // Media player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [trackProgress, setTrackProgress] = useState(30); // %

  const tracks = [
    { title: "Antigravity Beats", artist: "Maya AI Synth", length: "02:40" },
    { title: "Rajesh Coffee Lounge", artist: "Assam Tea Beats", length: "03:15" },
    { title: "Code Matrix", artist: "DeepMind Audio", length: "04:02" }
  ];

  // Brightness overlay side-effect
  useEffect(() => {
    // Create or find brightness overlay element
    let overlay = document.getElementById("system-brightness-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "system-brightness-overlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "9999";
      overlay.style.transition = "background-color 0.3s ease";
      document.body.appendChild(overlay);
    }
    // Set overlay opacity depending on brightness (lower brightness = darker black overlay)
    const darkness = 1 - (phoneState.brightness / 100);
    overlay.style.backgroundColor = `rgba(0, 0, 0, ${darkness * 0.65})`;
  }, [phoneState.brightness]);

  // Handle Camera initialization
  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhoneState(prev => ({ ...prev, cameraActive: true }));
      addNotification("Camera Activated", "Hardware optical lens opened successfully.", "info");
    } catch (err) {
      console.error(err);
      setCameraError("Failed to access camera. Check browser sandbox permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setPhoneState(prev => ({ ...prev, cameraActive: false }));
  };

  // Auto clean camera stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleTrackSkip = (dir: "next" | "prev") => {
    if (dir === "next") {
      setCurrentTrackIdx((currentTrackIdx + 1) % tracks.length);
    } else {
      setCurrentTrackIdx((currentTrackIdx - 1 + tracks.length) % tracks.length);
    }
    setTrackProgress(0);
  };

  // simulated progress ticker for media
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-full text-xs font-sans">
      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-white/5 pb-2 mb-3">
        {[
          { id: "toggles", label: "Control Center", icon: Radio },
          { id: "camera", label: "Live Camera View", icon: Camera },
          { id: "media", label: "Ambient Audio Player", icon: Compass }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id !== "camera") stopCamera();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-white/5 border-white/10 text-white font-bold"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4 text-cyan-400" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Control Center Tab */}
      {activeTab === "toggles" && (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Quick Hardware Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-gray-500 block uppercase font-mono">Simulated CPU</span>
                <span className="text-base font-light font-sans text-cyan-300">22% LOAD</span>
              </div>
              <Cpu className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <div className="p-3 bg-white/[0.01] rounded-xl border border-white/5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-gray-500 block uppercase font-mono">Power status</span>
                <span className="text-base font-light font-sans text-emerald-300">BATTERY OK</span>
              </div>
              <Battery className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Core Hardware toggles */}
          <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-3">
            <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider font-bold block mb-1">Interactive System Toggles</span>
            
            <div className="flex justify-between items-center py-1">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>Wi-Fi Network Interface</span>
              </div>
              <button
                onClick={() => setPhoneState(p => ({ ...p, wifiOn: !p.wifiOn }))}
                className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${phoneState.wifiOn ? "bg-cyan-500" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 bg-black rounded-full transition-all ${phoneState.wifiOn ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="flex justify-between items-center py-1">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-blue-400" />
                <span>Bluetooth Discovery Mode</span>
              </div>
              <button
                onClick={() => setPhoneState(p => ({ ...p, bluetoothOn: !p.bluetoothOn }))}
                className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${phoneState.bluetoothOn ? "bg-cyan-500" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 bg-black rounded-full transition-all ${phoneState.bluetoothOn ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="flex justify-between items-center py-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span>Camera Flashlight Bulb</span>
              </div>
              <button
                onClick={() => setPhoneState(p => ({ ...p, flashlightOn: !p.flashlightOn }))}
                className={`w-12 h-6 rounded-full p-1 transition cursor-pointer ${phoneState.flashlightOn ? "bg-cyan-500" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 bg-black rounded-full transition-all ${phoneState.flashlightOn ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          {/* Multi-sliders */}
          <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-3.5">
            <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider font-bold block mb-1">Sliders Console</span>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> Adjust System Brightness</span>
                <span className="font-mono">{phoneState.brightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={phoneState.brightness}
                onChange={(e) => setPhoneState(p => ({ ...p, brightness: parseInt(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Media Output Volume</span>
                <span className="font-mono">{phoneState.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={phoneState.volume}
                onChange={(e) => setPhoneState(p => ({ ...p, volume: parseInt(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="flex items-center gap-1.5"><Volume1 className="w-3.5 h-3.5 text-cyan-400" /> System Audio Output Volume</span>
                <span className="font-mono">{phoneState.systemVolume ?? 60}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={phoneState.systemVolume ?? 60}
                onChange={(e) => setPhoneState(p => ({ ...p, systemVolume: parseInt(e.target.value) }))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optical Camera Tab */}
      {activeTab === "camera" && (
        <div className="flex-1 flex flex-col min-h-0 bg-black/60 rounded-xl border border-white/5 p-2 overflow-hidden relative">
          {phoneState.cameraActive ? (
            <div className="flex-1 flex flex-col min-h-0 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full flex-1 object-cover rounded-lg bg-zinc-950 transform -scale-x-100"
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-[9px] font-mono border border-cyan-500/20 text-cyan-400 uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>Viewfinder v4.0.5</span>
              </div>
              <button
                onClick={stopCamera}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-rose-500 text-black font-bold uppercase hover:bg-rose-400 rounded-lg text-[10px] transition cursor-pointer"
              >
                Close Optical Feed
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <CameraOff className="w-12 h-12 text-gray-600 mb-3" />
              <h4 className="font-bold text-white text-xs">Simulated Device Lens</h4>
              <p className="text-[10px] text-gray-500 max-w-xs mt-1 leading-normal mb-4">
                Launch your system web camera directly inside the glassmorphic desktop overlay safely.
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase rounded-lg text-[10px] transition cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                Launch Device Camera
              </button>
              {cameraError && <p className="text-[9.5px] text-rose-400 font-mono mt-3">{cameraError}</p>}
            </div>
          )}
        </div>
      )}

      {/* Ambient Audio player */}
      {activeTab === "media" && (
        <div className="flex-1 flex flex-col justify-between bg-zinc-950/40 p-4 rounded-xl border border-white/5">
          <div className="flex flex-col items-center text-center my-auto">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 mb-3 shadow-lg ${isPlaying ? "animate-pulse" : ""}`}>
              <Radio className={`w-10 h-10 text-cyan-400 ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: '10s' }} />
            </div>
            
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Track {currentTrackIdx + 1} of {tracks.length}</span>
            <h4 className="font-bold text-sm mt-1">{tracks[currentTrackIdx].title}</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">{tracks[currentTrackIdx].artist}</p>
          </div>

          <div className="space-y-3.5">
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-cyan-400" style={{ width: `${trackProgress}%` }} />
              </div>
              <div className="flex justify-between font-mono text-[8px] text-gray-500">
                <span>0:{(Math.round((trackProgress / 100) * 3)).toString()}</span>
                <span>{tracks[currentTrackIdx].length}</span>
              </div>
            </div>

            {/* Media buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleTrackSkip("prev")}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-full bg-white hover:bg-cyan-100 text-black flex items-center justify-center cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause className="w-4.5 h-4.5 font-bold" /> : <Play className="w-4.5 h-4.5 font-bold fill-black ml-0.5" />}
              </button>
              <button
                onClick={() => handleTrackSkip("next")}
                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
