export type DesktopTheme = "glass" | "dark" | "light" | "neon" | "cyberpunk" | "amoled";

export interface DesktopIcon {
  id: string;
  name: string;
  type: "app" | "folder" | "file" | "widget";
  icon: string; // Lucide icon name
  x: number;
  y: number;
  appId?: string; // e.g. "notes", "explorer", "phone", "music", "security"
  fileId?: string; // reference to a FileNode ID
  folderId?: string; // reference to a DesktopFolder ID
}

export interface DesktopFolder {
  id: string;
  name: string;
  iconIds: string[]; // List of icon IDs contained inside this folder
}

export interface Note {
  id: string;
  title: string;
  content: string;
  completed: boolean; // For checklist items
  createdAt: string;
  reminderTime?: string; // optional ISO string
}

export interface FileNode {
  id: string;
  name: string;
  content: string;
  type: "text" | "json" | "code" | "log" | "video";
  size: number;
  createdAt: string;
}

export interface Alarm {
  id: string;
  time: string; // e.g. "08:30"
  label: string;
  active: boolean;
  days: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
}

export interface Timer {
  id: string;
  duration: number; // total duration in seconds
  remaining: number; // remaining seconds
  active: boolean;
  label: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  timestamp: string;
  read: boolean;
}

export interface PhoneState {
  wifiOn: boolean;
  bluetoothOn: boolean;
  flashlightOn: boolean;
  brightness: number; // 0 to 100
  volume: number; // 0 to 100
  systemVolume: number; // 0 to 100
  batteryLevel: number;
  ramUsage: number; // simulated RAM usage %
  isCharging: boolean;
  cameraActive: boolean;
}
