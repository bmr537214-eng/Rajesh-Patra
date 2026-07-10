import React, { useState } from "react";
import { 
  Folder, 
  FileText, 
  Trash2, 
  Terminal, 
  Plus, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  TerminalSquare, 
  FileCode,
  Save,
  Trash,
  Video,
  Volume2,
  VolumeX
} from "lucide-react";
import { FileNode } from "../types";

interface FileExplorerAppProps {
  files: FileNode[];
  setFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
  addNotification: (title: string, message: string, type: "info" | "success" | "warning") => void;
  accentText: string;
}

export default function FileExplorerApp({
  files,
  setFiles,
  addNotification,
  accentText
}: FileExplorerAppProps) {
  const [activeTab, setActiveTab] = useState<"files" | "terminal" | "recycle">("files");
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileEditorContent, setFileEditorContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [viewAllVideos, setViewAllVideos] = useState(false);
  
  // Dedicated volume & mute per video file
  const [videoVolumes, setVideoVolumes] = useState<Record<string, number>>({});
  const [mutedVideos, setMutedVideos] = useState<Record<string, boolean>>({});
  
  // Recycle bin state
  const [deletedFiles, setDeletedFiles] = useState<FileNode[]>([
    { id: "bin_1", name: "old_voice_profile.bin", content: "Zoya system backup file v3.2", type: "log", size: 1024, createdAt: new Date().toISOString() },
    { id: "bin_2", name: "corrupted_manifest.json", content: '{"status": "broken"}', type: "json", size: 256, createdAt: new Date().toISOString() }
  ]);

  // Terminal state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "MAYA_OS V4.0.9 [INITIALIZED]",
    "SYSTEM SECURE ENCRYPTED CHANNEL OPEN",
    "Type 'help' to view active command listing.",
    ""
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.includes(".") ? newFileName : `${newFileName}.txt`;
    const type = name.endsWith(".json") ? "json" : name.endsWith(".js") || name.endsWith(".ts") ? "code" : "text";

    const newFile: FileNode = {
      id: "file_" + Date.now(),
      name,
      content: `// Created by Mr. Rajesh on ${new Date().toLocaleDateString()}\n\n`,
      type,
      size: 50,
      createdAt: new Date().toISOString()
    };

    setFiles([...files, newFile]);
    setNewFileName("");
    setShowNewFileDialog(false);
    addNotification("File Created", `Successfully initialized ${name} on system registry.`, "success");
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;
    setFiles(files.map(f => f.id === selectedFile.id ? { ...f, content: fileEditorContent, size: fileEditorContent.length } : f));
    addNotification("File Saved", `Modifications written successfully to ${selectedFile.name}`, "success");
  };

  const handleDeleteFile = (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (!fileToDelete) return;
    setFiles(files.filter(f => f.id !== id));
    setDeletedFiles([...deletedFiles, fileToDelete]);
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
    addNotification("Moved to Bin", `${fileToDelete.name} has been moved to the Recycle Bin.`, "warning");
  };

  const handleRestoreFile = (id: string) => {
    const fileToRestore = deletedFiles.find(f => f.id === id);
    if (!fileToRestore) return;
    setDeletedFiles(deletedFiles.filter(f => f.id !== id));
    setFiles([...files, fileToRestore]);
    addNotification("File Restored", `${fileToRestore.name} returned to workspace hierarchy.`, "info");
  };

  const handleEmptyBin = () => {
    setDeletedFiles([]);
    addNotification("Recycle Bin Cleared", "Secure formatting finished.", "success");
  };

  // Terminal logic
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim().toLowerCase();
    const parts = cmd.split(" ");
    const commandName = parts[0];
    
    let output = "";
    
    switch (commandName) {
      case "help":
        output = "Available commands:\n  ls          - list all directory nodes\n  cat [file]  - display file text contents\n  rm [file]   - delete workspace node\n  clear       - reset terminal buffer\n  system      - display telemetry hardware diagnostics\n  create [f]  - fast create simple txt file";
        break;
      case "ls":
        output = files.map(f => `${f.name.padEnd(25)} | ${f.size} bytes | ${f.type.toUpperCase()}`).join("\n");
        if (files.length === 0) output = "Directory tree is currently vacant.";
        break;
      case "clear":
        setTerminalLogs([]);
        setTerminalInput("");
        return;
      case "system":
        output = `MAYA PROCESSOR CORE ACTIVE\nOS VERSION       : V4.0.9-RELEASE\nENCRYPTION       : SHA-256 ZERO TRUST\nBATTERY HEALTH   : 100% OPERATIONAL\nRAM ALLOCATION   : OPTIMIZED (2.4 GB ACTIVE)`;
        break;
      case "cat":
        if (!parts[1]) {
          output = "Error: Please specify file path. Example: 'cat notes.txt'";
        } else {
          const target = files.find(f => f.name.toLowerCase() === parts[1]);
          output = target ? target.content : `File node '${parts[1]}' not registered in current folder.`;
        }
        break;
      case "rm":
        if (!parts[1]) {
          output = "Error: Please specify target file. Example: 'rm system.log'";
        } else {
          const target = files.find(f => f.name.toLowerCase() === parts[1]);
          if (target) {
            handleDeleteFile(target.id);
            output = `Successfully unlinked node '${parts[1]}'`;
          } else {
            output = `Node '${parts[1]}' not found.`;
          }
        }
        break;
      case "create":
        if (!parts[1]) {
          output = "Error: Name required. Example: 'create diary.txt'";
        } else {
          const name = parts[1];
          const newFile: FileNode = {
            id: "file_" + Date.now(),
            name,
            content: "Terminal initialized content node.",
            type: "text",
            size: 33,
            createdAt: new Date().toISOString()
          };
          setFiles([...files, newFile]);
          output = `Successfully created file ${name}`;
        }
        break;
      default:
        output = `Command error: '${commandName}' is not recognized as a system script or core diagnostic command.`;
    }

    setTerminalLogs([...terminalLogs, `> ${terminalInput}`, output, ""]);
    setTerminalInput("");
  };

  return (
    <div className="flex flex-col h-full text-xs font-sans">
      {/* Upper Tab Links */}
      <div className="flex gap-2 border-b border-white/5 pb-2 mb-3">
        {[
          { id: "files", label: "File Explorer", icon: Folder },
          { id: "terminal", label: "Diagnostic Shell", icon: Terminal },
          { id: "recycle", label: "Recycle Bin", icon: Trash2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedFile(null);
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

      {/* Explorer tab view */}
      {activeTab === "files" && (
        <div className="flex-1 flex gap-3 min-h-0">
          {viewAllVideos ? (
            // Simultaneous Playback Mode for All Videos
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5 mb-2">
                <button
                  onClick={() => setViewAllVideos(false)}
                  className="flex items-center gap-1 hover:text-cyan-400 transition cursor-pointer text-gray-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to directory</span>
                </button>
                <span className="font-mono text-emerald-400 font-bold uppercase text-[10px] tracking-widest animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Simultaneous Playback Active
                </span>
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto min-h-0 pr-1">
                {files.filter(f => f.type === "video").map(video => {
                  const fileId = video.id;
                  const vol = videoVolumes[fileId] !== undefined ? videoVolumes[fileId] : 0.8;
                  const isMuted = mutedVideos[fileId] !== undefined ? mutedVideos[fileId] : true; // Default muted in grid mode
                  
                  return (
                    <div key={video.id} className="bg-black/40 rounded-xl border border-white/5 p-2 flex flex-col justify-between">
                      <video
                        src={video.content}
                        autoPlay
                        controls
                        playsInline
                        className="w-full h-32 object-cover rounded-lg bg-zinc-950"
                        ref={(el) => {
                          if (el) {
                            el.volume = vol;
                            el.muted = isMuted;
                          }
                        }}
                      />
                      <div className="mt-2 text-left flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white truncate max-w-[140px] block">{video.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">Playing</span>
                      </div>
                      
                      {/* Independent Audio Slider & Mute Toggle */}
                      <div className="mt-2 flex items-center justify-between gap-2 bg-white/[0.03] border border-white/5 p-1 rounded-lg">
                        <button
                          onClick={() => {
                            setMutedVideos(prev => ({
                              ...prev,
                              [fileId]: !isMuted
                            }));
                          }}
                          className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : vol}
                          onChange={(e) => {
                            const newVol = parseFloat(e.target.value);
                            setVideoVolumes(prev => ({
                              ...prev,
                              [fileId]: newVol
                            }));
                            if (newVol > 0) {
                              setMutedVideos(prev => ({
                                ...prev,
                                [fileId]: false
                              }));
                            }
                          }}
                          className="flex-1 accent-cyan-500 bg-white/10 h-1 rounded cursor-pointer"
                        />
                        <span className="text-[9px] font-mono text-gray-400 w-8 text-right shrink-0">
                          {isMuted ? "Muted" : `${Math.round(vol * 100)}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedFile ? (
            // Active file editor view
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5 mb-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="flex items-center gap-1 hover:text-cyan-400 transition cursor-pointer text-gray-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to directory</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-500">{selectedFile.name}</span>
                  {selectedFile.type !== "video" && (
                    <button
                      onClick={handleSaveFile}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500 text-black font-bold text-[10px] hover:bg-cyan-400 transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> SAVE
                    </button>
                  )}
                </div>
              </div>

              {selectedFile.type === "video" ? (
                <div className="flex-1 flex flex-col min-h-0 bg-black/40 rounded-xl border border-white/5 p-3 overflow-hidden justify-between relative">
                  <video
                    src={selectedFile.content}
                    autoPlay
                    controls
                    playsInline
                    className="w-full flex-1 object-contain bg-zinc-950 rounded-lg max-h-[220px]"
                    ref={(el) => {
                      if (el) {
                        const fileId = selectedFile.id;
                        const vol = videoVolumes[fileId] !== undefined ? videoVolumes[fileId] : 0.8;
                        const isMuted = mutedVideos[fileId] !== undefined ? mutedVideos[fileId] : false;
                        el.volume = vol;
                        el.muted = isMuted;
                      }
                    }}
                  />
                  
                  {/* Dedicated Volume Slider & Mute Toggle */}
                  <div className="mt-3 flex items-center justify-between gap-4 bg-white/[0.03] border border-white/5 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const fileId = selectedFile.id;
                          setMutedVideos(prev => ({
                            ...prev,
                            [fileId]: !(prev[fileId] !== undefined ? prev[fileId] : false)
                          }));
                        }}
                        className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer text-gray-300 hover:text-white"
                        title={mutedVideos[selectedFile.id] ? "Unmute" : "Mute"}
                      >
                        {mutedVideos[selectedFile.id] ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        Volume: {mutedVideos[selectedFile.id] ? "Muted" : `${Math.round((videoVolumes[selectedFile.id] !== undefined ? videoVolumes[selectedFile.id] : 0.8) * 100)}%`}
                      </span>
                    </div>

                    <div className="flex-1 max-w-[200px] flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={mutedVideos[selectedFile.id] ? 0 : (videoVolumes[selectedFile.id] !== undefined ? videoVolumes[selectedFile.id] : 0.8)}
                        onChange={(e) => {
                          const newVol = parseFloat(e.target.value);
                          const fileId = selectedFile.id;
                          setVideoVolumes(prev => ({
                            ...prev,
                            [fileId]: newVol
                          }));
                          if (newVol > 0) {
                            setMutedVideos(prev => ({
                              ...prev,
                              [fileId]: false
                            }));
                          }
                        }}
                        className="w-full accent-cyan-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Media Player Active (Autoplayed)</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 animate-pulse">
                      Playing
                    </span>
                  </div>
                </div>
              ) : (
                <textarea
                  value={fileEditorContent}
                  onChange={(e) => setFileEditorContent(e.target.value)}
                  className="flex-1 p-3 rounded-lg bg-black/60 border border-white/5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-500/50 resize-none min-h-0"
                  placeholder="Type file content here..."
                />
              )}
            </div>
          ) : (
            // Standard file list view
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Workspace Directory: /desktop/files</span>
                <div className="flex gap-2">
                  {files.some(f => f.type === "video") && (
                    <button
                      onClick={() => setViewAllVideos(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] uppercase font-bold hover:bg-emerald-500/20 transition cursor-pointer text-emerald-400"
                    >
                      <Video className="w-3.5 h-3.5 animate-pulse" /> Play All Videos
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewFileDialog(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase font-bold hover:bg-white/10 transition cursor-pointer text-cyan-300"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create File
                  </button>
                </div>
              </div>

              {/* Create new file form */}
              {showNewFileDialog && (
                <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/15 flex gap-2 items-center mb-3">
                  <input
                    type="text"
                    placeholder="e.g. video.mp4, index.ts, notes.txt"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded bg-black/50 border border-cyan-500/30 text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      if (!newFileName.trim()) return;
                      const name = newFileName;
                      const type = name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov") ? "video" : name.endsWith(".json") ? "json" : name.endsWith(".js") || name.endsWith(".ts") ? "code" : "text";
                      const newFile: FileNode = {
                        id: "file_" + Date.now(),
                        name,
                        content: type === "video" ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" : `// Created by Rajesh on ${new Date().toLocaleDateString()}\n\n`,
                        type,
                        size: 50,
                        createdAt: new Date().toISOString()
                      };
                      setFiles([...files, newFile]);
                      setNewFileName("");
                      setShowNewFileDialog(false);
                      addNotification("File Created", `Successfully initialized ${name} on system registry.`, "success");
                    }}
                    className="px-3 h-8 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded cursor-pointer"
                  >
                    ADD
                  </button>
                  <button
                    onClick={() => setShowNewFileDialog(false)}
                    className="px-2 h-8 hover:bg-white/5 rounded text-gray-400"
                  >
                    CANCEL
                  </button>
                </div>
              )}

              {/* Grid or table listing */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {files.length > 0 ? (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="group p-2.5 rounded-xl hover:bg-white/5 flex items-center justify-between transition"
                    >
                      <button
                        onClick={() => {
                          setSelectedFile(file);
                          setFileEditorContent(file.content);
                        }}
                        className="flex items-center gap-3 text-left flex-1 cursor-pointer min-w-0"
                      >
                        {file.type === "video" ? (
                          <Video className="w-5 h-5 text-emerald-400" />
                        ) : file.type === "json" || file.type === "code" ? (
                          <FileCode className="w-5 h-5 text-purple-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-cyan-400" />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold truncate">{file.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {file.size} bytes • {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic p-6 text-center">Your file tree is empty. Create a file above!</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Shell console */}
      {activeTab === "terminal" && (
        <div className="flex-1 flex flex-col min-h-0 bg-black/90 p-3 rounded-xl border border-white/5 font-mono text-[11px] text-cyan-400">
          <div className="flex-1 overflow-y-auto space-y-1 select-text scrollbar-thin mb-2">
            {terminalLogs.map((log, i) => (
              <pre key={i} className="whitespace-pre-wrap font-mono leading-relaxed">{log}</pre>
            ))}
          </div>
          <form onSubmit={handleTerminalSubmit} className="flex gap-2 border-t border-cyan-500/20 pt-2.5">
            <span className="text-cyan-300 select-none">{`maya@terminal:~$`}</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="flex-1 bg-transparent border-none text-cyan-100 focus:outline-none focus:ring-0 font-mono text-[11px]"
              autoFocus
              placeholder="e.g., 'help', 'ls', 'system'"
            />
          </form>
        </div>
      )}

      {/* Recycle Bin Tab */}
      {activeTab === "recycle" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Recycled Waste Items ({deletedFiles.length})</span>
            {deletedFiles.length > 0 && (
              <button
                onClick={handleEmptyBin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-400 font-bold hover:text-rose-300 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> EMPTY BIN
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {deletedFiles.length > 0 ? (
              deletedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-2 rounded-xl hover:bg-white/5 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3 text-left">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <h4 className="font-semibold text-gray-400">{file.name}</h4>
                      <span className="text-[9px] text-gray-500 font-mono">{file.size} bytes</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreFile(file.id)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-white/10 hover:border-cyan-500/20 rounded font-semibold text-[10px] transition cursor-pointer"
                  >
                    RESTORE
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 italic">No waste files in the Recycle Bin.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
