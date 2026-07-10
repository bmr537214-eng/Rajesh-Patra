import React, { useState, useRef } from "react";
import { 
  Sparkles, Brain, Image, Video, Mic, MicOff, Download, 
  RefreshCw, UploadCloud, Check, Sliders, Play, Trash2, Globe
} from "lucide-react";

interface CreativeStudioAppProps {
  addNotification: (title: string, body: string, type?: string) => void;
  accentText: string;
  desktopTheme: string;
  thinkingMode: boolean;
  setThinkingMode: (val: boolean) => void;
}

type TabType = "thinking" | "image" | "video" | "voice";

export default function CreativeStudioApp({
  addNotification,
  accentText,
  desktopTheme,
  thinkingMode,
  setThinkingMode
}: CreativeStudioAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("thinking");

  // --- Tab 1: High Thinking states ---
  const [thinkingPrompt, setThinkingPrompt] = useState("");
  const [thinkingResult, setThinkingResult] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingModel, setThinkingModel] = useState<"gemini-3.1-pro-preview" | "gemini-3.5-flash">("gemini-3.1-pro-preview");

  // --- Tab 2: Studio Image Generator states ---
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageModel, setImageModel] = useState<"gemini-3-pro-image-preview" | "gemini-3.1-flash-image-preview">("gemini-3-pro-image-preview");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [useSearch, setUseSearch] = useState(false);
  const [useImageSearch, setUseImageSearch] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- Tab 3: Veo Video Generator states ---
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoImage, setVideoImage] = useState<string | null>(null); // base64 encoded starting frame
  const [videoRatio, setVideoRatio] = useState<"16:9" | "9:16">("16:9");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [pollingTimerId, setPollingTimerId] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Tab 4: Low-Latency Dictation states ---
  const [fastInput, setFastInput] = useState("");
  const [fastResult, setFastResult] = useState("");
  const [isFastTyping, setIsFastTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ----------------------------------------------------
  // Tab 1: High Thinking Handler
  // ----------------------------------------------------
  const handleHighThinkingQuery = async () => {
    if (!thinkingPrompt.trim() || isThinking) return;
    setIsThinking(true);
    setThinkingResult("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: thinkingPrompt,
          history: [],
          thinkingMode: thinkingModel === "gemini-3.1-pro-preview", // forces thinkingLevel: HIGH on backend
          personality: "smart",
        }),
      });
      const data = await response.json();
      if (data.error) {
        setThinkingResult(`Error: ${data.error}`);
      } else {
        setThinkingResult(data.text);
        addNotification("🧠 Query Solved", "High-Thinking analysis complete, handsome!", "info");
      }
    } catch (err: any) {
      setThinkingResult(`Failed to run high-thinking engine: ${err.message}`);
    } finally {
      setIsThinking(false);
    }
  };

  // ----------------------------------------------------
  // Tab 2: Studio Image Generator Handler
  // ----------------------------------------------------
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImageCaption(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: imageModel === "gemini-3-pro-image-preview" ? "gemini-3-pro-image-preview" : "gemini-3.1-flash-image",
          aspectRatio,
          imageSize,
          useSearch,
          useImageSearch,
        }),
      });
      const data = await response.json();
      if (data.error) {
        addNotification("🎨 Image Failed", data.error, "error");
      } else {
        setGeneratedImageUrl(data.imageUrl);
        if (data.caption) setImageCaption(data.caption);
        addNotification("🎨 Image Generated", "Your creative studio masterpiece is ready!", "success");
      }
    } catch (err: any) {
      addNotification("🎨 Generation Error", err.message, "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ----------------------------------------------------
  // Tab 3: Veo Video Generator Handlers
  // ----------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    if (isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    setVideoStatusMessage("Contacting Google Veo server...");

    const loadingPhrases = [
      "Veo is cooking your cinematic video...",
      "Rendering high-definition motion frames...",
      "Analyzing reference image pixels...",
      "Stabilizing visual camera output...",
      "Applying smooth vector transitions...",
      "Generative rendering can take up to 2 minutes, hold on tight honey...",
      "Wrapping up video synthesis..."
    ];

    let phraseIdx = 0;
    const phraseInterval = setInterval(() => {
      if (phraseIdx < loadingPhrases.length - 1) {
        phraseIdx++;
        setVideoStatusMessage(loadingPhrases[phraseIdx]);
      }
    }, 12000);

    try {
      const startRes = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          image: videoImage,
          aspectRatio: videoRatio,
        }),
      });

      const startData = await startRes.json();
      if (startData.error) {
        clearInterval(phraseInterval);
        setVideoStatusMessage("");
        addNotification("🎬 Video Error", startData.error, "error");
        setIsGeneratingVideo(false);
        return;
      }

      const operationName = startData.operationName;
      pollVideoStatus(operationName, phraseInterval);
    } catch (err: any) {
      clearInterval(phraseInterval);
      setVideoStatusMessage("");
      addNotification("🎬 Video Error", err.message, "error");
      setIsGeneratingVideo(false);
    }
  };

  const pollVideoStatus = async (operationName: string, phraseInterval: any) => {
    const poll = async () => {
      try {
        const statusRes = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();

        if (statusData.error) {
          clearInterval(phraseInterval);
          setVideoStatusMessage("");
          addNotification("🎬 Video Failed", statusData.error, "error");
          setIsGeneratingVideo(false);
          return;
        }

        if (statusData.done) {
          clearInterval(phraseInterval);
          setVideoStatusMessage("Downloading compiled mp4...");
          
          // Fetch compiled video file proxy
          const downloadRes = await fetch("/api/video-download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName }),
          });

          if (!downloadRes.ok) {
            throw new Error("Failed to download processed video stream");
          }

          const blob = await downloadRes.blob();
          const localUrl = URL.createObjectURL(blob);
          setGeneratedVideoUrl(localUrl);
          setVideoStatusMessage("");
          setIsGeneratingVideo(false);
          addNotification("🎬 Video Created", "Your Veo cinematic rendering is ready for playback!", "success");
        } else {
          // Poll again in 6 seconds
          setTimeout(poll, 6000);
        }
      } catch (err: any) {
        clearInterval(phraseInterval);
        setVideoStatusMessage("");
        addNotification("🎬 Connection Lost", err.message, "error");
        setIsGeneratingVideo(false);
      }
    };

    // Initial delay before first poll
    setTimeout(poll, 6000);
  };

  // ----------------------------------------------------
  // Tab 4: Low-Latency Dictation Handlers
  // ----------------------------------------------------
  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordingStatus("Requesting microphone permission...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingStatus("Transcribing spoken audio via gemini-3.5-flash...");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          try {
            const response = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audio: base64Data,
                mimeType: "audio/webm",
              }),
            });
            const data = await response.json();
            if (data.text) {
              setFastInput(data.text);
              setRecordingStatus("");
              // Trigger low-latency chat automatically!
              handleFastChat(data.text);
            } else {
              setRecordingStatus("No words detected. Try speaking closer to the microphone, handsome!");
            }
          } catch (err: any) {
            setRecordingStatus(`Transcription failed: ${err.message}`);
          }
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("Listening... speak now!");
    } catch (err: any) {
      setRecordingStatus(`Microphone access failed: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFastChat = async (messageText?: string) => {
    const query = messageText || fastInput;
    if (!query.trim() || isFastTyping) return;
    setIsFastTyping(true);
    setFastResult("");

    try {
      const response = await fetch("/api/chat-lite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await response.json();
      if (data.error) {
        setFastResult(`Error: ${data.error}`);
      } else {
        setFastResult(data.text);
      }
    } catch (err: any) {
      setFastResult(`Error: ${err.message}`);
    } finally {
      setIsFastTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-zinc-100 font-sans" id="creative-studio-root">
      {/* Top Tab Bar Controls */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-2 mb-4 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab("thinking")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition cursor-pointer ${
            activeTab === "thinking" 
              ? "bg-white/10 text-cyan-400 border border-cyan-500/30" 
              : "hover:bg-white/5 text-zinc-400 hover:text-white"
          }`}
          id="tab-thinking-btn"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>REASONING</span>
        </button>

        <button
          onClick={() => setActiveTab("image")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition cursor-pointer ${
            activeTab === "image" 
              ? "bg-white/10 text-cyan-400 border border-cyan-500/30" 
              : "hover:bg-white/5 text-zinc-400 hover:text-white"
          }`}
          id="tab-image-btn"
        >
          <Image className="w-3.5 h-3.5" />
          <span>IMAGE LAB</span>
        </button>

        <button
          onClick={() => setActiveTab("video")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition cursor-pointer ${
            activeTab === "video" 
              ? "bg-white/10 text-cyan-400 border border-cyan-500/30" 
              : "hover:bg-white/5 text-zinc-400 hover:text-white"
          }`}
          id="tab-video-btn"
        >
          <Video className="w-3.5 h-3.5" />
          <span>VEO MOVIE</span>
        </button>

        <button
          onClick={() => setActiveTab("voice")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition cursor-pointer ${
            activeTab === "voice" 
              ? "bg-white/10 text-cyan-400 border border-cyan-500/30" 
              : "hover:bg-white/5 text-zinc-400 hover:text-white"
          }`}
          id="tab-voice-btn"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>LITE DICTATE</span>
        </button>
      </div>

      {/* Main Panel Body */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* TAB 1: HIGH THINKING LAB */}
        {activeTab === "thinking" && (
          <div className="space-y-4" id="thinking-tab-content">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Logical Reasoning Workspace
                </span>
                <select
                  value={thinkingModel}
                  onChange={(e: any) => setThinkingModel(e.target.value)}
                  className="bg-zinc-900/90 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-mono text-cyan-100 focus:outline-none"
                  id="thinking-model-select"
                >
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro (Deep Thought)</option>
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Fast Reasoning)</option>
                </select>
              </div>

              <textarea
                value={thinkingPrompt}
                onChange={(e) => setThinkingPrompt(e.target.value)}
                placeholder="Submit complex math puzzles, algorithmic problems, code analysis, or logical paradoxes... Zoya handles them beautifully in thinking mode."
                className="w-full h-24 p-3 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                id="thinking-textarea"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleHighThinkingQuery}
                  disabled={isThinking || !thinkingPrompt.trim()}
                  className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-black font-bold font-mono text-xs rounded-lg transition-all shadow-lg ${
                    isThinking || !thinkingPrompt.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  id="thinking-execute-btn"
                >
                  {isThinking ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>THINKING DEEPLY...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>RUN ANALYSIS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Block */}
            {thinkingResult && (
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-2.5 animate-fade-in" id="thinking-result-panel">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                    Compiled Analysis Report
                  </span>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-auto p-3 bg-black/40 rounded-lg border border-white/5">
                  {thinkingResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDIO IMAGE GENERATOR */}
        {activeTab === "image" && (
          <div className="space-y-4" id="image-tab-content">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Studio Image Synthesis Parameters
                </span>
              </div>

              {/* Grid configs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">Engine Model</label>
                  <select
                    value={imageModel}
                    onChange={(e: any) => setImageModel(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-gray-200"
                    id="image-model-select"
                  >
                    <option value="gemini-3-pro-image-preview">gemini-3-pro (Studio-Quality)</option>
                    <option value="gemini-3.1-flash-image-preview">gemini-3.1-flash (Fast General)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">Resolution Quality</label>
                  <select
                    value={imageSize}
                    onChange={(e: any) => setImageSize(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-gray-200"
                    id="image-size-select"
                  >
                    <option value="1K">1K UHD</option>
                    <option value="2K">2K SuperHD</option>
                    <option value="4K">4K Extreme UHD</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-gray-200"
                    id="image-ratio-select"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="4:3">4:3 Standard</option>
                    <option value="3:4">3:4 Book</option>
                    <option value="3:2">3:2 Photo</option>
                    <option value="2:3">2:3 Poster</option>
                    <option value="21:9">21:9 Ultrawide</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 justify-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="checkbox"
                      id="search-grounding-checkbox"
                      checked={useSearch}
                      onChange={(e) => setUseSearch(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    <label htmlFor="search-grounding-checkbox" className="text-[10px] font-mono text-zinc-300 cursor-pointer flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" /> Web Grounding
                    </label>
                  </div>
                  {useSearch && imageModel === "gemini-3.1-flash-image-preview" && (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        id="image-search-checkbox"
                        checked={useImageSearch}
                        onChange={(e) => setUseImageSearch(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <label htmlFor="image-search-checkbox" className="text-[9px] font-mono text-zinc-400 cursor-pointer">
                        Include Image Search context
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase">Masterpiece Description Prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="A hyperrealistic portrait of a cyberpunk princess with glowing mechanical details, neon pink highlights, looking at a beautiful hologram globe, soft focus, depth of field..."
                  className="w-full h-20 p-2.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  id="image-prompt-textarea"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className={`flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs rounded-lg transition-all shadow-lg ${
                    isGeneratingImage || !imagePrompt.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  id="image-generate-execute-btn"
                >
                  {isGeneratingImage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SYNTHESIZING IMAGE...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GENERATE MASTERPIECE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Image Preview Block */}
            {generatedImageUrl && (
              <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl space-y-3.5 flex flex-col items-center" id="image-result-preview">
                <div className="flex justify-between w-full items-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                    Image Synthesized Successfully
                  </span>
                  <a
                    href={generatedImageUrl}
                    download="zoya-studio-creation.png"
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] text-zinc-300 transition"
                    id="download-image-btn"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PNG</span>
                  </a>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-white/10 max-h-[300px] bg-black flex justify-center items-center">
                  <img
                    src={generatedImageUrl}
                    alt={imagePrompt}
                    referrerPolicy="no-referrer"
                    className="max-h-[300px] object-contain"
                  />
                </div>

                {imageCaption && (
                  <p className="text-[10px] font-mono text-zinc-400 text-center max-w-md italic leading-normal">
                    "{imageCaption}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VEO VIDEO GENERATOR */}
        {activeTab === "video" && (
          <div className="space-y-4" id="video-tab-content">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                Veo Cinematic Movie Lab
              </span>

              {/* Initial Frame Image Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">Starting Frame Reference Photo</label>
                  
                  {videoImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/10 h-32 bg-black flex justify-center items-center">
                      <img src={videoImage} alt="Video seed frame" className="h-full object-contain" />
                      <button
                        onClick={() => setVideoImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600/80 rounded-full text-zinc-200 transition cursor-pointer"
                        title="Remove frame"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-white/15 hover:border-cyan-500/40 rounded-lg h-32 flex flex-col justify-center items-center bg-black/20 cursor-pointer group transition-all"
                    >
                      <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-cyan-400 transition mb-1.5" />
                      <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 transition">
                        Drag & Drop or Click to Seed Image
                      </span>
                      <span className="text-[8px] font-mono text-zinc-600">
                        Veo will animate this image dynamically
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Configurations */}
                <div className="flex flex-col justify-between py-1 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Movie Aspect Ratio</label>
                    <select
                      value={videoRatio}
                      onChange={(e: any) => setVideoRatio(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-gray-200 w-full"
                      id="video-ratio-select"
                    >
                      <option value="16:9">16:9 Landscape Cinematic</option>
                      <option value="9:16">9:16 Portrait Reels</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Camera Movement / Direction</label>
                    <input
                      type="text"
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Add smooth camera zoom in, breeze blowing hair, neon glow intensifying, 4k..."
                      className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      id="video-prompt-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className={`flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs rounded-lg transition-all shadow-lg ${
                    isGeneratingVideo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  id="video-generate-execute-btn"
                >
                  {isGeneratingVideo ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>GENERATING VEO MOVIE...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>COMPILE CINEMATIC VIDEO</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Veo Loading & Status Message Reassurance Screen */}
            {isGeneratingVideo && (
              <div className="p-6 bg-cyan-950/15 border border-cyan-500/20 rounded-xl flex flex-col items-center justify-center space-y-3.5 text-center" id="video-rendering-loader">
                <div className="relative w-12 h-12 flex justify-center items-center">
                  <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full" />
                  <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <Video className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">Google Veo AI Engine Active</h4>
                  <p className="text-[10px] font-mono text-zinc-400 max-w-sm leading-normal">
                    {videoStatusMessage || "Initializing neural video renderer..."}
                  </p>
                </div>
              </div>
            )}

            {/* Generated Video Playback Panel */}
            {generatedVideoUrl && (
              <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl space-y-3.5 flex flex-col items-center" id="video-playback-panel">
                <div className="flex justify-between w-full items-center">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Veo Rendering Complete
                  </span>
                  <a
                    href={generatedVideoUrl}
                    download="veo-cinematic-creation.mp4"
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] text-zinc-300 transition"
                    id="download-video-btn"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download MP4</span>
                  </a>
                </div>

                <div className={`relative rounded-lg overflow-hidden border border-white/10 bg-black flex justify-center items-center ${
                  videoRatio === "16:9" ? "w-full max-w-lg aspect-video" : "w-64 aspect-[9/16]"
                }`}>
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LOW-LATENCY & AUDIO TRANSCRIBE DICTATION */}
        {activeTab === "voice" && (
          <div className="space-y-4" id="voice-tab-content">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                Fast Response Audio Dictation Studio
              </span>

              <div className="flex flex-col items-center justify-center p-6 bg-black/40 border border-white/5 rounded-xl space-y-3 text-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-14 h-14 rounded-full flex justify-center items-center transition-all cursor-pointer ${
                    isRecording 
                      ? "bg-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110 animate-pulse" 
                      : "bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] text-black hover:scale-105"
                  }`}
                  id="dictation-record-btn"
                >
                  {isRecording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
                </button>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                    {isRecording ? "RECORDING ACTIVE" : "MICROPHONE TRANSCRIBE"}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block">
                    Powered by gemini-3.5-flash for audio transcription
                  </span>
                </div>
              </div>

              {recordingStatus && (
                <div className="text-xs text-center font-mono text-cyan-400 animate-pulse">
                  {recordingStatus}
                </div>
              )}

              {/* Dictation Input / Output form */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 uppercase">Captured Dictation Text</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fastInput}
                      onChange={(e) => setFastInput(e.target.value)}
                      placeholder="Your spoken words will appear here automatically, or type anything fast..."
                      className="flex-1 p-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                      id="fast-chat-input"
                    />
                    <button
                      onClick={() => handleFastChat()}
                      disabled={isFastTyping || !fastInput.trim()}
                      className="px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs rounded-lg transition-all cursor-pointer"
                      id="fast-chat-submit"
                    >
                      FAST CHAT
                    </button>
                  </div>
                </div>

                {fastResult && (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-2.5 animate-fade-in" id="fast-chat-result">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                        Low-Latency Fast Lite Response
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-normal font-mono bg-black/40 border border-white/5 p-3 rounded-lg">
                      {fastResult}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-[9px] text-zinc-500 font-mono text-center border-t border-white/5 pt-2 mt-4 select-none">
        Gemini Creative & Reasoning Suite • Enterprise Edition
      </div>
    </div>
  );
}
