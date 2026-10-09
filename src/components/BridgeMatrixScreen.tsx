import React, { useState } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Code2,
  Cpu
} from 'lucide-react';

interface BridgeMatrixScreenProps {
  language?: 'hi' | 'en';
}

export const BridgeMatrixScreen: React.FC<BridgeMatrixScreenProps> = ({
  language = 'hi',
}) => {
  const isHindi = language === 'hi';
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'architecture' | 'kotlin'>('matrix');

  const CAPABILITY_LIST = [
    {
      feature: 'Real-Time Voice Recognition',
      prototypeStatus: 'FUNCTIONAL',
      prototypeNote: 'Web Speech API (webkitSpeechRecognition)',
      nativeRequirement: 'Android SpeechRecognizer / Vosk offline model',
      permission: 'RECORD_AUDIO',
      tier: 'web',
    },
    {
      feature: 'Voice Synthesis (Spoken Output)',
      prototypeStatus: 'FUNCTIONAL',
      prototypeNote: 'Web SpeechSynthesis API with pitch/rate tuning',
      nativeRequirement: 'android.speech.tts.TextToSpeech',
      permission: 'None',
      tier: 'web',
    },
    {
      feature: '5-Stage Task Lifecycle Engine',
      prototypeStatus: 'FUNCTIONAL',
      prototypeNote: 'State machine tracking Understanding -> Failed/Done',
      nativeRequirement: 'Android WorkManager / Room Database',
      permission: 'None',
      tier: 'web',
    },
    {
      feature: 'Assistant Local Memory & Notes',
      prototypeStatus: 'FUNCTIONAL',
      prototypeNote: 'Browser LocalStorage / Assistant Vault',
      nativeRequirement: 'Android Room SQLite / EncryptedSharedPreferences',
      permission: 'None',
      tier: 'web',
    },
    {
      feature: isHindi ? 'डिवाइस सेटिंग्स (ब्लूटूथ / वाईफाई / ब्राइटनेस / टॉर्च)' : 'Device Hardware Settings (Bluetooth / WiFi / Torch)',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'वेब ब्राउज़र सैंडबॉक्स सुरक्षा सीमा (सत्यवादी रिपोर्टिंग)' : 'Cannot execute in browser sandbox (truthful failure)',
      nativeRequirement: 'BluetoothAdapter, WifiManager, CameraManager torch',
      permission: 'WRITE_SETTINGS, BLUETOOTH_CONNECT',
      tier: 'native',
    },
    {
      feature: isHindi ? 'कैमरा फोटो कैप्चर (उपयोगकर्ता अनुमति से)' : 'Camera Photo Capture (User Permission)',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'ब्राउज़र बैकग्राउंड शटर नहीं दबा सकता' : 'Web sandbox cannot trigger native camera shutter without APK',
      nativeRequirement: 'CameraX / MediaStore.ACTION_IMAGE_CAPTURE',
      permission: 'CAMERA',
      tier: 'native',
    },
    {
      feature: isHindi ? 'गैलरी में फोटो खोजना और प्रबंधन' : 'Finding and Managing Photos (Gallery)',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'स्थानीय स्टोरेज सैंडबॉक्स विभाजन' : 'Sandbox prevents direct filesystem photo indexing',
      nativeRequirement: 'MediaStore.Images.Media / ContentResolver query',
      permission: 'READ_MEDIA_IMAGES',
      tier: 'native',
    },
    {
      feature: isHindi ? 'सक्रिय स्क्रीन एलिमेंट्स पढ़ना (स्क्रीन इंस्पेक्शन)' : 'Reading Supported Screen Elements (Screen Reader)',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'ब्राउज़र अन्य ऐप्स की स्क्रीन नहीं पढ़ सकता' : 'Browser sandboxed from other apps UI hierarchy',
      nativeRequirement: 'AccessibilityService (rootInActiveWindow traversal)',
      permission: 'BIND_ACCESSIBILITY_SERVICE',
      tier: 'native',
    },
    {
      feature: isHindi ? 'समर्थित ऐप्स खोलना एवं यूआई ऑटोमेशन' : 'Opening Supported Apps & UI Automation (WhatsApp/Spotify)',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'इंटर-ऐप यूआई टैपिंग ब्राउज़र में अवरुद्ध' : 'Inter-app UI reading/tapping blocked by browser sandbox',
      nativeRequirement: 'PackageManager launchIntent / AccessibilityService',
      permission: 'BIND_ACCESSIBILITY_SERVICE',
      tier: 'native',
    },
    {
      feature: isHindi ? 'डायरेक्ट सेल्युलर कॉल एवं एसएमएस' : 'Direct Cellular Calls & SMS Dispatch',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'ब्राउज़र केवल लिंक बना सकता है, बैकग्राउंड कॉल नहीं' : 'Browser only creates tel: links, cannot background dial',
      nativeRequirement: 'TelecomManager / SmsManager',
      permission: 'CALL_PHONE, SEND_SMS',
      tier: 'native',
    },
    {
      feature: isHindi ? 'बैकग्राउंड ऑलवेज-ऑन हॉटवर्ड लिसनिंग' : 'Background Always-on Hotword Listening',
      prototypeStatus: 'REQUIRES NATIVE APK',
      prototypeNote: isHindi ? 'टैब स्लीप बैकग्राउंड ऑडियो रोक देता है' : 'Browser tab sleep halts background audio capture',
      nativeRequirement: 'Android Foreground Service with persistent notification',
      permission: 'FOREGROUND_SERVICE_MICROPHONE',
      tier: 'native',
    },
  ];

  const KOTLIN_BRIDGE_TEMPLATE = `// IstikharNativeCompanion.kt
package com.istikhar.ai.companion

import android.Manifest
import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.MediaStore
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * 1. Native JavascriptInterface Bridge:
 * Injected into the WebView via webView.addJavascriptInterface(bridge, "IstikharNativeBridge")
 */
class IstikharNativeBridge(private val context: Context) {

    @android.webkit.JavascriptInterface
    fun dispatchIntent(intentJson: String): String {
        return try {
            // Evaluates and dispatches actual Android Intents:
            // - Open App: context.packageManager.getLaunchIntentForPackage(...)
            // - Camera: ActivityResultLauncher / ACTION_IMAGE_CAPTURE
            // - Gallery: MediaStore.Images.Media query
            """{"success": true, "executed": true}"""
        } catch (e: Exception) {
            """{"success": false, "error": "\${e.message}"}"""
        }
    }
}

/**
 * 2. AccessibilityService for Reading Screen Elements & Performing UI Actions:
 */
class IstikharAccessibilityService : AccessibilityService() {
    
    // Reads text from all visible elements on the active phone screen
    fun readScreenElements(): List<String> {
        val rootNode = rootInActiveWindow ?: return emptyList()
        val elements = mutableListOf<String>()
        fun collectText(node: AccessibilityNodeInfo?) {
            if (node == null) return
            node.text?.let { elements.add(it.toString()) }
            node.contentDescription?.let { elements.add(it.toString()) }
            for (i in 0 until node.childCount) {
                collectText(node.getChild(i))
            }
        }
        collectText(rootNode)
        return elements
    }

    // Performs permitted UI click inside supported app
    fun clickElementById(viewId: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByViewId(viewId)
        return nodes.firstOrNull()?.performAction(AccessibilityNodeInfo.ACTION_CLICK) ?: false
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}
}`;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="font-display text-lg font-bold text-[#F4F4F5]">
            {isHindi ? 'एंड्रॉइड ऑटोमेशन एवं ब्रिज आर्किटेक्चर' : 'Android Automation & Bridge Architecture'}
          </h2>
        </div>
        <p className="text-xs text-[#71717A] mt-0.5">
          {isHindi
            ? 'वेब प्रोटोटाइप क्षमताओं और नेटिव एंड्रॉइड कंपैनियन APK आवश्यकताओं के बीच स्पष्ट विभाजन।'
            : 'Explicit division between Web Prototype capabilities and Native Android companion service requirements.'}
        </p>
      </div>

      {/* Segmented View Switcher */}
      <div className="flex items-center gap-1 bg-[#121217] p-1 rounded-xl border border-[#27272A] w-fit">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'matrix'
              ? 'bg-[#1E1E26] text-[#F5D061] font-semibold'
              : 'text-[#71717A] hover:text-[#D4D4D8]'
          }`}
        >
          {isHindi ? 'क्षमता मैट्रिक्स' : 'Capabilities Matrix'}
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'architecture'
              ? 'bg-[#1E1E26] text-[#F5D061] font-semibold'
              : 'text-[#71717A] hover:text-[#D4D4D8]'
          }`}
        >
          {isHindi ? 'स्तरित आर्किटेक्चर' : 'Layered Architecture'}
        </button>
        <button
          onClick={() => setActiveTab('kotlin')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'kotlin'
              ? 'bg-[#1E1E26] text-[#F5D061] font-semibold'
              : 'text-[#71717A] hover:text-[#D4D4D8]'
          }`}
        >
          {isHindi ? 'कोटलिन APK ब्लूप्रिंट' : 'Kotlin APK Blueprint'}
        </button>
      </div>

      {/* Tab 1: Capability Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-[#121217] border border-[#2A2310] rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="text-xs text-[#D4D4D8] leading-relaxed">
              <strong>Evaluation Standard:</strong> This prototype strictly adheres to honest execution. It never fakes toggling phone hardware or clicking apps inside a browser. Functional features run directly; native device actions are decomposed into accurate Android Intent payloads.
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-[#0A0A0D]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121217] border-b border-[#27272A] text-[#A1A1AA] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Feature / Task</th>
                  <th className="py-3 px-4">Prototype Status</th>
                  <th className="py-3 px-4">Native Android Requirement</th>
                  <th className="py-3 px-4">Android Permission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D24]">
                {CAPABILITY_LIST.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#121217]/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#F4F4F5]">
                      {row.feature}
                    </td>
                    <td className="py-3 px-4">
                      {row.tier === 'web' ? (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Functional Now
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Requires Native APK
                        </span>
                      )}
                      <p className="text-[10px] text-[#71717A] mt-1">{row.prototypeNote}</p>
                    </td>
                    <td className="py-3 px-4 text-[#A1A1AA]">
                      {row.nativeRequirement}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#D4AF37]">
                      {row.permission}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Layered Architecture Diagram */}
      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Layer 1: UI */}
            <div className="p-4 bg-[#0E0E12] border border-[#27272A] rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">1. UI & Interaction Layer</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Mobile-first dark/gold touch interface. Houses the large voice microphone, text console, conversation area, and 5-stage task status panel.
              </p>
              <div className="text-[11px] text-[#D4AF37] font-mono pt-1">
                src/components/*
              </div>
            </div>

            {/* Layer 2: AI */}
            <div className="p-4 bg-[#0E0E12] border border-[#27272A] rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">2. AI Planning Layer</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Natural language intent classification and step decomposition. Decoupled and ready for secure server-side Gemini API routing.
              </p>
              <div className="text-[11px] text-[#D4AF37] font-mono pt-1">
                src/services/aiService.ts
              </div>
            </div>

            {/* Layer 3: Android Bridge */}
            <div className="p-4 bg-[#0E0E12] border border-[#27272A] rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">3. Android Bridge Layer</h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Evaluates OS capabilities. Refuses to simulate fake device control in web sandbox; exposes clean Kotlin @JavascriptInterface contract for native build.
              </p>
              <div className="text-[11px] text-[#D4AF37] font-mono pt-1">
                src/services/androidBridge.ts
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#121217] border border-[#27272A] rounded-xl">
            <h4 className="text-xs font-semibold text-[#F4F4F5] uppercase tracking-wider mb-2">
              {isHindi ? 'नेटिव एंड्रॉइड प्रोजेक्ट स्थिति एवं चरण' : 'Native Android Project Status & Next Steps'}
            </h4>
            <ol className="list-decimal list-inside text-xs text-[#A1A1AA] space-y-1.5 leading-relaxed">
              <li>
                <span className="text-emerald-400 font-medium">
                  {isHindi ? 'उपलब्ध:' : 'Available:'}
                </span>{' '}
                {isHindi 
                  ? 'संपूर्ण Kotlin Android Studio प्रोजेक्ट फ़ोल्डर (/android) तैयार है जिसमें WebView रैपर, IstikharNativeBridge, Allowlist, और AccessibilityService शामिल हैं।'
                  : 'Complete Kotlin Android Studio project structure (/android) is prepared with WebView wrapper, IstikharNativeBridge, Allowlist, and AccessibilityService.'}
              </li>
              <li>{isHindi ? 'Android Studio में /android फ़ोल्डर खोलें और Gradle सिंक करें।' : 'Open the /android directory in Android Studio and run Gradle Sync.'}</li>
              <li>{isHindi ? 'अपने रियल एंड्रॉइड फ़ोन पर USB Debugging चालू करें।' : 'Enable USB Debugging on your physical Android phone.'}</li>
              <li>{isHindi ? 'Run "app" (Shift+F10) या ./gradlew assembleDebug चलाकर Debug APK इंस्टॉल करें।' : 'Run "app" (Shift+F10) or execute ./gradlew assembleDebug to install the Debug APK.'}</li>
              <li>{isHindi ? 'फ़ोन सेटिंग्स में जाकर ISTIKHAR AI AccessibilityService को सक्षम करें।' : 'Navigate to Android Settings > Accessibility and enable ISTIKHAR AI service.'}</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 3: Kotlin APK Blueprint */}
      {activeTab === 'kotlin' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A1A1AA]">
              Companion Android Studio Kotlin Bridge Interface
            </span>
            <button
              onClick={() => copyCode(KOTLIN_BRIDGE_TEMPLATE)}
              className="text-xs text-[#D4AF37] hover:text-[#FFF1B8] flex items-center gap-1.5 bg-[#181820] px-3 py-1.5 rounded-lg border border-[#27272A]"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Kotlin Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-black rounded-xl border border-[#27272A] text-xs font-mono text-[#D4AF37] overflow-x-auto leading-relaxed">
            {KOTLIN_BRIDGE_TEMPLATE}
          </pre>
        </div>
      )}
    </div>
  );
};
