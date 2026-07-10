import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Play, 
  RefreshCw, 
  FileCode, 
  Settings, 
  MessageSquare, 
  Phone, 
  Bell, 
  BookOpen, 
  Smartphone, 
  Activity, 
  Wifi, 
  CheckCircle,
  AlertCircle,
  Code
} from "lucide-react";
import { PhoneState, SystemNotification, Note } from "../types";

interface PythonConsoleAppProps {
  phoneState: PhoneState;
  setPhoneState: React.Dispatch<React.SetStateAction<PhoneState>>;
  addNotification: (title: string, message: string, type: "info" | "success" | "warning" | "alert") => void;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  accentText: string;
}

interface ScriptTemplate {
  id: string;
  title: string;
  icon: any;
  description: string;
  code: string;
  targetApp: string;
}

export default function PythonConsoleApp({
  phoneState,
  setPhoneState,
  addNotification,
  notes,
  setNotes,
  accentText
}: PythonConsoleAppProps) {
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [selectedScriptId, setSelectedScriptId] = useState<string>("whatsapp");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [customCode, setCustomCode] = useState<string>(`# Zoya Python Automation Custom Playground
import zoya
import time

def main():
    print("[INIT] Launching Jarvis Custom Agent...")
    time.sleep(1)
    
    # Send custom message
    zoya.whatsapp.send_message(
        to="Subas", 
        message="Hey Mr. Patra! Custom sandbox code running successfully. 🤓"
    )
    
    # Enable hardware accelerators
    zoya.system.set_wifi(True)
    zoya.system.set_flashlight(True)
    
    # Log note task
    zoya.system.create_note(
        title="Python Task Executed",
        content="Custom Automation Script executed successfully on Zoya Premium Engine"
    )

if __name__ == "__main__":
    main()`);

  const templates: ScriptTemplate[] = [
    {
      id: "whatsapp",
      title: "WhatsApp Automator",
      icon: MessageSquare,
      description: "Auto-sends messages to Subas and handles automatic WhatsApp status reports.",
      code: `import zoya
import time

def auto_whatsapp():
    print("[ZOYA-OS] Initializing WhatsApp Core Interface...")
    time.sleep(1)
    
    # Scan WhatsApp unread notifications
    print("[ZOYA-OS] Scanning unread conversations...")
    
    # Send premium voice/text response
    success = zoya.whatsapp.send_message(
        to="Subas (Mr. Patra)", 
        message="Zoya AI: Hey Subas, WhatsApp message successfully dispatched! I am active and ready. 🔥"
    )
    
    if success:
        print("[SUCCESS] Message delivered successfully over secure websocket channel.")
    else:
        print("[ERROR] Failed to send message.")

auto_whatsapp()`,
      targetApp: "whatsapp"
    },
    {
      id: "dialer",
      title: "Call Dialer Controller",
      icon: Phone,
      description: "Automate call dialing, auto-reply triggers, and hardware audio system diagnostics.",
      code: `import zoya
import time

def dialer_automation():
    print("[HARDWARE] Initiating call dialer sequence...")
    time.sleep(1)
    
    # Set premium volume to 100% for crisp audio response
    zoya.phone.set_volume(100)
    
    # Dial custom hotline
    zoya.phone.dial_call(number="+91 94391-xxxxx")
    print("[DIALER] Dialing +91 94391-xxxxx (Human Sagar Odia Special Studio)...")
    
    # Trigger auto-reply on call receiving
    zoya.phone.register_auto_reply(
        trigger="on_missed_call",
        reply_message="Hello, Subas is currently working on DIY hardware module. Zoya Assistant will reply shortly!"
    )
    print("[ZOYA-OS] Auto-reply service registered.")

dialer_automation()`,
      targetApp: "dialer"
    },
    {
      id: "notifications",
      title: "Notification Cleaner & Reply",
      icon: Bell,
      description: "Monitors, fetches, and automatically responds to all active system notifications.",
      code: `import zoya
import time

def clean_and_reply_notifications():
    print("[MONITOR] Fetching system notifications pipeline...")
    time.sleep(1)
    
    unread = zoya.system.get_unread_notifications()
    print(f"[MONITOR] Found {len(unread)} active notifications.")
    
    # Process notifications
    for notif in unread:
        print(f"[REPLYING] Autoreply to notification: '{notif['title']}'")
        zoya.whatsapp.send_message(
            to="Subas", 
            message=f"Zoya Handled: Received call/msg from '{notif['title']}'. Replying with smart automated AI logic."
        )
    
    # Purge/Clean notifications
    zoya.system.clear_all_notifications()
    print("[SUCCESS] All system notifications cleared successfully.")

clean_and_reply_notifications()`,
      targetApp: "notifications"
    },
    {
      id: "scheduler",
      title: "Daily Food & Tea Scheduler",
      icon: BookOpen,
      description: "Automate notes updating, schedules creation, and health alerts for tea time.",
      code: `import zoya
import time

def food_tea_scheduler():
    print("[SCHEDULER] Opening Notes and Checklist API...")
    time.sleep(1)
    
    # Set schedule items
    zoya.system.create_note(
        title="Odia Special Tea Time",
        content="Hot Ginger Tea with crisp Odia Samosa (05:30 PM IST) with Human Sagar's music loop"
    )
    
    zoya.system.create_note(
        title="DIY Hardware Hackathon",
        content="Calibrating local audio module, speaker pin config, and Zoya voice diagnostics"
    )
    
    print("[ZOYA-OS] Scheduled notes successfully populated to Notes & Tasks dashboard!")

food_tea_scheduler()`,
      targetApp: "scheduler"
    }
  ];

  const currentScriptCode = selectedScriptId === "custom" 
    ? customCode 
    : templates.find(t => t.id === selectedScriptId)?.code || "";

  const handleRunScript = () => {
    setIsRunning(true);
    setConsoleLogs([]);
    
    const targetScriptId = selectedScriptId;
    const isCustom = targetScriptId === "custom";

    // Build incremental realistic console logging experience
    const steps = [
      ">>> python3 -m zoya_engine_sandbox run",
      "[SANDBOX] Verifying virtual environment... OK",
      "[SANDBOX] Linking Zoya System Core DLL... Active",
      `[ZOYA-API] Authenticating session for User: Subas (bmr537214@gmail.com)`,
    ];

    let delay = 0;
    steps.forEach((log, index) => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, log]);
      }, delay);
      delay += 400;
    });

    // Run custom code actions or template actions
    setTimeout(() => {
      if (isCustom) {
        setConsoleLogs(prev => [
          ...prev,
          "[RUNNING] Custom Script Playground started...",
          "[PYTHON] zoya.whatsapp.send_message(to='Subas', message='Hey Mr. Patra! Custom sandbox code...')",
          "[SUCCESS] WhatsApp broadcast sent to Subas! ✅",
          "[PYTHON] zoya.system.set_wifi(True)",
          "[HARDWARE] Wi-Fi Interface State -> ON",
          "[PYTHON] zoya.system.set_flashlight(True)",
          "[HARDWARE] LED Flashlight Toggle -> ON",
          "[SUCCESS] Script executed with code 0 (Process completed successfully)."
        ]);

        // Apply side effects
        setPhoneState(prev => ({ ...prev, wifiOn: true, flashlightOn: true }));
        addNotification("WhatsApp Sent via Python", "Zoya custom script dispatched message: 'Hey Mr. Patra! Custom sandbox code running...'", "success");
        
        const newNote: Note = {
          id: "note_py_" + Date.now(),
          title: "Python Task Executed",
          content: "Custom Automation Script executed successfully on Zoya Premium Engine at " + new Date().toLocaleTimeString(),
          completed: false,
          createdAt: new Date().toISOString()
        };
        setNotes(prev => [newNote, ...prev]);

      } else {
        switch (targetScriptId) {
          case "whatsapp":
            setConsoleLogs(prev => [
              ...prev,
              "[RUNNING] WhatsApp Automator started...",
              "[ZOYA-OS] Scanning unread conversations...",
              "[PYTHON] zoya.whatsapp.send_message(to='Subas (Mr. Patra)', ...)",
              "[SUCCESS] WhatsApp message sent to Subas! ✅",
              "[ZOYA-OS] Logged message payload locally.",
              "[SUCCESS] Script executed with code 0."
            ]);
            addNotification(
              "WhatsApp Automated", 
              "Zoya: Hey Subas, WhatsApp message successfully dispatched! I am active and ready. 🔥", 
              "success"
            );
            break;

          case "dialer":
            setConsoleLogs(prev => [
              ...prev,
              "[RUNNING] Call Dialer Controller started...",
              "[PYTHON] zoya.phone.set_volume(100)",
              "[HARDWARE] Media Volume set to 100%",
              "[PYTHON] zoya.phone.dial_call(number='+91 94391-xxxxx')",
              "[DIALER] Dialing Human Sagar special hotlines... 📞",
              "[PYTHON] zoya.phone.register_auto_reply(trigger='on_missed_call', ...)",
              "[ZOYA-OS] Registered Missed Call Auto-Reply: 'Hello, Subas is working on DIY hardware...' 🟢",
              "[SUCCESS] Script executed with code 0."
            ]);
            setPhoneState(prev => ({ ...prev, volume: 100 }));
            addNotification(
              "Python Dialer Hook", 
              "Auto-Reply Registered & Volume set to 100% for Human Sagar playback! 📞", 
              "info"
            );
            break;

          case "notifications":
            setConsoleLogs(prev => [
              ...prev,
              "[RUNNING] Notification Cleaner & Reply started...",
              "[MONITOR] Fetching system notifications pipeline...",
              "[MONITOR] Found 2 unread system alerts.",
              "[PYTHON] zoya.whatsapp.send_message(to='Subas', message='Zoya Handled: Received call/msg...')",
              "[SUCCESS] Sent 2 automations replies to Subas on WhatsApp! ✅",
              "[PYTHON] zoya.system.clear_all_notifications()",
              "[SUCCESS] Cleared active notification center stack.",
              "[SUCCESS] Script executed with code 0."
            ]);
            addNotification(
              "Python Notification Handler", 
              "Notifications successfully processed & auto-replied! System alerts flushed. 🧼", 
              "success"
            );
            break;

          case "scheduler":
            setConsoleLogs(prev => [
              ...prev,
              "[RUNNING] Daily Food & Tea Scheduler started...",
              "[PYTHON] zoya.system.create_note(title='Odia Special Tea Time', ...)",
              "[DATABASE] Injected: 'Odia Special Tea Time' to local Firestore DB.",
              "[PYTHON] zoya.system.create_note(title='DIY Hardware Hackathon', ...)",
              "[DATABASE] Injected: 'DIY Hardware Hackathon' to local Firestore DB.",
              "[SUCCESS] Note tasks registered inside desktop manager! ✅",
              "[SUCCESS] Script executed with code 0."
            ]);
            
            const scheduleNote1: Note = {
              id: "note_py_sched1_" + Date.now(),
              title: "Odia Special Tea Time",
              content: "Hot Ginger Tea with crisp Odia Samosa (05:30 PM IST) with Human Sagar's music loop",
              completed: false,
              createdAt: new Date().toISOString()
            };
            const scheduleNote2: Note = {
              id: "note_py_sched2_" + Date.now(),
              title: "DIY Hardware Hackathon",
              content: "Calibrating local audio module, speaker pin config, and Zoya voice diagnostics",
              completed: false,
              createdAt: new Date().toISOString()
            };
            setNotes(prev => [scheduleNote1, scheduleNote2, ...prev]);
            addNotification(
              "Python Scheduler", 
              "Schedules successfully populated to Notes & Tasks dashboard! ☕", 
              "success"
            );
            break;
            
          default:
            break;
        }
      }
      setIsRunning(false);
    }, delay + 600);
  };

  return (
    <div className="flex flex-col h-full text-xs font-sans text-gray-100">
      {/* App Header Bar with Jarvis Diagnostic stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 mb-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <span className="font-bold text-[11px] block text-white font-mono tracking-tight uppercase">Zoya Jarvis Python Code Engine</span>
            <span className="text-[9px] text-gray-400 font-mono">Interactive Hardware Automation Core (Python 3.11)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[9px]">
          <div className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full text-cyan-400">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <span>JARVIS HOOK: ACTIVE</span>
          </div>
          <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-full text-emerald-400">
            <span>SANDBOX OK</span>
          </div>
        </div>
      </div>

      {/* Main Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
        
        {/* Left Side: Script templates list */}
        <div className="lg:col-span-4 flex flex-col gap-2 min-h-0">
          <div className="flex gap-2 mb-1 border-b border-white/5 pb-1 text-[10px]">
            <button
              onClick={() => setActiveTab("templates")}
              className={`pb-1 px-1 font-bold font-mono uppercase tracking-wider ${activeTab === "templates" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-white"}`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab("help")}
              className={`pb-1 px-1 font-bold font-mono uppercase tracking-wider ${activeTab === "help" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-white"}`}
            >
              API Reference
            </button>
          </div>

          {activeTab === "templates" ? (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {templates.map(script => {
                const Icon = script.icon;
                const isSelected = selectedScriptId === script.id;
                return (
                  <button
                    key={script.id}
                    onClick={() => setSelectedScriptId(script.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      isSelected 
                        ? "bg-cyan-500/10 border-cyan-500/30 text-white" 
                        : "bg-white/[0.01] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-gray-400"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[10.5px] font-mono">{script.title}</span>
                        {isSelected && <span className="text-[8px] uppercase px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 rounded font-bold font-mono">Selected</span>}
                      </div>
                      <p className="text-[9px] text-gray-400 leading-tight mt-0.5 truncate">{script.description}</p>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setSelectedScriptId("custom")}
                className={`w-full p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  selectedScriptId === "custom" 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-white" 
                    : "bg-white/[0.01] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 ${selectedScriptId === "custom" ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-gray-400"}`}>
                  <Code className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10.5px] font-mono">Custom Sandbox IDE</span>
                    {selectedScriptId === "custom" && <span className="text-[8px] uppercase px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 rounded font-bold font-mono">Custom</span>}
                  </div>
                  <p className="text-[9px] text-gray-400 leading-tight mt-0.5">Write custom python scripts and run real-time hardware automations.</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 bg-black/40 border border-white/5 p-3 rounded-xl font-mono text-[9px] leading-relaxed text-gray-300">
              <span className="text-cyan-300 font-bold block uppercase border-b border-white/5 pb-1 text-[10px] tracking-wider mb-2">Import zoya</span>
              
              <div className="space-y-2">
                <div>
                  <span className="text-purple-400 block font-bold">zoya.whatsapp.send_message()</span>
                  <span className="text-gray-400 block pl-2">Parameters: to: str, message: str</span>
                  <span className="text-gray-500 block pl-2">Sends a whatsapp message to any contact on the Zoya network.</span>
                </div>
                
                <div>
                  <span className="text-purple-400 block font-bold">zoya.phone.dial_call()</span>
                  <span className="text-gray-400 block pl-2">Parameters: number: str</span>
                  <span className="text-gray-500 block pl-2">Triggers call dialer dashboard with premium audio volume.</span>
                </div>

                <div>
                  <span className="text-purple-400 block font-bold">zoya.system.create_note()</span>
                  <span className="text-gray-400 block pl-2">Parameters: title: str, content: str</span>
                  <span className="text-gray-500 block pl-2">Saves structured tasks or meals/tea scheduling to Notes.</span>
                </div>

                <div>
                  <span className="text-purple-400 block font-bold">zoya.system.set_wifi()</span>
                  <span className="text-gray-400 block pl-2">Parameters: state: bool</span>
                  <span className="text-gray-500 block pl-2">Enables/disables the Simulated Wi-Fi antenna feed.</span>
                </div>

                <div>
                  <span className="text-purple-400 block font-bold">zoya.system.set_flashlight()</span>
                  <span className="text-gray-400 block pl-2">Parameters: state: bool</span>
                  <span className="text-gray-500 block pl-2">Triggers the simulated camera hardware LED flashlight.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Code Editor Container & Interactive Terminal Console */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          
          {/* Visual Python Code Editor Block */}
          <div className="flex-1 flex flex-col bg-black/60 border border-white/5 rounded-xl overflow-hidden min-h-[160px] relative">
            <div className="flex justify-between items-center bg-zinc-950/80 px-3 py-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-[9px] text-gray-300 font-bold">
                  {selectedScriptId === "custom" ? "custom_playground.py" : `${selectedScriptId}_automator.py`}
                </span>
              </div>
              <button
                onClick={handleRunScript}
                disabled={isRunning}
                className={`flex items-center gap-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-[9.5px] rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer ${
                  isRunning ? "opacity-50 cursor-not-allowed animate-pulse" : ""
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{isRunning ? "RUNNING..." : "RUN PYTHON CODE"}</span>
              </button>
            </div>

            {selectedScriptId === "custom" ? (
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="flex-1 w-full bg-[#0a0a0f] p-3 font-mono text-[9.5px] text-emerald-400 placeholder-zinc-600 focus:outline-none resize-none overflow-y-auto leading-normal"
                spellCheck={false}
              />
            ) : (
              <pre className="flex-1 w-full bg-[#07070a] p-3 font-mono text-[9.5px] text-cyan-300 overflow-y-auto leading-normal whitespace-pre-wrap select-text">
                {currentScriptCode}
              </pre>
            )}

            <div className="absolute bottom-2 right-3 font-mono text-[8px] text-gray-500 bg-black/60 px-1.5 py-0.5 rounded border border-white/5">
              UTF-8 | Python 3.11.2
            </div>
          </div>

          {/* Terminal output console */}
          <div className="h-[120px] bg-black border border-white/5 rounded-xl overflow-hidden flex flex-col font-mono text-[9px]">
            <div className="flex justify-between items-center bg-zinc-950 px-3 py-1.5 border-b border-white/5">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Sandbox Terminal Logs</span>
              <button 
                onClick={() => setConsoleLogs([])}
                className="text-gray-500 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="text-[8px]">Clear</span>
              </button>
            </div>
            
            <div className="flex-1 p-2.5 overflow-y-auto space-y-1 bg-[#050508] select-text">
              {consoleLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 text-[8.5px]">
                  <span>[IDLE] Select any automation template above and click "RUN PYTHON CODE" to test Jarvis integrations.</span>
                </div>
              ) : (
                consoleLogs.map((log, idx) => {
                  let colorClass = "text-gray-300";
                  if (log.startsWith("[SUCCESS]")) colorClass = "text-emerald-400 font-bold";
                  if (log.startsWith("[ERROR]")) colorClass = "text-rose-400 font-bold";
                  if (log.startsWith("[ZOYA")) colorClass = "text-cyan-400 font-bold";
                  if (log.startsWith("[HARDWARE]")) colorClass = "text-yellow-400 font-bold";
                  if (log.startsWith(">>>")) colorClass = "text-cyan-300 opacity-60";

                  return (
                    <div key={idx} className={`${colorClass} leading-tight`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
