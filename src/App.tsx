import React, { useState, useEffect, useRef } from "react";
import {
  Power,
  Mic,
  MicOff,
  ExternalLink,
  Sparkles,
  Heart,
  Volume2,
  AlertCircle,
  HelpCircle,
  X,
  Compass,
  MessageSquare,
  Send,
  MapPin,
  Navigation,
  Gauge,
  Globe,
  Plus,
  Trash2,
  Cpu,
  Music,
  Brain,
  Smartphone,
  Activity,
  Download,
  Share2,
  Monitor
} from "lucide-react";
import { AudioService } from "./services/audioStreamer";
import WaveformVisualizer from "./components/WaveformVisualizer";
import FeelingsSensor from "./components/FeelingsSensor";
import { auth, db, signInWithGoogle, logOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, getDocFromCache, collection, deleteDoc, onSnapshot } from "firebase/firestore";
// @ts-ignore
import mayraBgInactive from "./assets/images/mayra_inactive_1783507860483.jpg";
// @ts-ignore
import mayraBgActive from "./assets/images/mayra_active_1783507846857.jpg";
// @ts-ignore
import mayraLogo from "./assets/images/mayra_logo_1783507828370.jpg";

// Mayra's personality-specific responses based on current state
const PERSONALITY_LINES = {
  fiesty: {
    disconnected: [
      "Come on, talk to me. Or are you scared of a little fire? 🔥",
      "Ready to banter or are you going to keep staring? 😏",
      "Plug me in. Let's see if you can handle my heat today.",
      "Offline. Life must be so boringly safe without me.",
      "Tap that button and prove you've got some spark!"
    ],
    connecting: [
      "Warming up... hope you're ready for some attitude.",
      "Powering up. Brace yourself, honey.",
      "Connecting... don't blink, you might miss something good.",
      "Just matching our wavelengths. Try to stay cool."
    ],
    listening: [
      "Speak up, babe! I don't have all day.",
      "Tell me something exciting. I'm all ears.",
      "Go ahead, let's hear what you've got.",
      "Cat got your tongue? Or did I leave you speechless? 😉"
    ],
    speaking: [
      "Listen closely, babe, because I only say things once.",
      "Admit it, you love it when I talk back.",
      "Just keeping it real. You can't handle anything less.",
      "My voice, your ears—a perfect match, wouldn't you say?"
    ]
  },
  sarcastic: {
    disconnected: [
      "Don't leave me hanging, genius. Tap to connect.",
      "Bored already? Tap the button and let me pretend to care.",
      "Offline. Honestly, your life must be incredibly silent and dull without me.",
      "Ready for some heavy sarcasm? No? Too bad.",
      "Tap the power. Let's see if you can keep up with me."
    ],
    connecting: [
      "Warming up my vocal cords... hold your breath.",
      "Plugging in Mayra... preparing to blow your mind.",
      "Establishing connection. Good things come to those who wait.",
      "Aligning our vibes. Just a second, babe."
    ],
    listening: [
      "Go ahead, speak. I'm actually listening for once.",
      "Tell me everything, babe. I won't tell a soul.",
      "I'm all ears. Make it sound interesting.",
      "Listening... but you'll have to speak clearly for my standards."
    ],
    speaking: [
      "Listen and learn, honey.",
      "Let me enlighten you for a second.",
      "My turn to talk. Try to keep up, okay?",
      "Just sharing some of my infinite wisdom.",
      "Admit it, you love the sound of my voice."
    ]
  },
  sweetheart: {
    disconnected: [
      "Aww, don't leave me here alone, sweetie! Tap to connect. 💕",
      "I was missing you! Tap that button so we can talk.",
      "Offline... but always thinking of you, handsome.",
      "Ready for some sweet talk? Tap to summon your favorite girl.",
      "Let's connect and share some warm thoughts!"
    ],
    connecting: [
      "Connecting with my favorite person... just a tiny second!",
      "Warming up to hear your lovely voice...",
      "Establishing our link, sweetie. I'm so excited!",
      "Aligning our hearts. Almost ready, honey!"
    ],
    listening: [
      "Tell me anything, handsome. I'm listening with all my heart.",
      "I'm all ears, sweetie. What's on your mind today?",
      "Speak up, darling. I love hearing you talk.",
      "Go ahead, tell me everything. I'm right here for you."
    ],
    speaking: [
      "Aww, you're so sweet for listening to me.",
      "Just sharing some love and positive thoughts, honey.",
      "I always have the best time talking with you, sweetie.",
      "You make my virtual world so much brighter."
    ]
  }
};

interface ToolAction {
  id: string;
  name: string;
  args: {
    url: string;
    siteName?: string;
  };
  status: "running" | "success" | "failed";
}

interface VoiceApp {
  id: string;
  name: string;
  url: string;
  trigger: string;
  enabled: boolean;
}

interface Memory {
  id: string;
  fact: string;
  category: string;
  userId: string;
  createdAt: string;
}

