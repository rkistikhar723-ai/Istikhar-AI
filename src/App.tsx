/**
 * ISTIKHAR AI - Android-First Personal AI Assistant
 * 
 * Premium dark & gold interface with real speech recognition, neural voice synthesis,
 * 5-stage task lifecycle engine, and modular Android Bridge architecture.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VoiceMicrophone } from './components/VoiceMicrophone';
import { ConversationArea } from './components/ConversationArea';
import { CommandInputBar } from './components/CommandInputBar';
import { TaskStatusPanel } from './components/TaskStatusPanel';
import { TaskHistoryScreen } from './components/TaskHistoryScreen';
import { BridgeMatrixScreen } from './components/BridgeMatrixScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { BottomTabBar } from './components/BottomTabBar';

import { 
  TaskStatus, 
  TaskMeta, 
  ChatMessage, 
  TaskRecord, 
  AssistantSettings 
} from './types/assistant';
import { assistantAi } from './services/aiService';
import { androidBridge } from './services/androidBridge';
import { speechService } from './services/speechService';
import { geminiAdapter, GeminiServerStatus } from './services/geminiService';
import { vaultService, AssistantTimer } from './services/vaultService';
import { 
  Sparkles, 
  Smartphone, 
  ShieldCheck, 
  Activity, 
  Layers, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const STORAGE_KEY_HISTORY = 'istikhar_ai_task_history';
const STORAGE_KEY_SETTINGS = 'istikhar_ai_settings';

const DEFAULT_SETTINGS: AssistantSettings = {
  language: 'hi', // Hindi is default
  voiceResponseEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  hapticFeedback: true,
  autoListenAfterResponse: false,
  geminiModel: 'gemini-3.8-flash',
  selectedVoiceURI: '',
  mockNativeBridge: false,
};

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'assistant' | 'task_monitor' | 'history' | 'bridge' | 'settings'>('assistant');

  // Persistent Settings
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const isHindi = settings.language === 'hi';

  // Persistent Task History
  const [taskHistory, setTaskHistory] = useState<TaskRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  // Assistant State
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_msg',
      sender: 'assistant',
      text: `नमस्ते! मैं ISTIKHAR AI हूँ, आपका निजी व्यक्तिगत सहायक जिसे खास तौर पर एंड्रॉइड फोन इकोसिस्टम के लिए तैयार किया गया है।\n\nआप सुनहरे माइक्रोफ़ोन से हिंदी, हिंग्लिश या अंग्रेज़ी में बोल सकते हैं अथवा नीचे टाइप कर सकते हैं। आपके हर निर्देश को 5-चरणीय टास्क मॉनिटर के माध्यम से पारदर्शी रूप से सत्यापित किया जाएगा।`,
      timestamp: Date.now(),
    }
  ]);

  const [currentStatus, setCurrentStatus] = useState<TaskStatus>('idle');
  const [currentTask, setCurrentTask] = useState<TaskMeta | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [activeTimers, setActiveTimers] = useState<any[]>([]);

  // Speech & Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechStatusText, setSpeechStatusText] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Check Gemini Status and Timers on Mount
  useEffect(() => {
    geminiAdapter.refreshStatus().then((status: GeminiServerStatus) => {
      setGeminiConfigured(status.configured);
    });
    const unsub = vaultService.subscribeTimers((timers: AssistantTimer[]) => {
      setActiveTimers(timers);
    });
    return () => unsub();
  }, []);

  // Sync speech service language with settings
  useEffect(() => {
    speechService.setLanguage(settings.language);
  }, [settings.language]);

  // Save settings changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }, [settings]);

  // Save history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(taskHistory));
    } catch (e) {
      // ignore
    }
  }, [taskHistory]);

  // Load browser voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = speechService.getAvailableVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Monitor speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(speechService.isSpeaking());
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Toggle Voice Response
  const handleToggleVoiceResponse = () => {
    const nextVal = !settings.voiceResponseEnabled;
    setSettings((prev) => ({ ...prev, voiceResponseEnabled: nextVal }));
    if (!nextVal) {
      speechService.stopSpeaking();
    }
  };

  // Speak aloud helper
  const speakAssistantText = useCallback((text: string) => {
    if (!settings.voiceResponseEnabled) return;
    speechService.speak(text, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI,
      lang: settings.language,
    });
  }, [settings]);

  // Primary Command Execution Engine (5-Stage Task Lifecycle)
  const executeCommand = async (commandText: string) => {
    if (!commandText.trim() || isProcessing) return;

    const isHindi = settings.language === 'hi';
    setIsProcessing(true);
    setSpeechStatusText(isHindi ? 'कमांड का विश्लेषण किया जा रहा है...' : 'Analyzing command intent...');

    // User message
    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: commandText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const taskId = `task_${Date.now()}`;
    const startTime = Date.now();

    // Stage 1: Understanding command
    setCurrentStatus('understanding');
    setCurrentTask({
      taskId,
      intent: 'PARSING_COMMAND',
      capability: 'web_functional',
      steps: [
        {
          id: 's1',
          label: isHindi ? 'कमांड और संदर्भ की पहचान' : 'Semantic entity extraction',
          status: 'in_progress',
          detail: isHindi ? 'प्राकृतिक भाषा का विश्लेषण' : 'Parsing linguistic patterns',
        },
        {
          id: 's2',
          label: isHindi ? 'इंटेंट वर्गीकरण' : 'Intent classification',
          status: 'pending',
        },
        {
          id: 's3',
          label: isHindi ? 'रनटाइम क्षमता रूटिंग' : 'Runtime capability routing',
          status: 'pending',
        },
      ],
      startTime,
    });

    await new Promise((r) => setTimeout(r, 450));

    // Stage 2: Planning task
    setCurrentStatus('planning');
    setSpeechStatusText(isHindi ? 'कार्य योजना तैयार की जा रही है...' : 'Synthesizing execution plan...');

    const analysis = await assistantAi.analyzeCommand(commandText, settings.language);

    setCurrentTask({
      taskId,
      intent: analysis.intent,
      capability: analysis.capability,
      steps: analysis.steps.map((s, i) => ({
        ...s,
        status: i === 0 ? 'completed' : 'in_progress',
      })),
      startTime,
      nativeIntentPayload: analysis.androidIntentPayload,
    });

    await new Promise((r) => setTimeout(r, 500));

    // Stage 3: Performing task
    setCurrentStatus('performing');
    setSpeechStatusText(isHindi ? 'ब्रिज के माध्यम से कार्य निष्पादन...' : 'Executing task through bridge...');

    await new Promise((r) => setTimeout(r, 600));

    // Stage 4 / 5: Completion or Failure depending on capability
    let finalResponse = '';
    let finalStatus: 'completed' | 'failed' = 'completed';

    if (analysis.capability === 'web_functional') {
      // Functional in Web Prototype
      finalStatus = 'completed';
      setCurrentStatus('completed');
      setSpeechStatusText(isHindi ? 'कार्य सफलतापूर्वक पूर्ण हुआ' : 'Task completed successfully');

      finalResponse = analysis.executableResult || (isHindi ? `कमांड "${commandText}" पूर्ण हुआ।` : `Task "${commandText}" completed successfully.`);

      const completedTaskMeta: TaskMeta = {
        taskId,
        intent: analysis.intent,
        capability: 'web_functional',
        steps: analysis.steps.map((s) => ({ ...s, status: 'completed' })),
        startTime,
        completedTime: Date.now(),
        searchUrl: analysis.searchUrl,
        usedGeminiServer: analysis.usedGeminiServer,
        failureReason: analysis.executableResult,
      };
      setCurrentTask(completedTaskMeta);

      // Record to history
      const historyItem: TaskRecord = {
        id: taskId,
        command: commandText,
        response: finalResponse,
        timestamp: Date.now(),
        status: 'completed',
        intent: analysis.intent,
        capability: 'web_functional',
        steps: completedTaskMeta.steps,
        searchUrl: analysis.searchUrl,
        usedGeminiServer: analysis.usedGeminiServer,
      };
      setTaskHistory((prev) => [historyItem, ...prev]);

      // Assistant Message
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: finalResponse,
          timestamp: Date.now(),
          taskMeta: completedTaskMeta,
        },
      ]);
    } else {
      // Native Android Required - Evaluates real native bridge if available, otherwise truthfully reports requirement
      const bridgeResult = await androidBridge.executeNativeAction(analysis.androidIntentPayload!);

      if (bridgeResult.executed && bridgeResult.success) {
        // Confirmed executed by native Android companion layer
        finalStatus = 'completed';
        setCurrentStatus('completed');
        setSpeechStatusText(isHindi ? 'नेटिव एंड्रॉइड क्रिया सफल' : 'Native action succeeded');

        finalResponse = bridgeResult.actionDetails || (isHindi
          ? `✅ नेटिव एंड्रॉइड क्रिया सफलतापूर्वक निष्पादित हुई:\nकमांड: "${commandText}"\nइंटेंट: ${analysis.androidIntentPayload?.action}`
          : `✅ Native Android action confirmed by system:\nCommand: "${commandText}"\nIntent: ${analysis.androidIntentPayload?.action}`);

        const completedTaskMeta: TaskMeta = {
          taskId,
          intent: analysis.intent,
          capability: 'native_android_required',
          steps: analysis.steps.map((s) => ({ ...s, status: 'completed' })),
          startTime,
          completedTime: Date.now(),
          nativeIntentPayload: analysis.androidIntentPayload,
        };
        setCurrentTask(completedTaskMeta);

        const historyItem: TaskRecord = {
          id: taskId,
          command: commandText,
          response: finalResponse,
          timestamp: Date.now(),
          status: 'completed',
          intent: analysis.intent,
          capability: 'native_android_required',
          steps: completedTaskMeta.steps,
          nativeIntentPayload: analysis.androidIntentPayload,
        };
        setTaskHistory((prev) => [historyItem, ...prev]);

        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: finalResponse,
            timestamp: Date.now(),
            taskMeta: completedTaskMeta,
          },
        ]);
      } else {
        // Native layer failed, confirmation rejected, or running in browser sandbox
        finalStatus = 'failed';
        setCurrentStatus('failed');
        setSpeechStatusText(
          bridgeResult.executed
            ? (isHindi ? 'कार्रवाई अस्वीकार या त्रुटि' : 'Action rejected or error')
            : (isHindi ? 'नेटिव एंड्रॉइड विकास आवश्यक' : 'Native Android development required')
        );

        if (bridgeResult.executed) {
          // Running in native APK, but bridge reported error or user denied confirmation dialog
          finalResponse = isHindi
            ? `⚠️ एंड्रॉइड सिस्टम रिपोर्ट:
कमांड: "${commandText}"
परिणाम: ${bridgeResult.error || 'कार्रवाई पूर्ण नहीं हो सकी।'}`
            : `⚠️ Android System Report:
Command: "${commandText}"
Result: ${bridgeResult.error || 'Action could not be completed.'}`;
        } else {
          // Running in Google AI Studio Web Browser Preview Limitation
          const targetIntentName = analysis.androidIntentPayload?.action || 'Native Intent';
          const targetPkg = analysis.androidIntentPayload?.extras?.packageName;
          const appDetails = targetPkg ? ` (लक्ष्य ऐप: ${targetPkg})` : '';

          finalResponse = isHindi
            ? `⚠️ NOT TESTED [ब्राउज़र पूर्वावलोकन सीमा (Browser Preview Limitation)]:
कमांड: "${commandText}"
टारगेट इंटेंट: ${targetIntentName}${appDetails}

Google AI Studio ब्राउज़र पूर्वावलोकन आपके वास्तविक Android फ़ोन पर स्थापित ऐप्स (जैसे YouTube, Settings, Chrome आदि) को सीधे लॉन्च या नियंत्रित नहीं कर सकता। 

नेटिव Android इंटेंट और Kotlin ब्रिज कोड को ISTIKHAR AI में सफलतापूर्वक जोड़ दिया गया है। वास्तविक Android फ़ोन पर APK स्थापित होने के बाद यह कमांड सीधे डिवाइस पर क्रियान्वित होगी। ब्राउज़र में इस क्रिया को झूठा पास करने के बजाय ईमानदारी से NOT TESTED चिह्नित किया गया है।`
            : `⚠️ NOT TESTED [Browser Preview Limitation]:
Command: "${commandText}"
Target Intent: ${targetIntentName}

The Google AI Studio browser preview cannot directly launch installed Android apps.
The required native Android Kotlin code and Intent Bridge are fully implemented in this project so the feature will execute after APK installation on a real Android device. In accordance with safety rules, this native action is marked NOT TESTED in the web preview rather than simulating success.`;
        }

        const failedTaskMeta: TaskMeta = {
          taskId,
          intent: analysis.intent,
          capability: 'native_android_required',
          steps: analysis.steps,
          startTime,
          completedTime: Date.now(),
          nativeIntentPayload: analysis.androidIntentPayload,
          failureReason: bridgeResult.error || (isHindi ? 'वेब ब्राउज़र सैंडबॉक्स सुरक्षा सीमा' : 'Browser sandbox OS security boundary'),
        };
        setCurrentTask(failedTaskMeta);

        // Record to history
        const historyItem: TaskRecord = {
          id: taskId,
          command: commandText,
          response: finalResponse,
          timestamp: Date.now(),
          status: 'failed',
          intent: analysis.intent,
          capability: 'native_android_required',
          steps: failedTaskMeta.steps,
          failureReason: bridgeResult.error,
          nativeIntentPayload: analysis.androidIntentPayload,
        };
        setTaskHistory((prev) => [historyItem, ...prev]);

        // Assistant Message
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: finalResponse,
            timestamp: Date.now(),
            taskMeta: failedTaskMeta,
          },
        ]);
      }
    }

    // Voice response if enabled
    if (settings.voiceResponseEnabled) {
      const spokenSummary = finalStatus === 'completed'
        ? finalResponse
        : (isHindi
            ? 'इस कमांड के लिए नेटिव एंड्रॉइड विशेषाधिकार आवश्यक हैं। वेब प्रोटोटाइप में भौतिक हार्डवेयर क्रियाओं का झूठा दावा नहीं किया जाता।'
            : 'This command requires native Android development privileges. In this web prototype, device hardware control is not simulated.');
      speakAssistantText(spokenSummary);
    }

    setIsProcessing(false);
  };

  // Microphone toggle handler
  const handleToggleListening = () => {
    const isHindi = settings.language === 'hi';

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setSpeechStatusText('');
      return;
    }

    if (settings.hapticFeedback) {
      speechService.triggerHaptic(40);
    }

    const started = speechService.startListening(
      {
        onStart: () => {
          setIsListening(true);
          setSpeechStatusText(isHindi ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now');
        },
        onResult: (transcript: string, isFinal: boolean) => {
          setSpeechStatusText(`"${transcript}"`);
          if (isFinal && transcript.trim()) {
            setIsListening(false);
            executeCommand(transcript);
          }
        },
        onError: (err: string) => {
          setIsListening(false);
          setSpeechStatusText(err);
        },
        onEnd: () => {
          setIsListening(false);
        },
      },
      settings.language
    );

    if (!started) {
      setSpeechStatusText(isHindi ? 'स्पीच पहचान अनुपलब्ध है' : 'Speech recognition unavailable');
    }
  };

  // Test Voice Synthesis
  const handleTestVoice = () => {
    const testMsg = settings.language === 'hi'
      ? 'यह ISTIKHAR AI है। प्राकृतिक हिंदी वॉइस रिस्पांस सिस्टम पूरी तरह से सक्रिय है।'
      : 'This is ISTIKHAR AI. Neural voice response system is fully active.';

    speechService.speak(testMsg, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.selectedVoiceURI,
      lang: settings.language,
    });
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#F4F4F5] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#FFDF73]">
      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        voiceResponseEnabled={settings.voiceResponseEnabled}
        onToggleVoiceResponse={handleToggleVoiceResponse}
        isListening={isListening}
        isSpeaking={isSpeaking}
        geminiConfigured={geminiConfigured}
        language={settings.language}
      />

      {/* Active Running Timers Banner */}
      {activeTimers.some((t) => t.isRunning || t.isCompleted) && (
        <div className="bg-[#121008] border-b border-[#5C4713] px-4 py-2">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span className="font-semibold text-[#F5D061]">
                {isHindi ? 'सक्रिय टाइमर:' : 'Live Timers:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {activeTimers.map((timer) => (
                  <span
                    key={timer.id}
                    className={`px-2 py-0.5 rounded border font-mono text-[11px] flex items-center gap-1.5 ${
                      timer.isCompleted
                        ? 'bg-rose-950/60 border-rose-800 text-rose-300 animate-pulse'
                        : 'bg-[#1C1709] border-[#D4AF37]/50 text-[#FFF1B8]'
                    }`}
                  >
                    <span>{timer.label}:</span>
                    <strong>{timer.isCompleted ? (isHindi ? 'समय समाप्त!' : 'TIME UP!') : `${timer.remainingSeconds}s`}</strong>
                    <button
                      onClick={() => vaultService.stopTimer(timer.id)}
                      className="ml-1 text-[#A1A1AA] hover:text-white"
                      title={isHindi ? 'टाइमर हटाएं' : 'Dismiss timer'}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto pb-20 md:pb-8 flex flex-col">
        {/* Tab 1: Primary Assistant Interface */}
        {currentTab === 'assistant' && (
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 p-3 sm:p-6 items-stretch">
            {/* Left Column (lg:col-span-7): Voice Hero + Conversation Area + Input */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-[#0A0A0D] border border-[#22222A] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 min-h-[580px]">
              {/* Voice Microphone Centerpiece (Feature 4) */}
              <div className="border-b border-[#1E1E26] bg-gradient-to-b from-[#111116] via-[#0C0C10] to-[#0A0A0D]">
                <VoiceMicrophone
                  isListening={isListening}
                  onToggleListening={handleToggleListening}
                  statusText={speechStatusText}
                  isProcessing={isProcessing}
                  language={settings.language}
                />
              </div>

              {/* Conversation Area (Feature 6) */}
              <ConversationArea
                messages={messages}
                onSpeakText={speakAssistantText}
                onSelectPrompt={(p) => executeCommand(p)}
                isProcessing={isProcessing}
                language={settings.language}
              />

              {/* Text Input Box (Feature 5) */}
              <CommandInputBar
                onSendCommand={executeCommand}
                isListening={isListening}
                onToggleListening={handleToggleListening}
                isProcessing={isProcessing}
                language={settings.language}
              />
            </div>

            {/* Right Column (lg:col-span-5): Task Status Panel (Feature 7) + Android Status */}
            <div className="lg:col-span-5 mt-5 lg:mt-0 flex flex-col gap-4">
              {/* Task Status Panel */}
              <TaskStatusPanel
                currentStatus={currentStatus}
                currentTask={currentTask}
                language={settings.language}
                onClearTask={() => {
                  setCurrentStatus('idle');
                  setCurrentTask(null);
                }}
              />

              {/* Quick Android Bridge Status Card */}
              <div className="bg-[#0C0C0F] border border-[#22222A] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="text-xs font-semibold text-[#F4F4F5] uppercase tracking-wider">
                      {isHindi ? 'एंड्रॉइड नेटिव ब्रिज' : 'Android Native Bridge'}
                    </h4>
                  </div>
                  <span className="text-[10px] bg-[#1C1709] border border-[#5C4713] text-[#F5D061] px-2 py-0.5 rounded font-mono">
                    {isHindi ? 'वेब प्रोटोटाइप' : 'Web Prototype'}
                  </span>
                </div>

                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {isHindi
                    ? 'ब्राउज़र सैंडबॉक्स भौतिक हार्डवेयर को नियंत्रित नहीं कर सकता। ISTIKHAR AI डिवाइस अनुरोधों को सटीक एंड्रॉइड इंटेंट और एक्सेसिबिलिटी कॉन्ट्रैक्ट्स में विघटित करता है।'
                    : 'Browser sandboxes cannot toggle hardware or inject touches into other apps. ISTIKHAR AI decomposes native requests into target Android Intents and Accessibility contracts.'}
                </p>

                <div className="pt-2 border-t border-[#1C1C22] flex items-center justify-between text-xs">
                  <button
                    onClick={() => setCurrentTab('bridge')}
                    className="text-[#D4AF37] hover:text-[#FFF1B8] font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>{isHindi ? 'क्षमता मैट्रिक्स देखें' : 'View Capabilities Matrix'}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>

                  <span className="text-[11px] text-[#71717A]">
                    {taskHistory.length} {isHindi ? 'कार्य निष्पादित' : 'tasks executed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Task Monitor (Feature 7 standalone deep view) */}
        {currentTab === 'task_monitor' && (
          <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
            <div className="pb-3 border-b border-[#27272A]">
              <h2 className="font-display text-lg font-bold text-[#F4F4F5]">
                {isHindi ? 'टास्क निष्पादन मॉनिटर' : 'Task Execution Monitor'}
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                {isHindi
                  ? 'कमांड समझना, योजना बनाना, निष्पादन और पूर्ण/विफल चरणों का रीयल-टाइम निरीक्षण।'
                  : 'Real-time lifecycle inspection across Understanding, Planning, Performing, and Completed/Failed stages.'}
              </p>
            </div>
            <TaskStatusPanel
              currentStatus={currentStatus}
              currentTask={currentTask}
              language={settings.language}
              onClearTask={() => {
                setCurrentStatus('idle');
                setCurrentTask(null);
              }}
            />
          </div>
        )}

        {/* Tab 3: Task History Screen (Feature 9) */}
        {currentTab === 'history' && (
          <TaskHistoryScreen
            history={taskHistory}
            language={settings.language}
            onClearHistory={() => setTaskHistory([])}
            onRerunCommand={(cmd) => {
              setCurrentTab('assistant');
              executeCommand(cmd);
            }}
          />
        )}

        {/* Tab 4: Android Bridge Screen */}
        {currentTab === 'bridge' && <BridgeMatrixScreen language={settings.language} />}

        {/* Tab 5: Settings Screen (Feature 10 & 11) */}
        {currentTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={(up) => setSettings((prev) => ({ ...prev, ...up }))}
            onResetDefaults={() => setSettings(DEFAULT_SETTINGS)}
            availableVoices={availableVoices}
            onTestVoice={handleTestVoice}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomTabBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeTaskCount={currentStatus !== 'idle' && currentStatus !== 'completed' && currentStatus !== 'failed' ? 1 : 0}
        language={settings.language}
      />
    </div>
  );
}
