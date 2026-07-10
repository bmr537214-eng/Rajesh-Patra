import React, { useState, useEffect } from "react";
import { 
  FileText, 
  CheckSquare, 
  Clock, 
  Plus, 
  Trash, 
  Calendar, 
  Bell, 
  Timer as TimerIcon, 
  Play, 
  Pause, 
  Check, 
  VolumeX, 
  TrendingUp, 
  X,
  FileEdit
} from "lucide-react";
import { Note, Alarm, Timer } from "../types";

interface NotesToDoAppProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  alarms: Alarm[];
  setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>>;
  timers: Timer[];
  setTimers: React.Dispatch<React.SetStateAction<Timer[]>>;
  addNotification: (title: string, message: string, type: "info" | "success" | "warning" | "alert") => void;
  accentText: string;
}

export default function NotesToDoApp({
  notes,
  setNotes,
  alarms,
  setAlarms,
  timers,
  setTimers,
  addNotification,
  accentText
}: NotesToDoAppProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "tasks" | "alarms" | "timers">("notes");
  
  // Note formulation states
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Alarm state
  const [newAlarmTime, setNewAlarmTime] = useState("08:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("Assam Tea reminder");

  // Timer state
  const [newTimerDuration, setNewTimerDuration] = useState("60"); // default 60s
  const [newTimerLabel, setNewTimerLabel] = useState("Tea brewing loop");

  // Handle Note actions
  const handleAddNote = () => {
    if (!newNoteTitle.trim()) return;
    const note: Note = {
      id: "note_" + Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setNotes([note, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    addNotification("Note Added", `Registered note "${note.title}" on database.`, "success");
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    addNotification("Note Deleted", "Removed note from local workspace.", "warning");
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const toggleTaskCompleted = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  };

  // Alarm actions
  const handleAddAlarm = () => {
    const alarm: Alarm = {
      id: "alarm_" + Date.now(),
      time: newAlarmTime,
      label: newAlarmLabel || "Maya Alert",
      active: true,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
    };
    setAlarms([...alarms, alarm]);
    setNewAlarmLabel("");
    addNotification("Alarm Set", `Simulated Alarm configured for ${newAlarmTime} Daily.`, "success");
  };

  const toggleAlarmActive = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
    addNotification("Alarm Deleted", "Removed alarm hook.", "warning");
  };

  // Timer actions
  const handleAddTimer = () => {
    const duration = parseInt(newTimerDuration);
    if (isNaN(duration) || duration <= 0) return;
    const timer: Timer = {
      id: "timer_" + Date.now(),
      duration,
      remaining: duration,
      active: true,
      label: newTimerLabel || "Timer task"
    };
    setTimers([...timers, timer]);
    setNewTimerLabel("");
    addNotification("Timer Started", `Ticking loop registered for ${duration} seconds.`, "success");
  };

  const toggleTimerActive = (id: string) => {
    setTimers(timers.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const handleDeleteTimer = (id: string) => {
    setTimers(timers.filter(t => t.id !== id));
  };

  // Run countdown loop for timers
  useEffect(() => {
    const tick = setInterval(() => {
      setTimers((prevTimers) => {
        let updated = false;
        const next = prevTimers.map((t) => {
          if (t.active && t.remaining > 0) {
            updated = true;
            const rem = t.remaining - 1;
            if (rem === 0) {
              // Timer Finished! Triggers notification
              addNotification("Timer Finished!", `Timer loops: "${t.label}" completed.`, "alert");
              return { ...t, remaining: 0, active: false };
            }
            return { ...t, remaining: rem };
          }
          return t;
        });
        return updated ? next : prevTimers;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [setTimers, addNotification]);

  const completedCount = notes.filter(n => n.completed).length;
  const progressPercent = notes.length > 0 ? Math.round((completedCount / notes.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full text-xs font-sans">
      {/* Top Navigation */}
      <div className="flex gap-2 border-b border-white/5 pb-2 mb-3">
        {[
          { id: "notes", label: "Notes Ledger", icon: FileText },
          { id: "tasks", label: "Checklists", icon: CheckSquare },
          { id: "alarms", label: "Alarms Manager", icon: Bell },
          { id: "timers", label: "Countdown Timers", icon: TimerIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition cursor-pointer ${
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

      {/* Notes View */}
      {activeTab === "notes" && (
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Note Formulator */}
          <div className="w-[180px] bg-white/[0.01] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider font-bold">Compose Note</span>
              <input
                type="text"
                placeholder="Note Title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
              <textarea
                placeholder="Write body..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full h-24 p-2.5 rounded bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
              />
              <button
                onClick={handleAddNote}
                className="w-full h-8 rounded bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400 transition cursor-pointer text-[10px]"
              >
                SAVE NOTE
              </button>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 relative group hover:border-white/10 transition"
                >
                  <div className="flex justify-between items-start mb-1 pr-6">
                    <h4 className="font-bold text-[12px]">{note.title}</h4>
                    <span className="text-[8px] font-mono opacity-50">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="absolute top-2.5 right-2.5 p-1 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic p-6 text-center">Your notes ledger is empty. Compose one on the left!</p>
            )}
          </div>
        </div>
      )}

      {/* Checklists View */}
      {activeTab === "tasks" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress Console */}
          <div className="p-3.5 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.02] mb-3 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs">Progress Overview</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">{completedCount} of {notes.length} goals completed</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 flex items-center justify-center font-mono text-xs font-bold relative">
              <span className={accentText}>{progressPercent}%</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => toggleTaskCompleted(note.id)}
                className="p-2.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center gap-3 transition cursor-pointer"
              >
                <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition ${
                  note.completed 
                    ? "bg-cyan-500 border-cyan-400 text-black" 
                    : "border-white/25"
                }`}>
                  {note.completed && <Check className="w-3.5 h-3.5 font-bold" />}
                </div>
                <div className="flex-1">
                  <span className={`text-[11.5px] ${note.completed ? "line-through text-gray-500" : "text-white"}`}>{note.title}</span>
                  {note.content && (
                    <p className={`text-[10px] truncate max-w-sm ${note.completed ? "text-gray-600" : "text-gray-400"}`}>
                      {note.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-gray-500 italic p-6 text-center">No tasks listed. Add a note to start tracking!</p>
            )}
          </div>
        </div>
      )}

      {/* Alarms Tab */}
      {activeTab === "alarms" && (
        <div className="flex-1 flex gap-3 min-h-0">
          <div className="w-[180px] bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-3">
            <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider font-bold">Add Alarm</span>
            <input
              type="time"
              value={newAlarmTime}
              onChange={(e) => setNewAlarmTime(e.target.value)}
              className="w-full h-8 px-2 rounded bg-black/40 border border-white/10 text-xs text-white"
            />
            <input
              type="text"
              placeholder="e.g. Afternoon Tea"
              value={newAlarmLabel}
              onChange={(e) => setNewAlarmLabel(e.target.value)}
              className="w-full h-8 px-2 rounded bg-black/40 border border-white/10 text-xs text-white"
            />
            <button
              onClick={handleAddAlarm}
              className="w-full h-8 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition cursor-pointer text-[10px]"
            >
              SET ALARM
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {alarms.map(alarm => (
              <div
                key={alarm.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  alarm.active 
                    ? "bg-white/[0.02] border-cyan-500/25" 
                    : "bg-white/[0.01] border-transparent opacity-60"
                }`}
              >
                <div className="text-left">
                  <span className="text-lg font-light font-sans tracking-tight">{alarm.time}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{alarm.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAlarmActive(alarm.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer ${
                      alarm.active 
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300" 
                        : "bg-white/5 border-transparent text-gray-400"
                    }`}
                  >
                    {alarm.active ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => handleDeleteAlarm(alarm.id)}
                    className="p-1 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {alarms.length === 0 && (
              <p className="text-gray-500 italic p-6 text-center">No configured alarms.</p>
            )}
          </div>
        </div>
      )}

      {/* Countdown Timers Tab */}
      {activeTab === "timers" && (
        <div className="flex-1 flex gap-3 min-h-0">
          <div className="w-[180px] bg-white/[0.01] p-3 rounded-xl border border-white/5 space-y-3">
            <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider font-bold">Add Countdown</span>
            <input
              type="number"
              value={newTimerDuration}
              onChange={(e) => setNewTimerDuration(e.target.value)}
              className="w-full h-8 px-2 rounded bg-black/40 border border-white/10 text-xs text-white"
              placeholder="Duration in seconds"
            />
            <input
              type="text"
              placeholder="e.g. Samosa cooking"
              value={newTimerLabel}
              onChange={(e) => setNewTimerLabel(e.target.value)}
              className="w-full h-8 px-2 rounded bg-black/40 border border-white/10 text-xs text-white"
            />
            <button
              onClick={handleAddTimer}
              className="w-full h-8 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition cursor-pointer text-[10px]"
            >
              START TIMER
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {timers.map(timer => {
              const minutes = Math.floor(timer.remaining / 60);
              const seconds = timer.remaining % 60;
              const clockStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
              const percent = Math.round((timer.remaining / timer.duration) * 100);

              return (
                <div
                  key={timer.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between transition"
                >
                  <div className="text-left flex-1 mr-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-base font-light font-sans">{clockStr}</span>
                      <span className="text-[9px] opacity-65 font-mono">{timer.label}</span>
                    </div>
                    {/* Visual countdown progress bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTimerActive(timer.id)}
                      className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                    >
                      {timer.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTimer(timer.id)}
                      className="p-2 rounded hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {timers.length === 0 && (
              <p className="text-gray-500 italic p-6 text-center">No active countdown timers.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
