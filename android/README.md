# ISTIKHAR AI — Native Android Companion Project

यह डाइरेक्टरी (`/android`) **ISTIKHAR AI** के लिए एक पूर्ण मूल (Native) Android Studio Kotlin प्रोजेक्ट है।

---

## 📁 प्रोजेक्ट संरचना (Project Structure)

```text
android/
├── build.gradle.kts                 # रूट बिल्ड कॉन्फ़िगरेशन
├── settings.gradle.kts              # प्रोजेक्ट एवं :app मॉड्यूल समावेशन
├── gradle.properties                # AndroidX और JVM पैरामीटर
├── README.md                        # यह मार्गदर्शिका
└── app/
    ├── build.gradle.kts             # ऐप निर्भरताएं (WebKit, Activity-KTX, Coroutines)
    ├── proguard-rules.pro           # JavaScriptInterface नियम
    └── src/main/
        ├── AndroidManifest.xml      # अनुमतियां, MainActivity, AccessibilityService, FileProvider
        ├── java/com/istikhar/ai/
        │   ├── MainActivity.kt      # WebView कंटेनर, JS Interface इंजेक्शन, अनुमति प्रबंधन
        │   ├── bridge/
        │   │   ├── BridgeActionAllowlist.kt  # सख्त सुरक्षा अनुमति-सूची (Strict Allowlist)
        │   │   ├── BridgeModels.kt           # JSON पार्सिंग और परिणाम मॉडल
        │   │   └── IstikharNativeBridge.kt   # @JavascriptInterface कार्यान्वयन
        │   ├── camera/
        │   │   └── CameraCaptureHelper.kt    # कैमरा शटर और FileProvider
        │   ├── gallery/
        │   │   └── PhotoGalleryHelper.kt     # MediaStore और गैलरी पिकर
        │   ├── security/
        │   │   └── SensitiveActionConfirmationDialog.kt # कॉल/एसएमएस पुष्टि डायलॉग
        │   └── service/
        │       └── IstikharAccessibilityService.kt      # सुरक्षित स्क्रीन रीडर सर्विस
        └── res/
            ├── drawable/
            │   ├── ic_launcher_background.xml
            │   └── ic_launcher_foreground.xml
            ├── layout/activity_main.xml
            ├── mipmap-anydpi-v26/
            │   ├── ic_launcher.xml
            │   └── ic_launcher_round.xml
            ├── values/
            │   ├── colors.xml       # प्रीमियम डार्क/गोल्ड थीम
            │   ├── strings.xml      # हिंदी/अंग्रेजी स्ट्रिंग्स
            │   └── themes.xml       # Material3 NoActionBar थीम
            └── xml/
                ├── accessibility_service_config.xml
                └── file_paths.xml
```

---

## 🛠️ Android Studio में बिल्ड और इंस्टॉल कैसे करें (How to Build & Run)

### चरण 1: प्रोजेक्ट खोलें
1. **Android Studio** खोलें।
2. **File > Open** पर क्लिक करें और इस प्रोजेक्ट का `android` फ़ोल्डर चुनें।
3. Gradle सिंक (Sync Project with Gradle Files) पूरा होने दें।

### चरण 2: डेवलपमेंट URL सेट करें
- `android/app/src/main/java/com/istikhar/ai/MainActivity.kt` में:
  ```kotlin
  private val appUrl: String = "https://ais-dev-hqxlnltapeg2s4amsx2t7n-104712320688.asia-southeast1.run.app"
  ```
  यदि आप लोकल नेटवर्क पर चला रहे हैं तो अपने कंप्यूटर का लोकल IP (उदा. `http://192.168.1.100:3000`) डाल सकते हैं।

### चरण 3: Debug APK बिल्ड करें
- टर्मिनल में चलाएं:
  ```bash
  cd android
  ./gradlew assembleDebug
  ```
  या Android Studio मेनू में:
  **Build > Build Bundle(s) / APK(s) > Build APK(s)** चुनें।
- जनरेटेड APK फ़ाइल यहाँ मिलेगी:
  `android/app/build/outputs/apk/debug/app-debug.apk`

### चरण 4: अपने फ़ोन पर इंस्टॉल करें (USB Debugging)
1. अपने फ़ोन की सेटिंग्स में **Developer Options > USB Debugging** चालू करें।
2. फ़ोन को USB केबल से कनेक्ट करें।
3. Android Studio में हरे **Run 'app' (Shift+F10)** बटन पर क्लिक करें।

---

## 🔒 सुरक्षा एवं अनुमति संरचना (Security & Permissions)

1. **सख्त सुरक्षा अनुमति सूची (Strict Allowlist):**
   - केवल अधिकृत क्रियाएं (कैमरा, गैलरी, सिस्टम सेटिंग्स, व्हाइटलिस्टेड ऐप्स) ही स्वीकार की जाती हैं।
   - अज्ञात या अनधिकृत सिस्टम क्रियाएं ब्रिज स्तर पर सीधे अस्वीकार कर दी जाती हैं।

2. **संवेदनशील कार्रवाइयों की उपयोगकर्ता पुष्टि (Confirmation Dialog):**
   - फ़ोन कॉल (`ACTION_CALL`), संदेश (`ACTION_SENDTO`) या डेटा डिलीट करने से पहले स्क्रीन पर पुष्टिकरण डायलॉग प्रदर्शित होता है।
   - उपयोगकर्ता द्वारा "स्वीकार करें" दबाने पर ही कार्रवाई निष्पादित होती है।

3. **गोपनीयता सुरक्षित AccessibilityService:**
   - पासवर्ड इनपुट फ़ील्ड्स (`node.isPassword == true`) को पूरी तरह छोड़ दिया जाता है।
   - बिना उपयोगकर्ता की स्पष्ट अनुमति के बैकग्राउंड में कुछ भी रिकॉर्ड नहीं किया जाता।

4. **Gemini API सुरक्षा:**
   - API कुंजी कभी भी APK या क्लाइंट-साइड कोड में नहीं रखी जाती। सभी अनुरोध सर्वर प्रॉक्सी के माध्यम से सुरक्षित रहते हैं।