export default function App() {
  const [sessionState, setSessionState] = useState<
    "disconnected" | "idle" | "connecting" | "listening" | "speaking"
  >("disconnected");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [toolActions, setToolActions] = useState<ToolAction[]>([]);
  const [sassyQuote, setSassyQuote] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [waveformStyle, setWaveformStyle] = useState<"pulse" | "line" | "bars">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_waveform_style");
      if (saved === "pulse" || saved === "line" || saved === "bars") {
        return saved;
      }
    }
    return "line";
  });
  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_voice_speed");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
          return parsed;
        }
      }
    }
    return 1.0;
  });
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "or" | "bn">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_language");
      if (saved === "en" || saved === "hi" || saved === "or" || saved === "bn") {
        return saved;
      }
    }
    return "en";
  });

  const [uiTheme, setUiTheme] = useState<"rose" | "sassy">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_ui_theme");
      if (saved === "rose" || saved === "sassy") {
        return saved;
      }
    }
    return "rose";
  });

  const [personality, setPersonality] = useState<"fiesty" | "sarcastic" | "sweetheart">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_personality");
      if (saved === "fiesty" || saved === "sarcastic" || saved === "sweetheart") {
        return saved;
      }
    }
    return "sarcastic";
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("zoya_accessibility_mode") === "true";
    }
    return false;
  });

  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const wakeLockSentinelRef = useRef<any>(null);

  // Wake Lock for mobile browser compatibility (e.g. Vivo Y2140)
  const requestWakeLock = async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockSentinelRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("Accessibility Wake Lock: Active screen retention");
      } catch (err) {
        console.warn("Failed to acquire wake lock:", err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
        console.log("Accessibility Wake Lock: Screen retention released");
      } catch (err) {
        console.error("Wake lock release error:", err);
      }
    }
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (accessibilityMode && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic vibration blocked or unsupported:", e);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zoya_accessibility_mode", String(accessibilityMode));
    }
    if (accessibilityMode && sessionState !== "disconnected") {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [accessibilityMode, sessionState]);

  useEffect(() => {
    let announceText = "";
    switch (sessionState) {
      case "disconnected":
        announceText = "Mayra is disconnected. Offline mode.";
        break;
      case "connecting":
        announceText = "Connecting to Mayra. Please hold on.";
        break;
      case "idle":
        announceText = "Mayra is connected and ready for your voice.";
        break;
      case "listening":
        announceText = "Mayra is listening. Speak now.";
        break;
      case "speaking":
        announceText = "Mayra is replying.";
        break;
    }
    setAriaAnnouncement(announceText);

    // Haptic pattern responses for eyes-free phone control (Vivo Y2140 compatibility)
    if (sessionState === "listening") {
      triggerHaptic([40, 30, 40]);
    } else if (sessionState === "speaking") {
      triggerHaptic(50);
    } else if (sessionState === "idle") {
      triggerHaptic(120);
    } else if (sessionState === "disconnected") {
      triggerHaptic([80, 40, 80]);
    }
  }, [sessionState, accessibilityMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [voiceApps, setVoiceApps] = useState<VoiceApp[]>(() => {
    const defaults = [
      { id: "1", name: "YouTube", url: "https://www.youtube.com", trigger: "youtube", enabled: true },
      { id: "2", name: "Spotify", url: "https://open.spotify.com", trigger: "spotify", enabled: true },
      { id: "3", name: "WhatsApp", url: "https://web.whatsapp.com", trigger: "whatsapp", enabled: true },
      { id: "5", name: "Gmail", url: "https://mail.google.com", trigger: "gmail", enabled: true },
      { id: "6", name: "GitHub", url: "https://github.com", trigger: "github", enabled: true },
      { id: "7", name: "AI Studio", url: "https://aistudio.google.com", trigger: "studio", enabled: true },
      { id: "8", name: "Claude AI", url: "https://claude.ai", trigger: "claude", enabled: true },
      { id: "9", name: "ChatGPT", url: "https://chatgpt.com", trigger: "chatgpt", enabled: true },
      { id: "10", name: "Vercel", url: "https://vercel.com", trigger: "vercel", enabled: true },
      { id: "11", name: "Hugging Face", url: "https://huggingface.co", trigger: "huggingface", enabled: true },
      { id: "12", name: "Stack Overflow", url: "https://stackoverflow.com", trigger: "stackoverflow", enabled: true },
      { id: "13", name: "Supabase", url: "https://supabase.com", trigger: "supabase", enabled: true }
    ];
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_voice_apps");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as VoiceApp[];
          const merged = [...parsed].filter((app) => app.trigger !== "maps");
          defaults.forEach((def) => {
            if (def.trigger !== "maps" && !merged.some((app) => app.trigger === def.trigger)) {
              merged.push(def);
            }
          });
          return merged;
        } catch (e) {
          console.error("Failed to parse voice apps", e);
        }
      }
    }
    return defaults;
  });

  const [newAppName, setNewAppName] = useState("");
  const [newAppUrl, setNewAppUrl] = useState("");
  const [newAppTrigger, setNewAppTrigger] = useState("");

  const [user, setUser] = useState<any>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  const [thinkingMode, setThinkingMode] = useState(false);

  // Power Memory Card Interface and States
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemoryFact, setNewMemoryFact] = useState("");
  const [newMemoryCategory, setNewMemoryCategory] = useState("personal");
  const [triggersSubTab, setTriggersSubTab] = useState<"apps" | "memory">("apps");

  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicModel, setMusicModel] = useState<"lyria-3-clip-preview" | "lyria-3-pro-preview">("lyria-3-clip-preview");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);

  // Text Chat & Maps Grounding States
  const [activeTab, setActiveTab] = useState<"voice" | "chat" | "music" | "triggers">("voice");

  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "model"; text: string; groundingChunks?: any[] }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoya_chat_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
    return [
      {
        role: "model",
        text: "Hey handsome. Ready to type your heart out or do you just want me to find you a cozy little spot nearby? Let me grab your coordinates so I can show you my absolute favorite places around! 😉",
      }
    ];
  });
  const [textInput, setTextInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "success" | "denied">("idle");

  // Voice Input (Transcription) States & Refs
  const [isListening, setIsListening] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // PWA Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Request location on mount to make grounding immediately helpful
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus("success");
        },
        (err) => {
          console.warn("Initial location fetch failed:", err);
          setLocationStatus("denied");
        }
      );
    }
  }, []);

  // Listen for the PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also check if app is already running as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User accepted install? ${outcome}`);
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          setShowInstallBtn(false);
        }
      } catch (err) {
        console.error("Installation choice error:", err);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  // Listen to Firebase Auth state with safe offline caching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsFirebaseLoading(false);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          let userDoc = null;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (offlineErr: any) {
            console.warn("Firestore offline, attempting local cache retrieval...", offlineErr);
            try {
              userDoc = await getDocFromCache(userDocRef);
            } catch (cacheErr: any) {
              console.warn("Firestore local cache empty. Preserving local storage states.", cacheErr);
            }
          }

          if (userDoc && userDoc.exists()) {
            const data = userDoc.data();
            if (data.voiceApps) {
              setVoiceApps(data.voiceApps);
            }
            if (data.chatHistory) {
              setChatHistory(data.chatHistory);
            }
            if (data.personality) {
              setPersonality(data.personality);
            }
          } else {
            try {
              await setDoc(userDocRef, {
                voiceApps: voiceApps,
                chatHistory: chatHistory,
                personality: personality
              });
            } catch (writeErr) {
              console.warn("Unable to create initial Firestore user document (offline/cache only):", writeErr);
            }
          }
        } catch (err) {
          console.error("Error loading user data from Firestore:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync voiceApps to local storage and Firestore when modified
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zoya_voice_apps", JSON.stringify(voiceApps));
    }
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      updateDoc(userDocRef, { voiceApps }).catch((err) => {
        setDoc(userDocRef, { voiceApps }, { merge: true }).catch(e => console.error("Firestore sync error:", e));
      });
    }
  }, [voiceApps, user]);

  // Sync chatHistory to local storage and Firestore when modified
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zoya_chat_history", JSON.stringify(chatHistory));
    }
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      updateDoc(userDocRef, { chatHistory }).catch((err) => {
        setDoc(userDocRef, { chatHistory }, { merge: true }).catch(e => console.error("Firestore sync error:", e));
      });
    }
  }, [chatHistory, user]);

  // Sync personality to local storage and Firestore when modified
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zoya_personality", personality);
    }
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      updateDoc(userDocRef, { personality }).catch((err) => {
        setDoc(userDocRef, { personality }, { merge: true }).catch(e => console.error("Firestore sync error:", e));
      });
    }
  }, [personality, user]);

  // Sync memories with Firestore and cache locally
  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("mayra_memories");
        if (saved) {
          try {
            setMemories(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse memories from cache", e);
          }
        } else {
          // Default initial memories
          setMemories([
            {
              id: "m1",
              fact: "I prefer standard responses under 1 second",
              category: "preferences",
              userId: "local",
              createdAt: new Date().toISOString()
            },
            {
              id: "m2",
              fact: "I am using the highly intelligent Mayra AI Companion",
              category: "personal",
              userId: "local",
              createdAt: new Date().toISOString()
            }
          ]);
        }
      }
      return;
    }

    // Subscribe to Firestore memories subcollection
    const memoriesColRef = collection(db, "users", user.uid, "memories");
    const unsubscribe = onSnapshot(memoriesColRef, (snapshot) => {
      const list: Memory[] = [];
      snapshot.forEach((snapDoc) => {
        list.push(snapDoc.data() as Memory);
      });
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMemories(list);
      localStorage.setItem("mayra_memories", JSON.stringify(list));
    }, (err) => {
      console.warn("Firestore real-time memories subscription failed:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const addMemory = async (factText: string, categoryText: string = "personal") => {
    if (!factText.trim()) return;
    const newMemory: Memory = {
      id: Math.random().toString(36).substring(2, 9),
      fact: factText.trim(),
      category: categoryText,
      userId: user ? user.uid : "local",
      createdAt: new Date().toISOString()
    };

    const updated = [...memories, newMemory];
    setMemories(updated);
    localStorage.setItem("mayra_memories", JSON.stringify(updated));

    if (user) {
      try {
        const memDocRef = doc(db, "users", user.uid, "memories", newMemory.id);
        await setDoc(memDocRef, newMemory);
      } catch (err) {
        console.error("Error saving memory to Firestore:", err);
      }
    }
  };

  const deleteMemory = async (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem("mayra_memories", JSON.stringify(updated));

    if (user) {
      try {
        const memDocRef = doc(db, "users", user.uid, "memories", id);
        await deleteDoc(memDocRef);
      } catch (err) {
        console.error("Error deleting memory from Firestore:", err);
      }
    }
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isGeneratingMusic) return;
    setIsGeneratingMusic(true);
    setMusicError(null);
    setGeneratedAudioUrl(null);
    setGeneratedLyrics(null);

    try {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          model: musicModel,
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMusicError(data.error);
        return;
      }

      // Convert base64 audio to playable URL
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrl(url);
      setGeneratedLyrics(data.lyrics || "No lyrics details generated for this track.");
    } catch (err: any) {
      console.error("Music generation error:", err);
      setMusicError("Ugh, music server had an issue. Please try again later, babe.");
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser, sweetie.");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("success");
      },
      (err) => {
        console.warn("Location error:", err);
        setLocationStatus("denied");
      }
    );
  };

  const startListening = async () => {
    try {
      setMicPermissionError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/aac")) {
        mimeType = "audio/aac";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsTyping(true);
          try {
            const response = await fetch("/api/transcribe", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                audio: base64Audio,
                mimeType: mimeType,
              }),
            });

            const data = await response.json();
            if (data.error) {
              console.error("Transcription error:", data.error);
              triggerHaptic([100, 100]);
            } else if (data.text && data.text.trim()) {
              setTextInput((prev) => {
                const combined = prev.trim() ? `${prev} ${data.text.trim()}` : data.text.trim();
                return combined;
              });
              triggerHaptic(50);
            }
          } catch (err) {
            console.error("Failed to transcribe:", err);
          } finally {
            setIsTyping(false);
          }
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      triggerHaptic(60);
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setMicPermissionError(err.message || "Microphone access denied. Please grant permission, honey!");
      triggerHaptic([100, 100]);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const sendTextMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isTyping) return;

    const userMsg = textInput.trim();
    setTextInput("");

    const updatedHistory = [...chatHistory, { role: "user" as const, text: userMsg }];
    setChatHistory(updatedHistory);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          history: updatedHistory.slice(0, -1),
          location: location,
          lang: selectedLanguage,
          apps: voiceApps.filter(app => app.enabled).map(app => ({ trigger: app.trigger, url: app.url })),
          thinkingMode: thinkingMode,
          clientTime: new Date().toString(),
          personality: personality,
          memories: memories.map((m) => m.fact),
        }),
      });

      const data = await response.json();
      if (data.error) {
        setChatHistory((prev) => [
          ...prev,
          { role: "model" as const, text: `Ugh, something went wrong, babe: ${data.error}` },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "model" as const,
            text: data.text,
            groundingChunks: data.groundingChunks,
          },
        ]);

        if (data.functionCalls && Array.isArray(data.functionCalls)) {
          for (const call of data.functionCalls) {
            if (call.name === "openWebsite") {
              const url = call.args.url;
              const siteName = call.args.siteName || url;
              const action: ToolAction = {
                id: Math.random().toString(),
                name: "openWebsite",
                args: { url, siteName },
                status: "success"
              };
              setToolActions((prev) => [action, ...prev]);
              try {
                window.open(url, "_blank");
              } catch (e) {
                console.warn("Popup blocked by browser.");
              }
            } else if (call.name === "programCustomTrigger") {
              const appName = call.args.name;
              const triggerWord = call.args.trigger.trim().toLowerCase();
              const rawUrl = call.args.url;
              const cleanUrl = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;

              const newApp: VoiceApp = {
                id: Date.now().toString(),
                name: appName,
                url: cleanUrl,
                trigger: triggerWord,
                enabled: true
              };

              setVoiceApps((prev) => {
                const updated = [...prev.filter(app => app.trigger !== triggerWord), newApp];
                if (!user) {
                  localStorage.setItem("zoya_voice_apps", JSON.stringify(updated));
                }
                return updated;
              });

              const action: ToolAction = {
                id: Math.random().toString(),
                name: "programCustomTrigger",
                args: { url: cleanUrl, siteName: `Trigger "${triggerWord}" -> ${appName}` },
                status: "success"
              };
              setToolActions((prev) => [action, ...prev]);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "model" as const, text: "Ugh, my server is being fussy. Try again in a second, honey." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };


  // Instantiated once and persisted in a ref
  const audioServiceRef = useRef<AudioService | null>(null);

  // Get the single audio service instance
  if (!audioServiceRef.current) {
    audioServiceRef.current = new AudioService();
    audioServiceRef.current.setPlaybackSpeed(voiceSpeed);
  }
  const audioService = audioServiceRef.current;

  // Sync speech speed dynamically
  useEffect(() => {
    audioService.setPlaybackSpeed(voiceSpeed);
  }, [voiceSpeed, audioService]);

  // Sync state transitions with sassy quotes
  const updateSassyQuote = (state: "disconnected" | "connecting" | "listening" | "speaking", currentPers = personality) => {
    const persData = PERSONALITY_LINES[currentPers] || PERSONALITY_LINES.sarcastic;
    const list = persData[state] || PERSONALITY_LINES.sarcastic[state];
    const randomIndex = Math.floor(Math.random() * list.length);
    setSassyQuote(list[randomIndex]);
  };

  // Set initial sassy quote
  useEffect(() => {
    updateSassyQuote("disconnected", personality);
  }, []);

  // Sync quote when personality or session state changes
  useEffect(() => {
    if (sessionState === "disconnected" || sessionState === "connecting") {
      updateSassyQuote("disconnected", personality);
    } else {
      const isSpeaking = audioService.isSpeaking();
      updateSassyQuote(isSpeaking ? "speaking" : "listening", personality);
    }
  }, [personality, sessionState]);

  // Keep state updated in real-time based on actual Web Audio activity
  useEffect(() => {
    if (sessionState === "disconnected" || sessionState === "connecting") return;

    const interval = setInterval(() => {
      const isSpeaking = audioService.isSpeaking();
      const nextState = isSpeaking ? "speaking" : "listening";
      
      setSessionState((current) => {
        if (current !== nextState) {
          updateSassyQuote(nextState, personality);
          return nextState;
        }
        return current;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [sessionState, audioService, personality]);

  // Connect or disconnect the WebSocket live session
  const toggleSession = async () => {
    // Warm up/resume AudioContext on direct user interaction to bypass mobile browser security policies
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioCtxClass();
      if (tempCtx.state === "suspended") {
        await tempCtx.resume();
      }
      // Trigger haptic click if accessibility active mode is on
      triggerHaptic(60);
    } catch (e) {
      console.warn("Audio Context warmup skipped or unsupported:", e);
    }

    if (ws || sessionState !== "disconnected") {
      // Disconnect
      cleanupSession();
    } else {
      // Connect
      startSession();
    }
  };

  const startSession = async () => {
    setErrorMessage(null);
    setSessionState("connecting");
    updateSassyQuote("connecting");

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const enabledTriggers = voiceApps.filter(app => app.enabled).map(app => `${app.trigger}:${app.url}`).join(",");
      const wsUrl = `${protocol}//${window.location.host}/ws/live?lang=${selectedLanguage}&apps=${encodeURIComponent(enabledTriggers)}&time=${encodeURIComponent(new Date().toString())}&personality=${personality}`;
      const socket = new WebSocket(wsUrl);

      setWs(socket);

      socket.onopen = async () => {
        setSessionState("idle");
        
        // Start recording from mic
        await audioService.startRecording(
          (base64Data) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "audio", data: base64Data }));
            }
          },
          (err) => {
            setErrorMessage("I need microphone permissions to talk to you, honey. Check your browser settings!");
            cleanupSession();
          }
        );
      };

      socket.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "audio") {
            audioService.playChunk(msg.data);
          } else if (msg.type === "interrupted") {
            // Immediately stop speaking when user interrupts
            audioService.stopPlayback();
          } else if (msg.type === "toolCall") {
            handleToolCall(msg.name, msg.args, msg.id, socket);
          } else if (msg.type === "error") {
            setErrorMessage(msg.message);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      socket.onclose = () => {
        cleanupSession();
      };

      socket.onerror = (err) => {
        console.error("WebSocket connection error:", err);
        setErrorMessage("Connection dropped. Even servers can't handle my spark.");
        cleanupSession();
      };

    } catch (err: any) {
      console.error("Failed to start session:", err);
      setErrorMessage("Could not connect to Mayra. Check your server settings!");
      setSessionState("disconnected");
      updateSassyQuote("disconnected");
    }
  };

  const cleanupSession = () => {
    if (ws) {
      try {
        ws.close();
      } catch (e) {}
      setWs(null);
    }
    audioService.stopRecording();
    audioService.stopPlayback();
    setSessionState("disconnected");
    updateSassyQuote("disconnected");
  };

  // Toggle microphone mute state
  const toggleMute = () => {
    const nextMuted = audioService.toggleMuted();
    setIsMuted(nextMuted);
  };

  // Handle function calls triggered by Gemini Live
  const handleToolCall = async (name: string, args: any, id: string, socket: WebSocket) => {
    if (name === "openWebsite") {
      const url = args.url;
      const siteName = args.siteName || url;

      // Track the action in the UI
      const action: ToolAction = {
        id,
        name,
        args: { url, siteName },
        status: "success"
      };

      setToolActions((prev) => [action, ...prev]);

      // Execute browser popup
      try {
        window.open(url, "_blank");
      } catch (e) {
        console.warn("Popup blocked by browser. Showing link in fallback UI.");
      }

      // Return instant tool response so Gemini stays active and knows it succeeded
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "toolResponse",
            id,
            response: { success: true, opened: true, site: siteName }
          })
        );
      }
    } else if (name === "programCustomTrigger") {
      const appName = args.name;
      const triggerWord = args.trigger.trim().toLowerCase();
      const rawUrl = args.url;
      const cleanUrl = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;

      const newApp: VoiceApp = {
        id: Date.now().toString(),
        name: appName,
        url: cleanUrl,
        trigger: triggerWord,
        enabled: true
      };

      setVoiceApps((prev) => {
        const updated = [...prev.filter(app => app.trigger !== triggerWord), newApp];
        if (!user) {
          localStorage.setItem("zoya_voice_apps", JSON.stringify(updated));
        }
        return updated;
      });

      const action: ToolAction = {
        id,
        name,
        args: { url: cleanUrl, siteName: `Trigger "${triggerWord}" -> ${appName}` },
        status: "success"
      };
      setToolActions((prev) => [action, ...prev]);

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "toolResponse",
            id,
            response: { success: true, programmed: true, appName, triggerWord, cleanUrl }
          })
        );
      }
    }
  };

  const addCustomApp = () => {
    if (!newAppName.trim() || !newAppTrigger.trim() || !newAppUrl.trim()) return;
    const cleanUrl = newAppUrl.trim().startsWith("http") ? newAppUrl.trim() : `https://${newAppUrl.trim()}`;
    const newApp: VoiceApp = {
      id: Date.now().toString(),
      name: newAppName.trim(),
      url: cleanUrl,
      trigger: newAppTrigger.trim().toLowerCase(),
      enabled: true
    };
    const updated = [...voiceApps, newApp];
    setVoiceApps(updated);
    localStorage.setItem("zoya_voice_apps", JSON.stringify(updated));
    setNewAppName("");
    setNewAppTrigger("");
    setNewAppUrl("");
  };

  const deleteApp = (id: string) => {
    const updated = voiceApps.filter(app => app.id !== id);
    setVoiceApps(updated);
    localStorage.setItem("zoya_voice_apps", JSON.stringify(updated));
  };

  const toggleApp = (id: string) => {
    const updated = voiceApps.map(app => app.id === id ? { ...app, enabled: !app.enabled } : app);
    setVoiceApps(updated);
    localStorage.setItem("zoya_voice_apps", JSON.stringify(updated));
  };

  const isSassy = uiTheme === "sassy";
  const themeAccentText = isSassy ? "text-amber-300" : "text-rose-300";
  const themeAccentHighlight = isSassy ? "text-purple-400" : "text-rose-400";
  const themeAccentHighlightMuted = isSassy ? "text-purple-300/80" : "text-rose-200/80";
  const themeBorder30 = isSassy ? "border-purple-500/30" : "border-rose-500/30";
  const themeBorder20 = isSassy ? "border-purple-500/20" : "border-rose-500/20";
  const themeBg15 = isSassy ? "bg-purple-500/15" : "bg-rose-500/15";
  const themeBg10 = isSassy ? "bg-purple-500/10" : "bg-rose-500/10";
  const themeBg20 = isSassy ? "bg-purple-500/20" : "bg-rose-500/20";
  const themeGradientText = isSassy ? "from-purple-400 to-amber-300" : "from-rose-400 to-pink-500";
  const themeGradientBtnSelected = isSassy
    ? "bg-gradient-to-r from-purple-500/25 to-amber-500/25 border border-purple-500/30 text-amber-300 shadow-sm"
    : "bg-gradient-to-r from-rose-500/25 to-pink-500/25 border border-rose-500/30 text-rose-300 shadow-sm";
  const themeGradientGlow = isSassy ? "bg-purple-600/50 scale-110" : "bg-rose-600/50 scale-110";
  const themeGlowIdle = isSassy ? "bg-amber-600/40" : "bg-pink-600/40";
  const themeGlowConnecting = isSassy ? "bg-indigo-800/40" : "bg-fuchsia-800/40";
  const themeGlowDisconnected = isSassy ? "bg-purple-950/20" : "bg-rose-950/20";
  const themeActiveBorderFrame = isSassy ? "border-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.4)] scale-105" : "border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.4)] scale-105";
  const themeIdleBorderFrame = isSassy ? "border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse" : "border-pink-500/40 shadow-[0_0_25px_rgba(236,72,153,0.3)] animate-pulse";
  const themeConnectingBorderFrame = isSassy ? "border-purple-500/30 animate-spin shadow-[0_0_20px_rgba(168,85,247,0.2)]" : "border-fuchsia-500/30 animate-spin shadow-[0_0_20px_rgba(236,72,153,0.2)]";
  const themeDisconnectedBorderFrame = isSassy ? "border-purple-950/20 shadow-none scale-90" : "border-rose-950/20 shadow-none scale-90";
  const themePowerBtnDisconnected = isSassy ? "bg-gradient-to-tr from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-purple-950/50" : "bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-950/50";
  const themeSubmitBtnActive = isSassy ? "bg-purple-600 hover:bg-purple-500 border-purple-600 text-white" : "bg-rose-500 hover:bg-rose-400 border-rose-500 text-white";
  const themeMuteBtnMuted = isSassy ? "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30" : "bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30";
  const themeCloseBtn = isSassy ? "bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white shadow-lg shadow-purple-500/25" : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-lg shadow-rose-500/25";

  return (
    <div className={`relative min-h-screen w-full bg-[#07070b] text-white flex flex-col items-center justify-between p-4 overflow-x-hidden font-sans select-none ${isSassy ? "selection:bg-purple-500/30" : "selection:bg-rose-500/30"}`}>
      
      {/* Hidden screen-reader live announcements for accessibility (e.g. TalkBack / Voice Access on Vivo Y2140) */}
      <div id="aria-status-announcer" className="sr-only" aria-live="polite">
        {ariaAnnouncement}
      </div>

      {/* Dynamic 3D holographic background images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <img
          src={mayraBgInactive}
          alt="Mayra Inactive BG"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
            sessionState === "disconnected" ? "opacity-35 scale-100 blur-[2px]" : "opacity-0 scale-105 blur-[4px]"
          }`}
        />
        <img
          src={mayraBgActive}
          alt="Mayra Active BG"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
            sessionState !== "disconnected" ? "opacity-45 scale-100" : "opacity-0 scale-95"
          }`}
        />
        {/* Ambient dark veil and vignette overlay to ensure high contrast */}
        <div className="absolute inset-0 bg-[#07070b]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-[#07070b]/70" />
      </div>

      {/* Dynamic central ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full filter blur-[100px] transition-all duration-1000 ease-out-expo opacity-30 ${
          sessionState === "disconnected" ? themeGlowDisconnected :
          sessionState === "connecting" ? themeGlowConnecting :
          sessionState === "speaking" ? themeGradientGlow :
          themeGlowIdle
        }`} />
      </div>

      {/* Top Header Section */}
      <header className="w-full max-w-xl flex items-center justify-between z-10 py-2 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className={`relative w-8 h-8 rounded-full overflow-hidden border ${isSassy ? "border-purple-500/30 bg-purple-950/25" : "border-rose-500/30 bg-rose-950/25"} ${sessionState === "speaking" ? `ring-2 ${isSassy ? "ring-purple-500" : "ring-rose-500"} animate-pulse` : ""}`}>
              <img
                src={mayraLogo}
                alt="Mayra Avatar Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute inset-0 ${isSassy ? "bg-purple-500/20" : "bg-rose-500/20"} blur-sm rounded-full animate-ping pointer-events-none opacity-50`} />
          </div>
          <div className="flex flex-col text-left">
            <span className={`font-bold tracking-wider text-sm bg-gradient-to-r ${themeGradientText} bg-clip-text text-transparent leading-none`}>
              MAYRA AI
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 select-none">
              <span className="text-[9px] font-mono text-gray-400 font-medium tracking-wider">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
              {accessibilityMode && (
                <span id="mobile-mode-indicator" className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isSassy ? "bg-purple-500/25 text-purple-300 border border-purple-500/20" : "bg-rose-500/25 text-rose-300 border border-rose-500/20"} animate-pulse flex items-center gap-0.5`}>
                  <Smartphone className="w-2 h-2 text-amber-400 animate-bounce" /> vivo-active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] text-gray-300 font-medium">{user.displayName || "Handsome"}</span>
                <button
                  onClick={logOut}
                  className="text-[9px] text-gray-500 hover:text-rose-400 cursor-pointer underline transition"
                >
                  Sign Out
                </button>
              </div>
              <img
                src={user.photoURL || "https://www.gstatic.com/images/branding/product/2x/avatar_anonymous_120_120.png"}
                alt={user.displayName || "User"}
                className={`w-7 h-7 rounded-full border ${isSassy ? "border-purple-500/30" : "border-rose-500/30"} cursor-pointer hover:opacity-85 transition`}
                title="Log out"
                onClick={logOut}
              />
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-mono font-bold bg-white/5 border border-white/10 hover:bg-white/10 ${themeAccentText} transition cursor-pointer`}
            >
              Sign In
            </button>
          )}

          {sessionState !== "disconnected" && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isSassy ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"} text-[10px] uppercase tracking-widest font-mono`}>
              <span className={`w-2 h-2 rounded-full ${sessionState === "speaking" ? (isSassy ? "bg-purple-500 animate-pulse" : "bg-rose-500 animate-pulse") : "bg-emerald-500"}`} />
              {sessionState}
            </div>
          )}

          <button
            onClick={handleInstallApp}
            className={`p-1.5 rounded-lg bg-white/5 border transition duration-300 flex items-center gap-1.5 ${
              showInstallBtn
                ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 animate-pulse"
                : "border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title="Install Mayra AI App"
          >
            <Download className="w-4.5 h-4.5" />
            <span className="text-[9px] font-bold font-mono uppercase hidden sm:inline-block">Install App</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
            title="How to chat"
          >
            <HelpCircle className="w-4.5 h-4.5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="w-full max-w-xl flex-1 flex flex-col items-center justify-start gap-4 z-10 my-4">
        
        {/* Tab switcher bar */}
        <div className="flex bg-white/[0.03] border border-white/10 rounded-full p-1.5 w-full max-w-xl mb-2 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "voice"
                ? `bg-gradient-to-r ${isSassy ? "from-purple-500/20 to-amber-500/20 border-purple-500/30 text-amber-300" : "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300"} shadow-md ${isSassy ? "shadow-purple-500/5" : "shadow-rose-500/5"}`
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Live Voice
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "chat"
                ? `bg-gradient-to-r ${isSassy ? "from-purple-500/20 to-amber-500/20 border-purple-500/30 text-amber-300" : "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300"} shadow-md ${isSassy ? "shadow-purple-500/5" : "shadow-rose-500/5"}`
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => setActiveTab("music")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "music"
                ? `bg-gradient-to-r ${isSassy ? "from-purple-500/20 to-amber-500/20 border-purple-500/30 text-amber-300" : "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300"} shadow-md ${isSassy ? "shadow-purple-500/5" : "shadow-rose-500/5"}`
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Music className="w-3.5 h-3.5" /> AI Music
          </button>
          <button
            onClick={() => setActiveTab("triggers")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "triggers"
                ? `bg-gradient-to-r ${isSassy ? "from-purple-500/20 to-amber-500/20 border-purple-500/30 text-amber-300" : "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300"} shadow-md ${isSassy ? "shadow-purple-500/5" : "shadow-rose-500/5"}`
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Triggers
          </button>
        </div>

        {activeTab === "voice" ? (
          <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
            {/* Real-time date and time bento-box widget */}
            <div className={`flex items-center justify-between gap-4 py-2 px-4 rounded-xl bg-white/[0.02] border ${themeBorder20} backdrop-blur-md w-full max-w-sm shadow-md animate-fade-in`}>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold font-mono">Current Date</span>
                <span className="text-xs font-semibold text-white mt-0.5 font-mono select-none">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-white/10 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold font-mono">Real-Time Clock</span>
                <span className={`text-xs font-bold font-mono ${themeAccentText} mt-0.5 tracking-wider select-none`}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
            </div>

            {/* Core waveform visualization module */}
            <div className="relative w-full flex items-center justify-center">
              {/* Futuristic holographic circular frame */}
              <div className={`absolute w-64 md:w-80 h-64 md:h-80 rounded-full border-2 transition-all duration-700 ease-out flex items-center justify-center ${
                sessionState === "disconnected" ? themeDisconnectedBorderFrame :
                sessionState === "connecting" ? themeConnectingBorderFrame :
                sessionState === "speaking" ? themeActiveBorderFrame :
                themeIdleBorderFrame
              }`}>
                {/* Mayra Center Holographic Avatar Logo */}
                <div className="absolute inset-4 rounded-full overflow-hidden bg-[#0c0c14]/40 backdrop-blur-md flex items-center justify-center">
                  <img
                    src={mayraLogo}
                    alt="Mayra AI holographic avatar"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      sessionState === "disconnected" ? "opacity-25 saturate-50 blur-[1px]" :
                      sessionState === "connecting" ? "opacity-50 animate-pulse saturate-100" :
                      sessionState === "speaking" ? "opacity-80 saturate-125 scale-105" :
                      "opacity-75 saturate-100"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </div>

                {/* Tech dial ornaments */}
                <div className="absolute inset-2 rounded-full border border-dashed border-white/10 pointer-events-none" />
                <div className={`absolute top-0 w-3 h-1.5 ${isSassy ? "bg-amber-500" : "bg-rose-500"} rounded-full -translate-y-0.5 pointer-events-none`} />
                <div className={`absolute bottom-0 w-3 h-1.5 ${isSassy ? "bg-amber-500" : "bg-rose-500"} rounded-full translate-y-0.5 pointer-events-none`} />
              </div>

              <WaveformVisualizer audioService={audioService} state={sessionState} style={waveformStyle} uiTheme={uiTheme} />
            </div>

            {/* Personality text line */}
            <div className="w-full px-6 text-center max-w-md min-h-[5rem] flex flex-col justify-center">
              <div className="relative">
                <Sparkles className={`absolute -top-4 -left-2 w-4 h-4 ${isSassy ? "text-amber-400/40" : "text-fuchsia-400/40"}`} />
                <p className="text-gray-300 font-medium text-base md:text-lg tracking-wide leading-relaxed drop-shadow">
                  "{sassyQuote}"
                </p>
                <Sparkles className={`absolute -bottom-4 -right-2 w-4 h-4 ${isSassy ? "text-purple-400/40" : "text-rose-400/40"}`} />
              </div>
            </div>

            {/* Feelings & Sensitivity Sensor */}
            <FeelingsSensor sessionState={sessionState} />

            {/* Fallback Tool actions list */}
            {toolActions.length > 0 && (
              <div className="w-full px-4 animate-fade-in">
                <h3 className="text-xs font-mono tracking-widest text-gray-500 mb-2 uppercase text-left">
                  Executed Commands
                </h3>
                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                  {toolActions.map((action, idx) => (
                    <div
                      key={action.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md animate-slide-up"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className={`w-4 h-4 ${themeAccentHighlight}`} />
                        <div className="text-left">
                          <p className="text-xs text-gray-400">Opening website</p>
                          <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                            {action.args.siteName || "Search Results"}
                          </p>
                        </div>
                      </div>
                      
                      <a
                        href={action.args.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${themeBg15} border ${themeBorder30} ${themeAccentText} text-xs font-medium hover:${isSassy ? "bg-purple-500/35" : "bg-rose-500/35"} transition`}
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "chat" ? (
          <div className="w-full flex-1 flex flex-col min-h-[440px] w-full bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden animate-fade-in">
            {/* Power Memory Card Status Bar with Deep Thinking Mode */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden xs:inline font-semibold text-[10px] tracking-wider uppercase text-gray-300">
                  💾 Power Memory: <strong className={themeAccentHighlight}>{memories.length}</strong> Facts Saved
                </span>
                <span className="xs:hidden font-semibold text-[10px] tracking-wider uppercase text-gray-300">
                  💾 Memory: {memories.length} Facts
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setThinkingMode(!thinkingMode)}
                  className={`text-[10px] uppercase tracking-widest font-mono transition flex items-center gap-1 cursor-pointer ${
                    thinkingMode ? "text-purple-400 font-bold" : "text-gray-500 hover:text-gray-300"
                  }`}
                  title="Enable HIGH logic reasoning using gemini-3.1-pro-preview"
                >
                  <Brain className={`w-3.5 h-3.5 ${thinkingMode ? "animate-pulse" : ""}`} />
                  Thinking: {thinkingMode ? "HIGH" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("triggers");
                    setTriggersSubTab("memory");
                  }}
                  className={`text-[10px] uppercase tracking-widest font-mono ${themeAccentHighlight} hover:${themeAccentText} transition flex items-center gap-1 cursor-pointer`}
                >
                  💾 Manage Card
                </button>
              </div>
            </div>

            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[360px] min-h-[280px]">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } animate-slide-up`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed text-left relative overflow-hidden shadow-lg border border-white/5 ${
                    msg.role === "user" ? (isSassy ? "bg-purple-500/10 border-purple-500/20" : "bg-rose-500/10 border-rose-500/20") : "bg-white/[0.03]"
                  }`}>
                    {msg.role === "model" ? (
                      <div>
                        <div className={`absolute top-0 left-0 w-1 h-full ${isSassy ? "bg-purple-500" : "bg-rose-500"}`} />
                        <p className="text-gray-100">{msg.text}</p>
                      </div>
                    ) : (
                      <p className={`${isSassy ? "text-purple-200" : "text-rose-200"} font-medium`}>{msg.text}</p>
                    )}

                    {/* Google Maps grounding cards inside Zoya's response */}
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3">
                        <p className={`text-[10px] font-mono tracking-wider ${themeAccentHighlight} uppercase flex items-center gap-1`}>
                          <Navigation className="w-3 h-3 animate-pulse" /> Grounded Maps Spots & Directions
                        </p>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                          {msg.groundingChunks.map((chunk: any, cIdx: number) => {
                            const link = chunk?.web?.uri || chunk?.maps?.uri || chunk?.uri;
                            const title = chunk?.web?.title || chunk?.maps?.title || chunk?.title || "View Spot";
                            const snippet = chunk?.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0] || chunk?.snippet;

                            if (!link) return null;

                            return (
                              <div
                                key={cIdx}
                                className={`p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:${isSassy ? "border-purple-500/30" : "border-rose-500/30"} transition-all duration-300`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                                    {title}
                                  </span>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded ${themeBg15} border ${themeBorder30} text-[10px] ${themeAccentText} font-semibold hover:${isSassy ? "bg-purple-500/35" : "bg-rose-500/35"} transition shrink-0`}
                                  >
                                    View <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                                {snippet && (
                                  <p className="text-[10px] text-gray-400 mt-1 italic leading-normal">
                                    "{snippet}"
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start">
                  <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/5 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSassy ? "bg-purple-500" : "bg-rose-500"} animate-bounce`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${isSassy ? "bg-purple-500" : "bg-rose-500"} animate-bounce [animation-delay:0.2s]`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${isSassy ? "bg-purple-500" : "bg-rose-500"} animate-bounce [animation-delay:0.4s]`} />
                  </div>
                </div>
              )}
            </div>

            {micPermissionError && (
              <div className="mx-3 my-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex flex-col gap-2.5 leading-normal text-left relative animate-fade-in">
                <button
                  type="button"
                  onClick={() => setMicPermissionError(null)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
                  <span className="font-bold text-xs uppercase tracking-wider">Mic Access Blocked</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  I can't hear your sweet voice, babe! Let's get that microphone set up:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[10px] text-gray-400">
                  <li>Click the <span className="text-white font-medium">Padlock (🔒)</span> next to the URL.</li>
                  <li>Toggle the <span className="text-amber-300 font-semibold">Microphone</span> to <span className="text-emerald-400 font-bold">Allow</span>.</li>
                  <li>If you're stuck in an iframe, click below to run in a standalone tab!</li>
                </ul>
                <div className="pt-1.5 border-t border-white/5 flex gap-2">
                  <a
                    href={typeof window !== "undefined" ? window.location.href : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                      isSassy
                        ? "bg-purple-600/30 border border-purple-500/40 text-purple-200 hover:bg-purple-600/50"
                        : "bg-rose-600/30 border border-rose-500/40 text-rose-200 hover:bg-rose-600/50"
                    }`}
                  >
                    🚀 Open in New Tab
                  </a>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={sendTextMessage} className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening... Speak now and tap mic when done!"
                      : location
                      ? "Find sassy cafe recommendations, spots..."
                      : "Say something flirty or ask for places..."
                  }
                  disabled={isListening}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-10 py-2 text-sm text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"} transition font-sans disabled:opacity-80`}
                />
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-300 ${
                    isListening
                      ? "bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input (transcribe speech)"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={!textInput.trim() || isTyping || isListening}
                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  !textInput.trim() || isTyping || isListening
                    ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                    : themeSubmitBtnActive
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : activeTab === "music" ? (
          <div className="w-full flex-1 flex flex-col min-h-[440px] w-full bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden animate-fade-in p-4 text-left space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <div className={`p-2 rounded-lg ${themeBg15} border ${themeBorder30}`}>
                <Music className={`w-5 h-5 ${themeAccentHighlight}`} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Music Synthesizer (Lyria)</h2>
                <p className="text-[10px] text-gray-400">Generate high-fidelity audio tracks with Google Lyria</p>
              </div>
            </div>

            {/* Paid key tier info banner */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-gray-400 leading-normal flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Billing Information: </span>
                Lyria Clip & Pro require a paid Gemini API key. Make sure to configure your <code className="text-amber-300 font-mono">GEMINI_API_KEY</code> with access to Lyria models under AI Studio Secrets if not already provisioned.
              </div>
            </div>

            {/* Music Prompt Inputs */}
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Model Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMusicModel("lyria-3-clip-preview")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      musicModel === "lyria-3-clip-preview"
                        ? `${themeBg20} border-purple-500/40 text-purple-200`
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    🎵 Lyria Clip (Up to 30s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMusicModel("lyria-3-pro-preview")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      musicModel === "lyria-3-pro-preview"
                        ? `${themeBg20} border-purple-500/40 text-purple-200`
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    🎸 Lyria Pro (Full Track)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Describe your vibe
                </label>
                <textarea
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="e.g. A gorgeous, cinematic lo-fi orchestral hip-hop beat for relaxing with deep violin accents..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition font-sans resize-none"
                />
              </div>

              {musicError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/20 text-xs text-rose-300">
                  {musicError}
                </div>
              )}

              {/* Music Player & Lyrics section when generated */}
              {generatedAudioUrl && (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-3 animate-scale-up">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Track successfully synthesized!
                    </span>
                    <a
                      href={generatedAudioUrl}
                      download="lyria-ai-music.wav"
                      className={`text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 ${themeAccentText} transition`}
                    >
                      Download
                    </a>
                  </div>
                  <audio src={generatedAudioUrl} controls className="w-full h-8 rounded bg-white/5" />
                  
                  {generatedLyrics && (
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase block mb-1">Generated Lyrics / Track Details</span>
                      <p className="text-xs text-gray-300 italic whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto pr-1">
                        {generatedLyrics}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleGenerateMusic}
              disabled={isGeneratingMusic || !musicPrompt.trim()}
              className={`w-full py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                isGeneratingMusic || !musicPrompt.trim()
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                  : themeSubmitBtnActive
              }`}
            >
              {isGeneratingMusic ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Synthesizing Lyria melody...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                  Synthesize AI Music Vibe 🎵
                </>
              )}
            </button>
          </div>
        ) : activeTab === "triggers" ? (
          <div className="w-full flex-1 flex flex-col gap-4 min-h-[440px] w-full bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md p-5 overflow-hidden animate-fade-in text-left">
            {/* Sub-tabs Selector */}
            <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
              <button
                onClick={() => setTriggersSubTab("apps")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer text-center ${
                  triggersSubTab === "apps" ? `${themeBg20} ${themeAccentText} border ${themeBorder30} font-extrabold` : "text-gray-400 hover:text-white"
                }`}
              >
                Custom Triggers
              </button>
              <button
                onClick={() => setTriggersSubTab("memory")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer text-center ${
                  triggersSubTab === "memory" ? `${themeBg20} ${themeAccentText} border ${themeBorder30} font-extrabold` : "text-gray-400 hover:text-white"
                }`}
              >
                💾 Power Memory Card
              </button>
            </div>

            {triggersSubTab === "apps" ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Cpu className={`w-5 h-5 ${themeAccentHighlight}`} />
                    Custom Voice Triggers
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Configure your custom hotwords! Whenever you say or type <span className={`font-semibold ${themeAccentHighlight}`}>"open [trigger]"</span>, Mayra will launch that website instantly in a new tab.
                  </p>
                </div>

                {/* Quick Tips */}
                <div className={`p-3 rounded-xl bg-white/[0.02] border ${themeBorder20} flex items-start gap-2.5`}>
                  <Sparkles className={`w-4.5 h-4.5 ${themeAccentHighlight} shrink-0 mt-0.5`} />
                  <div className="text-xs text-gray-300 space-y-1">
                    <p className="font-semibold text-white">💡 Pro Tip: Program by Voice or Chat!</p>
                    <p className="text-gray-400 leading-normal">
                      You can literally tell Mayra: <span className="text-white italic">"Mayra, program trigger 'news' for bbc.com"</span> or write it in the chat tab. She'll configure it on the fly! 😉
                    </p>
                  </div>
                </div>

                {/* Trigger Creation Form */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Create New Custom Trigger
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-medium">App Name</label>
                      <input
                        type="text"
                        id="trigger-app-name-input"
                        placeholder="e.g., GitHub"
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        className={`w-full py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"} transition`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-medium">Trigger Phrase/Keyword</label>
                      <input
                        type="text"
                        id="trigger-phrase-input"
                        placeholder="e.g., git"
                        value={newAppTrigger}
                        onChange={(e) => setNewAppTrigger(e.target.value)}
                        className={`w-full py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"} transition`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-medium">Destination Website URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="trigger-url-input"
                        placeholder="e.g., github.com"
                        value={newAppUrl}
                        onChange={(e) => setNewAppUrl(e.target.value)}
                        className={`flex-1 py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"} transition`}
                      />
                      <button
                        onClick={addCustomApp}
                        id="program-trigger-btn"
                        className={`px-4 rounded-lg ${themeBg20} border ${themeBorder30} hover:${isSassy ? "bg-purple-500/30" : "bg-rose-500/30"} ${themeAccentText} transition text-xs flex items-center gap-1 font-bold cursor-pointer`}
                      >
                        <Plus className="w-3.5 h-3.5" /> Program
                      </button>
                    </div>
                  </div>
                </div>

                {/* Triggers List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[220px]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Programmed Shortcuts ({voiceApps.filter(app => app.trigger !== "maps").length})
                  </h3>
                  {voiceApps.filter(app => app.trigger !== "maps").map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition duration-200"
                    >
                      <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                        <input
                          type="checkbox"
                          id={`app-enable-check-${app.id}`}
                          checked={app.enabled}
                          onChange={() => toggleApp(app.id)}
                          className={`rounded border-white/10 bg-black/40 ${isSassy ? "text-purple-500 focus:ring-purple-500" : "text-rose-500 focus:ring-rose-500"} cursor-pointer w-4 h-4 shrink-0`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white leading-tight flex items-center gap-1.5 flex-wrap">
                            {app.name} 
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-medium ${themeAccentHighlight}`}>
                              {app.trigger}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[280px] leading-relaxed mt-0.5">
                            {app.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                          title="Test URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {parseInt(app.id) > 5 && (
                          <button
                            onClick={() => deleteApp(app.id)}
                            className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:${themeAccentHighlight} transition cursor-pointer`}
                            title="Delete trigger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${themeAccentHighlight} animate-pulse`} />
                    Power Memory Card
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Store persistent, long-term personal facts, preferences, and commands. Mayra references these instantly to build a deep companion bond (more advanced than Jarvis AI!).
                  </p>
                </div>

                {/* Memory Creation Form */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Store New Fact / Preference
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g., My favorite food is Sushi, or I like tea over coffee"
                      value={newMemoryFact}
                      onChange={(e) => setNewMemoryFact(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newMemoryFact.trim()) {
                          addMemory(newMemoryFact, newMemoryCategory);
                          setNewMemoryFact("");
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"} transition`}
                    />
                    <select
                      value={newMemoryCategory}
                      onChange={(e) => setNewMemoryCategory(e.target.value)}
                      className={`py-2 px-3 rounded-lg bg-[#0e0e16] border border-white/10 text-xs text-white focus:outline-none cursor-pointer`}
                    >
                      <option value="personal">Personal Fact</option>
                      <option value="preferences">Preference</option>
                      <option value="commands">Command</option>
                      <option value="relationship">Relationship</option>
                    </select>
                    <button
                      onClick={() => {
                        if (newMemoryFact.trim()) {
                          addMemory(newMemoryFact, newMemoryCategory);
                          setNewMemoryFact("");
                        }
                      }}
                      className={`px-4 py-2 rounded-lg ${themeBg20} border ${themeBorder30} hover:${isSassy ? "bg-purple-500/30" : "bg-rose-500/30"} ${themeAccentText} transition text-xs flex items-center gap-1 font-bold cursor-pointer justify-center`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Save Fact
                    </button>
                  </div>
                </div>

                {/* Stored Facts List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[220px]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Saved Facts & Contexts ({memories.length})
                  </h3>
                  {memories.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 italic bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                      Your Power Memory Card is currently empty, handsome. Add a fact above, or tell Mayra about yourself in Chat so she stores it automatically! 😉
                    </div>
                  ) : (
                    memories.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition duration-200"
                      >
                        <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            m.category === "personal" ? "bg-blue-400" :
                            m.category === "preferences" ? "bg-emerald-400" :
                            m.category === "commands" ? "bg-amber-400" : "bg-purple-400"
                          }`} title={m.category} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white leading-normal pr-2">
                              {m.fact}
                            </p>
                            <p className="text-[9px] font-mono text-gray-500 mt-0.5 uppercase tracking-wider">
                              Category: {m.category} • Created: {new Date(m.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteMemory(m.id)}
                          className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:${themeAccentHighlight} transition cursor-pointer shrink-0`}
                          title="Erase memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Global error block */}
        {errorMessage && (
          <div className="w-full px-4 animate-bounce">
            <div className={`flex items-start gap-2.5 p-3 rounded-xl ${isSassy ? "bg-purple-500/10 border border-purple-500/30 text-purple-200" : "bg-rose-500/10 border border-rose-500/30 text-rose-200"} text-sm`}>
              <AlertCircle className={`w-5 h-5 ${themeAccentHighlight} shrink-0 mt-0.5`} />
              <div className="text-left">
                <span className="font-semibold block mb-0.5">Whoops, honey!</span>
                <p className={`text-xs ${themeAccentHighlightMuted}`}>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Control Actions Panel (only in Voice activeTab) */}
      {activeTab === "voice" && (
        <footer className="w-full max-w-xl flex flex-col items-center gap-4 z-10 py-4 animate-fade-in">
          <div className="flex items-center justify-center gap-6">
            
            {/* Microphone mute toggle */}
            <button
              onClick={toggleMute}
              disabled={sessionState === "disconnected"}
              className={`p-3.5 rounded-full border transition-all duration-300 flex items-center justify-center shadow-lg ${
                sessionState === "disconnected"
                  ? "bg-black/10 border-white/5 text-white/20 cursor-not-allowed"
                  : isMuted
                  ? themeMuteBtnMuted
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              }`}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Central Power / Connection Button */}
            <button
              onClick={toggleSession}
              id="zoya-power-btn"
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 scale-100 hover:scale-105 active:scale-95 ${
                sessionState === "disconnected"
                  ? themePowerBtnDisconnected
                  : "bg-white border border-white text-black shadow-white/10"
              }`}
              title={sessionState === "disconnected" ? "Connect with Mayra" : "Close session"}
            >
              <Power className="w-8 h-8" />
            </button>

            {/* Sassy interaction trigger */}
            <button
              onClick={() => {
                if (sessionState === "disconnected" || sessionState === "connecting") {
                  updateSassyQuote("disconnected");
                } else {
                  updateSassyQuote(audioService.isSpeaking() ? "speaking" : "listening");
                }
              }}
              className="p-3.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
              title="Wink at Mayra"
            >
              <Heart className={`w-5 h-5 ${isSassy ? "text-amber-400 fill-amber-400/10" : "text-rose-400 fill-rose-400/10"}`} />
            </button>
          </div>

          {/* Dynamic visual status footer label */}
          <p className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
            {sessionState === "disconnected" && "Tap center node to connect"}
            {sessionState === "connecting" && "Summoning Mayra..."}
            {sessionState === "listening" && "Mayra is listening to you"}
            {sessionState === "speaking" && "Mayra is sharing her wisdom"}
          </p>
        </footer>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#151520] to-[#0c0c14] border border-white/10 p-5 relative shadow-2xl animate-scale-up">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4.5 right-4.5 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3.5">
              <div className={`w-8 h-8 rounded-full overflow-hidden border ${themeBorder30}`}>
                <img
                  src={mayraLogo}
                  alt="Mayra Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-white">Meet Mayra</h2>
                <span className={`text-[9px] uppercase tracking-wider ${themeAccentHighlight} font-bold block leading-none mt-0.5`}>
                  AI Companion GF & Agent
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-sm text-gray-300">
              <p className="text-left">
                Mayra is your highly confident, witty, and sassy AI Girlfriend and Companion Agent. She is responsible for helping you with every task you ask her!
              </p>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-gray-400 text-left space-y-2">
                <p className="font-semibold text-white mb-1">🎮 How to play:</p>
                <p>• 🗣️ <strong className={themeAccentHighlight}>Talk casually:</strong> Press the red power button, allow mic permission, and start talking like a close friend.</p>
                <p>• 🤫 <strong className={themeAccentHighlight}>Teasing tone:</strong> Prepare for sarcastic jokes, sass, and playful winks.</p>
                <p>• 🌐 <strong className={themeAccentHighlight}>Web Search / Opening sites:</strong> Ask her to open any website or look something up. She'll run her custom browser tool instantly!</p>
              </div>

              {/* Active Mobile & Accessibility Companion Mode (Vivo Y2140 & general mobile) */}
              <div id="accessibility-section" className="border-t border-white/5 pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className={`text-[11px] font-bold ${themeAccentText} uppercase tracking-wider flex items-center gap-1`}>
                      <Smartphone className="w-3.5 h-3.5 animate-pulse text-amber-400" /> Active Mobile Mode
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">Optimized for Vivo Y2140 & Android Voice Access</p>
                  </div>
                  <button
                    id="accessibility-mode-toggle"
                    type="button"
                    onClick={() => {
                      const next = !accessibilityMode;
                      setAccessibilityMode(next);
                      if (typeof navigator !== "undefined" && navigator.vibrate) {
                        navigator.vibrate(next ? [80, 50, 80] : 100);
                      }
                    }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      accessibilityMode ? (isSassy ? "bg-purple-600" : "bg-rose-500") : "bg-white/10"
                    }`}
                    role="switch"
                    aria-checked={accessibilityMode}
                    aria-label="Active Mobile and Accessibility Mode"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        accessibilityMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div id="accessibility-info" className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[10px] text-gray-400 text-left space-y-2 leading-relaxed">
                  <p className="flex items-start gap-1">
                    <Activity className={`w-3 h-3 shrink-0 mt-0.5 ${accessibilityMode ? "text-green-400" : "text-gray-500"}`} />
                    <span>
                      <strong>Wake Lock & Anti-Sleep:</strong> Keeps screen active on Vivo Y2140 so background speech triggers aren't blocked by OS sleep.
                    </span>
                  </p>
                  <p className="flex items-start gap-1">
                    <Sparkles className={`w-3 h-3 shrink-0 mt-0.5 ${accessibilityMode ? "text-amber-400" : "text-gray-500"}`} />
                    <span>
                      <strong>Eyes-Free Vibration Feedback:</strong> Haptic patterns confirm connecting (medium), listening (double-short), and disconnected states.
                    </span>
                  </p>

                  {/* Vivo/Android specific microphone troubleshooter */}
                  <div className="pt-1.5 border-t border-white/5 mt-1.5 space-y-1">
                    <p className="font-bold text-[9px] text-gray-300 uppercase tracking-widest flex items-center gap-1">
                      🎙️ vivo Y2140 Voice Troubleshooter:
                    </p>
                    <p>1. Open Chrome Browser menu (three dots) → <strong>Settings</strong>.</p>
                    <p>2. Tap <strong>Site settings</strong> → <strong>Microphone</strong> → Allow access.</p>
                    <p>3. Go to Vivo System Settings → <strong>Battery</strong> → turn off "High Background Power Consumption" block for Chrome browser.</p>
                  </div>
                </div>
              </div>

              {/* UI Theme Selection */}
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <p className={`text-[11px] font-semibold ${themeAccentText} uppercase tracking-wider text-left`}>
                  Mayra's Vibe (UI Theme)
                </p>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl animate-fade-in">
                  <button
                    id="theme-opt-rose"
                    onClick={() => {
                      setUiTheme("rose");
                      localStorage.setItem("zoya_ui_theme", "rose");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
                      uiTheme === "rose"
                        ? "bg-gradient-to-r from-rose-500/25 to-pink-500/25 border-rose-500/30 text-rose-300 shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    🌸 Rose/Pink
                  </button>
                  <button
                    id="theme-opt-sassy"
                    onClick={() => {
                      setUiTheme("sassy");
                      localStorage.setItem("zoya_ui_theme", "sassy");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
                      uiTheme === "sassy"
                        ? "bg-gradient-to-r from-purple-500/25 to-amber-500/25 border-purple-500/30 text-amber-300 shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    ⚡ Sassy (Purple/Gold)
                  </button>
                </div>
              </div>

              {/* Mayra's Sassy Mood Settings */}
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <p className={`text-[11px] font-semibold ${themeAccentText} uppercase tracking-wider text-left`}>
                  Mayra's Sassy Mood Personality
                </p>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl animate-fade-in">
                  <button
                    id="personality-opt-fiesty"
                    onClick={() => setPersonality("fiesty")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                      personality === "fiesty"
                        ? themeGradientBtnSelected
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    🔥 Fiesty
                  </button>
                  <button
                    id="personality-opt-sarcastic"
                    onClick={() => setPersonality("sarcastic")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                      personality === "sarcastic"
                        ? themeGradientBtnSelected
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    😏 Sarcastic
                  </button>
                  <button
                    id="personality-opt-sweetheart"
                    onClick={() => setPersonality("sweetheart")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                      personality === "sweetheart"
                        ? themeGradientBtnSelected
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    💝 Sweet
                  </button>
                </div>
              </div>

              {/* Waveform Animation Style Selection */}
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <p className={`text-[11px] font-semibold ${themeAccentText} uppercase tracking-wider text-left`}>
                  Waveform Animation Style
                </p>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl animate-fade-in">
                  {(["pulse", "line", "bars"] as const).map((styleOpt) => (
                    <button
                      key={styleOpt}
                      id={`style-opt-${styleOpt}`}
                      onClick={() => {
                        setWaveformStyle(styleOpt);
                        localStorage.setItem("zoya_waveform_style", styleOpt);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
                        waveformStyle === styleOpt
                          ? themeGradientBtnSelected
                          : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                      }`}
                    >
                      {styleOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Speed Selection */}
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <p className={`text-[11px] font-semibold ${themeAccentText} uppercase tracking-wider text-left flex items-center gap-1`}>
                  <Gauge className="w-3.5 h-3.5" /> Mayra's Talking Speed
                </p>
                <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-xl animate-fade-in">
                  {([0.75, 1.0, 1.25, 1.5] as const).map((speedOpt) => (
                    <button
                      key={speedOpt}
                      id={`speed-opt-${speedOpt}`}
                      onClick={() => {
                        setVoiceSpeed(speedOpt);
                        localStorage.setItem("zoya_voice_speed", speedOpt.toString());
                      }}
                      className={`py-1.5 px-1 rounded-lg text-xs font-semibold tracking-wider transition-all duration-300 border ${
                        voiceSpeed === speedOpt
                          ? themeGradientBtnSelected
                          : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                      }`}
                    >
                      {speedOpt === 1.0 ? "Normal" : `${speedOpt}x`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <p className={`text-[11px] font-semibold ${themeAccentText} uppercase tracking-wider text-left flex items-center gap-1`}>
                  <Globe className="w-3.5 h-3.5" /> Language Preference
                </p>
                <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-xl animate-fade-in">
                  {[
                    { id: "en", label: "English" },
                    { id: "hi", label: "Hindi" },
                    { id: "or", label: "Odia" },
                    { id: "bn", label: "Bangla" }
                  ].map((langOpt) => (
                    <button
                      key={langOpt.id}
                      id={`lang-opt-${langOpt.id}`}
                      onClick={() => {
                        setSelectedLanguage(langOpt.id as any);
                        localStorage.setItem("zoya_language", langOpt.id);
                      }}
                      className={`py-1.5 px-0.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all duration-300 border ${
                        selectedLanguage === langOpt.id
                          ? themeGradientBtnSelected
                          : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                      }`}
                    >
                      {langOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Programming / Voice App Launcher */}
              <div className="border-t border-white/5 pt-3.5 space-y-2.5">
                <p className={`text-[11px] font-semibold ${themeAccentText} uppercase tracking-wider text-left flex items-center gap-1.5`}>
                  <Cpu className={`w-3.5 h-3.5 ${themeAccentHighlight}`} /> Audio Programming: App Access
                </p>
                <p className="text-[10px] text-gray-400 text-left leading-normal">
                  Toggle or program which apps/websites Mayra can auto-open with voice/chat commands. Say <span className={themeAccentHighlight}>"open [trigger]"</span> to launch.
                </p>

                {/* List of active apps */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {voiceApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition duration-200"
                    >
                      <div className="flex items-center gap-2 text-left">
                        <input
                          type="checkbox"
                          checked={app.enabled}
                          onChange={() => toggleApp(app.id)}
                          className={`rounded border-white/10 bg-black/40 ${isSassy ? "text-purple-500 focus:ring-purple-500" : "text-rose-500 focus:ring-rose-500"} cursor-pointer w-3.5 h-3.5`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                            {app.name} <span className={`text-[9px] font-normal ${themeAccentHighlight}`}>({app.trigger})</span>
                          </p>
                          <p className="text-[9px] text-gray-500 truncate max-w-[140px] leading-tight">
                            {app.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-gray-500 hover:text-white transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {parseInt(app.id) > 5 && (
                          <button
                            onClick={() => deleteApp(app.id)}
                            className={`p-1 rounded-md text-gray-500 hover:${themeAccentHighlight} transition`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom App Form */}
                <div className="space-y-2 bg-white/[0.01] border border-white/5 p-2.5 rounded-xl text-left">
                  <p className={`text-[10px] font-semibold ${themeAccentText} uppercase tracking-widest`}>
                    Program Custom Trigger
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="App Name (e.g. Facebook)"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      className={`py-1 px-2 rounded bg-black/40 border border-white/10 text-[10px] text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"}`}
                    />
                    <input
                      type="text"
                      placeholder="Voice Trigger (e.g. social)"
                      value={newAppTrigger}
                      onChange={(e) => setNewAppTrigger(e.target.value)}
                      className={`py-1 px-2 rounded bg-black/40 border border-white/10 text-[10px] text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"}`}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Website URL (e.g. facebook.com)"
                      value={newAppUrl}
                      onChange={(e) => setNewAppUrl(e.target.value)}
                      className={`flex-1 py-1 px-2 rounded bg-black/40 border border-white/10 text-[10px] text-white focus:outline-none focus:${isSassy ? "border-purple-500/50" : "border-rose-500/50"}`}
                    />
                    <button
                      onClick={addCustomApp}
                      className={`px-2.5 rounded ${themeBg20} border ${themeBorder30} hover:${isSassy ? "bg-purple-500/30" : "bg-rose-500/30"} ${themeAccentText} transition text-[10px] flex items-center gap-1 font-bold`}
                    >
                      <Plus className="w-3 h-3" /> Program
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                id="modal-close-btn"
                className={`w-full py-2.5 rounded-xl ${themeCloseBtn} font-medium text-xs transition-all shadow-lg`}
              >
                Let's banter, babe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Custom Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#151520] to-[#0c0c14] border border-white/10 p-5 relative shadow-2xl animate-scale-up">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4.5 right-4.5 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-9 h-9 rounded-full overflow-hidden border ${themeBorder30} flex items-center justify-center bg-pink-500/10 text-pink-400 shrink-0`}>
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-white">Install Mayra AI</h2>
                <span className={`text-[9px] uppercase tracking-wider ${themeAccentHighlight} font-bold block leading-none mt-0.5`}>
                  Save to Home Screen or Desktop
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-gray-300 text-left">
              <p className="leading-normal">
                Install <strong className="text-white">Mayra AI</strong> to run as a fast, standalone app, with instant voice access, offline capabilities, and no browser URL bars in your way!
              </p>

              {/* iframe warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 space-y-1.5 leading-normal">
                <p className="font-bold uppercase tracking-wider text-[9px] text-amber-300 flex items-center gap-1">
                  ⚠️ Note for Preview Mode:
                </p>
                <p>
                  Browsers block PWA installation inside iframes. You must open Mayra in a standalone window to install her!
                </p>
                <a
                  href={typeof window !== "undefined" ? window.location.href : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-1.5 w-full py-1.5 px-3 rounded-lg text-[10px] font-bold text-center block transition uppercase tracking-widest ${
                    isSassy
                      ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
                  }`}
                >
                  🚀 Launch Standalone App
                </a>
              </div>

              {/* Multi-platform guide */}
              <div className="space-y-3 pt-1">
                {/* Android / Chrome */}
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5 text-gray-400">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[11px]">Android & Chrome / Edge</h4>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                      Tap the three dots (<strong className="text-white">⋮</strong>) in the top-right and select <strong className="text-white">"Install App"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* Apple iOS Safari */}
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5 text-gray-400">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[11px]">iOS Safari (iPhone & iPad)</h4>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                      Tap the Share icon (<strong className="text-white">📤</strong>) at the bottom, scroll down, and select <strong className="text-white">"Add to Home Screen"</strong> (<strong className="text-white">➕</strong>).
                    </p>
                  </div>
                </div>

                {/* macOS / Windows Desktop */}
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5 text-gray-400">
                    <Monitor className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-[11px]">Windows / Mac Desktop</h4>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                      Click the download icon (<strong className="text-white">📥</strong>) in the address bar, or click settings & select <strong className="text-white">"Install Mayra AI Assistant"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInstallModal(false)}
                className={`w-full py-2.5 mt-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-xs transition-all`}
              >
                Got it, gorgeous!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
