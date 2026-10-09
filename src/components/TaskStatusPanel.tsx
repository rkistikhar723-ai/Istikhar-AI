import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  ArrowRight, 
  Smartphone, 
  Terminal, 
  Copy, 
  Check, 
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Code2
} from 'lucide-react';
import { TaskStatus, TaskMeta, TaskStep } from '../types/assistant';
import { androidBridge } from '../services/androidBridge';

interface TaskStatusPanelProps {
  currentStatus: TaskStatus;
  currentTask: TaskMeta | null;
  onClearTask?: () => void;
  language?: 'hi' | 'en';
}

export const TaskStatusPanel: React.FC<TaskStatusPanelProps> = ({
  currentStatus,
  currentTask,
  onClearTask,
  language = 'hi',
}) => {
  const [showKotlinSnippet, setShowKotlinSnippet] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isHindi = language === 'hi';

  if (currentStatus === 'idle' && !currentTask) {
    return (
      <div className="bg-[#0D0D10] border border-[#27272A]/80 rounded-2xl p-4 sm:p-5 text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-[#18181D] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-3">
          <Layers className="w-5 h-5 text-[#D4AF37]/60" />
        </div>
        <h3 className="text-sm font-semibold text-[#E4E4E7]">
          {isHindi ? 'टास्क लाइफसाइकिल मॉनिटर' : 'Task Lifecycle Monitor'}
        </h3>
        <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
          {isHindi
            ? 'कोई सक्रिय कार्य नहीं है। रीयल-टाइम में कार्य को समझने, योजना बनाने और निष्पादन चरणों को देखने के लिए आवाज़ से कहें या नीचे टाइप करें।'
            : 'No task active. Give a voice command or type below to view real-time understanding, planning, and execution stages.'}
        </p>
      </div>
    );
  }

  // 5 Status Stages definition localized
  const STAGES: { key: TaskStatus; label: string; desc: string }[] = isHindi
    ? [
        { key: 'understanding', label: '1. कमांड समझना', desc: 'इंटेंट और जानकारी का विश्लेषण' },
        { key: 'planning', label: '2. कार्य योजना', desc: 'निष्पादन आलेख तैयार करना' },
        { key: 'performing', label: '3. कार्य निष्पादन', desc: 'वेब / एंड्रॉइड ब्रिज पर प्रेषण' },
        { key: 'completed', label: '4. कार्य पूरा हुआ', desc: 'सत्यापित और सहेजा गया' },
        { key: 'failed', label: '5. कार्य रुका / विफल', desc: 'नेटिव एंड्रॉइड APK आवश्यक' },
      ]
    : [
        { key: 'understanding', label: '1. Understanding command', desc: 'Parsing intent & entities' },
        { key: 'planning', label: '2. Planning task', desc: 'Synthesizing execution graph' },
        { key: 'performing', label: '3. Performing task', desc: 'Routing to Web/Android Bridge' },
        { key: 'completed', label: '4. Task completed', desc: 'Action verified & stored' },
        { key: 'failed', label: '5. Task failed', desc: 'Halted or requires Native Android APK' },
      ];

  const getStageState = (stageKey: TaskStatus): 'active' | 'done' | 'failed' | 'upcoming' => {
    if (currentStatus === 'failed') {
      if (stageKey === 'failed') return 'failed';
      if (stageKey === 'completed') return 'upcoming';
      if (stageKey === 'performing') return 'done';
      if (stageKey === 'planning') return 'done';
      if (stageKey === 'understanding') return 'done';
      return 'upcoming';
    }

    if (currentStatus === 'completed') {
      if (stageKey === 'completed') return 'done';
      if (stageKey === 'failed') return 'upcoming';
      return 'done';
    }

    const order: TaskStatus[] = ['understanding', 'planning', 'performing'];
    const currentIdx = order.indexOf(currentStatus);
    const stageIdx = order.indexOf(stageKey);

    if (stageKey === 'completed' || stageKey === 'failed') {
      return 'upcoming';
    }

    if (stageIdx === currentIdx) return 'active';
    if (stageIdx < currentIdx) return 'done';
    return 'upcoming';
  };

  const isNativeRequired = currentTask?.capability === 'native_android_required';

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="bg-[#0C0C0F] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl shadow-black/60 transition-all">
      {/* Header bar */}
      <div className="px-4 py-3 bg-[#111116] border-b border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
          <h3 className="text-xs font-semibold text-[#F4F4F5] uppercase tracking-wider">
            {isHindi ? 'लाइव टास्क स्टेटस पैनल' : 'Live Task Status Panel'}
          </h3>
          {currentTask && (
            <span className="text-[11px] text-[#A1A1AA] font-mono">
              ID: {currentTask.taskId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isNativeRequired && (
            <span className="text-[10px] font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-amber-400" />
              {isHindi ? 'नेटिव एंड्रॉइड आवश्यक' : 'Native Android Req.'}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#71717A] hover:text-[#E4E4E7] rounded-md transition-colors"
            aria-label="Toggle panel collapse"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 5-Stage Progression Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {STAGES.map((stg) => {
              const state = getStageState(stg.key);
              const isTerminalFailed = stg.key === 'failed' && currentStatus === 'failed';
              const isTerminalCompleted = stg.key === 'completed' && currentStatus === 'completed';

              return (
                <div
                  key={stg.key}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    state === 'active'
                      ? 'bg-[#1C1709] border-[#D4AF37] text-[#F5D061] shadow-sm shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]/50'
                      : state === 'done'
                      ? 'bg-[#121217] border-[#27272A] text-[#A1A1AA]'
                      : isTerminalFailed
                      ? 'bg-rose-950/30 border-rose-800 text-rose-300 ring-1 ring-rose-700/50'
                      : isTerminalCompleted
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300 ring-1 ring-emerald-700/50'
                      : 'bg-[#09090C] border-[#1C1C22] text-[#52525B]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-mono">
                      {stg.key === 'failed' && isTerminalFailed ? 'STOPPED' : stg.key}
                    </span>
                    {state === 'active' && (
                      <span className="w-2 h-2 rounded-full bg-[#F5D061] animate-ping" />
                    )}
                    {state === 'done' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    )}
                    {isTerminalFailed && (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {isTerminalCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold leading-tight">{stg.label}</p>
                  <p className="text-[10px] text-[#71717A] mt-0.5 truncate">{stg.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Current Stage Highlight Callout */}
          <div className="bg-[#121217] border border-[#27272A] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#2A2310] flex items-center justify-center shrink-0 mt-0.5">
                {currentStatus === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : currentStatus === 'failed' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Cpu className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#F4F4F5]">
                    {currentStatus === 'understanding' && (isHindi ? 'चरण 1: कमांड का विश्लेषण किया जा रहा है...' : 'Stage 1: Understanding natural language command...')}
                    {currentStatus === 'planning' && (isHindi ? 'चरण 2: कार्य योजना और चरणों का निर्माण...' : 'Stage 2: Decomposing task into execution graph...')}
                    {currentStatus === 'performing' && (isHindi ? 'चरण 3: निष्पादन स्तर पर भेजा जा रहा है...' : 'Stage 3: Dispatching to execution layer...')}
                    {currentStatus === 'completed' && (isHindi ? 'चरण 4: कार्य सफलतापूर्वक पूर्ण हुआ।' : 'Stage 4: Task Completed successfully.')}
                    {currentStatus === 'failed' && (isHindi ? 'चरण 5: कार्य रुका / नेटिव एंड्रॉइड आवश्यक।' : 'Stage 5: Task Failed / Native Android Required.')}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {isHindi ? 'इंटेंट' : 'Intent'}: <span className="text-[#F4F4F5] font-mono">{currentTask?.intent || 'PROCESSING'}</span>
                  {currentTask?.completedTime && currentTask.startTime && (
                    <span className="ml-2 text-[11px] text-[#71717A]">
                      ({Math.max(12, currentTask.completedTime - currentTask.startTime)}ms)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Capability Classification Badge */}
            <div className="text-right shrink-0">
              <span className={`inline-block text-[11px] px-2.5 py-1 rounded-md border font-medium ${
                currentTask?.capability === 'web_functional'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                {currentTask?.capability === 'web_functional'
                  ? (isHindi ? 'ब्राउज़र में निष्पादनीय' : 'Browser Executable')
                  : (isHindi ? 'नेटिव एंड्रॉइड सर्विस आवश्यक' : 'Native Android Service Required')}
              </span>
            </div>
          </div>

          {/* Detailed Execution Steps */}
          {currentTask?.steps && currentTask.steps.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">
                {isHindi ? 'कार्य के चरण (Task Steps)' : 'Decomposed Task Steps'}
              </span>
              <div className="space-y-1.5">
                {currentTask.steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="p-2.5 bg-[#08080B] border border-[#1F1F26] rounded-xl flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-[#141419] border border-[#27272A] text-[10px] font-mono text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-[#F4F4F5]">{step.label}</p>
                        {step.detail && (
                          <p className="text-[11px] text-[#71717A] mt-0.5">{step.detail}</p>
                        )}
                        {step.requiresNativeAndroid && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900/60 inline-flex">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>
                              {isHindi ? 'एंड्रॉइड आवश्यक: ' : 'Requires Android: '}
                              {step.nativeRequirementType || 'Accessibility Service'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {step.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {step.status === 'in_progress' && (
                        <Clock className="w-4 h-4 text-[#D4AF37] animate-spin" />
                      )}
                      {step.status === 'failed' && (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {step.status === 'pending' && (
                        <span className="text-[10px] text-[#52525B]">WAITING</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual Result & Outcome Display (Feature 4 & 6: Truthful localized results) */}
          {currentTask && (currentStatus === 'completed' || currentStatus === 'failed') && (
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${
              currentStatus === 'completed'
                ? 'bg-emerald-950/20 border-emerald-800/50 text-[#F4F4F5]'
                : 'bg-amber-950/20 border-amber-800/50 text-[#F4F4F5]'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  {currentStatus === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {currentStatus === 'completed'
                      ? (isHindi ? 'वास्तविक निष्पादन परिणाम' : 'Actual Execution Result')
                      : (isHindi ? 'सत्यवादी सैंडबॉक्स स्थिति' : 'Truthful Sandbox Status')}
                  </span>
                </span>
                <span className="text-[10px] text-[#A1A1AA] font-mono">
                  {currentTask.capability === 'web_functional'
                    ? (isHindi ? 'ब्राउज़र निष्पादित' : 'Browser Executed')
                    : (isHindi ? 'अनिष्पादित (नेटिव आवश्यक)' : 'Unexecuted (Native Req.)')}
                </span>
              </div>
              <p className="text-xs text-[#E4E4E7] leading-relaxed">
                {currentStatus === 'completed'
                  ? (currentTask.failureReason
                      ? currentTask.failureReason
                      : (isHindi ? 'ब्राउज़र वातावरण में क्रिया सत्यापित और पूर्ण हुई।' : 'Action verified and completed in browser environment.'))
                  : (currentTask.failureReason || (isHindi
                      ? 'ब्राउज़र में निष्पादन नहीं हुआ: भौतिक डिवाइस नियंत्रण और अन्य ऐप्स में कार्य करने के लिए एंड्रॉइड OS अनुमति और AccessibilityService आवश्यक है।'
                      : 'Unexecuted in Browser: Physical device controls and inter-app clicks require Android OS system permissions and an AccessibilityService.'))}
              </p>
            </div>
          )}

          {/* Native Android Requirement Disclaimer (Crucial Rule) */}
          {isNativeRequired && currentStatus === 'failed' && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isHindi ? 'सत्यवादी एंड्रॉइड निष्पादन प्रकटीकरण' : 'Honest Android Execution Disclosure'}</span>
              </div>
              <p className="text-xs text-[#D4D4D8] leading-relaxed">
                {isHindi ? (
                  <>
                    एक ईमानदार AI सहायक के रूप में, ISTIKHAR AI वेब ब्राउज़र में <strong>डिवाइस नियंत्रण का झूठा दावा नहीं करता है</strong>। सिस्टम हार्डवेयर (ब्लूटूथ, वाई-फाई) को चालू/बंद करने या अन्य ऐप्स में क्लिक करने के लिए <code className="text-[#F5D061] font-mono text-[11px]">AccessibilityService</code> या सिस्टम अनुमति वाले कंपैनियन एंड्रॉइड APK की आवश्यकता होती है।
                  </>
                ) : (
                  <>
                    As an honest AI assistant, ISTIKHAR AI <strong>does not fake device control</strong> in a web browser. Controlling system hardware or reading/clicking 3rd-party apps requires an Android APK with an <code className="text-[#F5D061] font-mono text-[11px]">AccessibilityService</code> or declared system permissions.
                  </>
                )}
              </p>

              {/* View Kotlin Contract Button */}
              {currentTask?.nativeIntentPayload && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowKotlinSnippet(!showKotlinSnippet)}
                    className="text-xs font-medium text-[#F5D061] hover:text-[#FFF1B8] flex items-center gap-1.5 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>
                      {showKotlinSnippet
                        ? (isHindi ? 'एंड्रॉइड कोटलिन कोड छुपाएं' : 'Hide Android Native Kotlin Contract')
                        : (isHindi ? 'एंड्रॉइड कोटलिन कोड ब्लूप्रिंट देखें' : 'View Android Native Kotlin Contract')}
                    </span>
                  </button>

                  {showKotlinSnippet && (
                    <div className="mt-2.5 space-y-2">
                      <div className="p-3 bg-black rounded-lg border border-[#27272A] font-mono text-[11px] text-[#A1A1AA] overflow-x-auto relative">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272A]">
                          <span className="text-[10px] text-[#D4AF37] uppercase font-semibold flex items-center gap-1">
                            <Code2 className="w-3.5 h-3.5" />
                            {isHindi ? 'नेटिव एंड्रॉइड कोटलिन कोड' : 'Native Android Kotlin Code'}
                          </span>
                          <button
                            onClick={() => copyCode(androidBridge.generateKotlinContract(currentTask.nativeIntentPayload!))}
                            className="text-[10px] text-[#D4AF37] hover:text-[#FFF1B8] flex items-center gap-1"
                          >
                            {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedSnippet ? (isHindi ? 'कॉपी हो गया' : 'Copied') : (isHindi ? 'कॉपी करें' : 'Copy Code')}</span>
                          </button>
                        </div>
                        <pre className="text-amber-200/90 whitespace-pre font-mono">
                          {androidBridge.generateKotlinContract(currentTask.nativeIntentPayload)}
                        </pre>
                      </div>

                      <div className="p-2.5 bg-[#09090C] rounded-lg border border-[#1E1E24] font-mono text-[10px] text-[#71717A] overflow-x-auto">
                        <span className="text-[10px] text-[#52525B] uppercase block mb-1">
                          {isHindi ? 'इंटेंट पेलोड (Intent Metadata)' : 'Intent Metadata Payload'}
                        </span>
                        <pre className="text-emerald-400">
                          {JSON.stringify(currentTask.nativeIntentPayload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
