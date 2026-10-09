/**
 * Types for ISTIKHAR AI Assistant Architecture
 */

export type TaskStatus = 
  | 'idle' 
  | 'understanding' 
  | 'planning' 
  | 'performing' 
  | 'completed' 
  | 'failed';

export type CapabilityType = 
  | 'web_functional'            // Fully executed in Web Prototype (notes, calculations, info, audio)
  | 'native_android_required'  // Requires Android APK (AccessibilityService, System Settings, SMS, 3rd party apps)
  | 'simulated_fallback';

export interface TaskStep {
  id: string;
  label: string;
  detail?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  requiresNativeAndroid?: boolean;
  nativeRequirementType?: string; // e.g. "AccessibilityService", "android.permission.WRITE_SETTINGS"
}

export interface AndroidIntentPayload {
  action: string;
  category?: string;
  dataUri?: string;
  component?: string;
  extras?: Record<string, any>;
  requiredPermission?: string;
  requiredService?: 'AccessibilityService' | 'NotificationListener' | 'DeviceAdmin' | 'ForegroundService' | 'ActivityResultLauncher' | 'MediaStoreContentResolver' | 'PackageManager';
}

export interface TaskMeta {
  taskId: string;
  intent: string;
  capability: CapabilityType;
  steps: TaskStep[];
  startTime: number;
  completedTime?: number;
  nativeIntentPayload?: AndroidIntentPayload;
  failureReason?: string;
  searchUrl?: string;
  usedGeminiServer?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  taskMeta?: TaskMeta;
  audioSpoken?: boolean;
}

export interface TaskRecord {
  id: string;
  command: string;
  response: string;
  timestamp: number;
  status: 'completed' | 'failed';
  intent: string;
  capability: CapabilityType;
  steps: TaskStep[];
  failureReason?: string;
  nativeIntentPayload?: AndroidIntentPayload;
  searchUrl?: string;
  usedGeminiServer?: boolean;
}

export interface AssistantSettings {
  language: 'hi' | 'en'; // 'hi' = Hindi (default), 'en' = English
  voiceResponseEnabled: boolean;
  speechRate: number; // 0.8 - 1.4
  speechPitch: number; // 0.8 - 1.2
  hapticFeedback: boolean;
  autoListenAfterResponse: boolean;
  geminiModel: string;
  selectedVoiceURI: string;
  mockNativeBridge: boolean; // simulate bridge response rejection
}
