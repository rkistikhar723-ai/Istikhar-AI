/**
 * ISTIKHAR AI - Android Automation Bridge Layer
 * 
 * Separates the UI and AI layers from native Android execution.
 * When running in standard web environments, this bridge refuses to simulate fake
 * success on device hardware, explicitly reporting that native Android implementation
 * (AccessibilityService, Permissions, Intent Dispatchers) is required.
 */

import { AndroidIntentPayload } from '../types/assistant';

export interface BridgeExecutionResult {
  executed: boolean;
  success: boolean;
  error?: string;
  nativeCodeSnippet?: string;
  requiredPermission?: string;
  requiresConfirmation?: boolean;
  actionDetails?: string;
}

export class AndroidBridgeService {
  /**
   * Check if running inside an Android WebView with injected JavascriptInterface
   * (e.g., window.IstikharNativeBridge)
   */
  public isNativeAndroidApp(): boolean {
    if (typeof window === 'undefined') return false;
    // Check for native Android WebView JS interface injection
    return Boolean((window as any).IstikharNativeBridge);
  }

  /**
   * Dispatch an Intent or request hardware action.
   * In the Web Prototype, device control actions ARE NOT simulated as successful.
   * They return explicit failure with the required Android Native API documentation.
   */
  public async executeNativeAction(intent: AndroidIntentPayload): Promise<BridgeExecutionResult> {
    // 1. Check if running inside an actual Android Native wrapper
    if (this.isNativeAndroidApp()) {
      try {
        const nativeBridge = (window as any).IstikharNativeBridge;
        if (typeof nativeBridge.dispatchIntent === 'function') {
          const rawResult = nativeBridge.dispatchIntent(JSON.stringify(intent));
          const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
          return {
            executed: Boolean(parsed.executed !== false),
            success: Boolean(parsed.success),
            error: parsed.error,
            requiresConfirmation: Boolean(parsed.requiresConfirmation),
            actionDetails: parsed.message || parsed.detail,
          };
        }
      } catch (err: any) {
        return {
          executed: true,
          success: false,
          error: `Native Bridge call failed: ${err.message}`,
        };
      }
    }

    // 2. Running in Web Browser Prototype
    // As per specification: "Do not claim that the app can fully control Android yet.
    // Do not simulate successful device actions."
    const kotlinSnippet = this.generateKotlinContract(intent);

    return {
      executed: false,
      success: false,
      requiredPermission: intent.requiredPermission,
      error: `Native Android execution unavailable in Web Browser context. This action requires ${intent.requiredService || 'Android Intent/Permission'} (${intent.requiredPermission || 'System Capability'}).`,
      nativeCodeSnippet: kotlinSnippet,
    };
  }

  /**
   * Generates production-ready Kotlin code that the Android companion app
   * will run to execute this command.
   */
  public generateKotlinContract(intent: AndroidIntentPayload): string {
    // 1. Camera Capture with User Permission
    if (intent.action === 'android.media.action.IMAGE_CAPTURE' || intent.requiredPermission === 'android.permission.CAMERA') {
      return `// Android Native Camera Integration (Requires CAMERA permission)
// Manifest: <uses-permission android:name="android.permission.CAMERA" />
class CameraCaptureManager(private val activity: ComponentActivity) {
    private val takePictureLauncher = activity.registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success) {
            // Photo saved successfully to target URI
            Log.d("ISTIKHAR_AI", "Photo captured successfully")
        } else {
            Log.w("ISTIKHAR_AI", "Camera capture cancelled by user")
        }
    }

    fun capturePhotoWithPermission(targetUri: Uri) {
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) 
            == PackageManager.PERMISSION_GRANTED) {
            takePictureLauncher.launch(targetUri)
        } else {
            ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.CAMERA), 101)
        }
    }
}`;
    }

    // 2. Finding & Managing Photos (MediaStore)
    if (intent.action === 'android.intent.action.VIEW' && intent.dataUri?.includes('images')) {
      return `// Android Photo Gallery & MediaStore Query
// Manifest: <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
class PhotoGalleryManager(private val context: Context) {
    fun queryRecentPhotos(): List<Uri> {
        val photos = mutableListOf<Uri>()
        val projection = arrayOf(MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME)
        val sortOrder = "\${MediaStore.Images.Media.DATE_ADDED} DESC"
        
        context.contentResolver.query(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            projection, null, null, sortOrder
        )?.use { cursor ->
            val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
            while (cursor.moveToNext() && photos.size < 10) {
                val id = cursor.getLong(idColumn)
                val uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)
                photos.add(uri)
            }
        }
        return photos
    }

    fun openGalleryIntent() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}`;
    }

    // 3. Screen Elements Reading via AccessibilityService
    if (intent.action.includes('getRootInActiveWindow') || intent.extras?.inspectScreen) {
      return `// Android AccessibilityService Screen Element Inspector
class ScreenReaderAutomationService : AccessibilityService() {
    fun readCurrentScreenElements(): List<String> {
        val rootNode = rootInActiveWindow ?: return emptyList()
        val textElements = mutableListOf<String>()
        
        fun traverse(node: AccessibilityNodeInfo?) {
            if (node == null) return
            node.text?.let { textElements.add(it.toString()) }
            node.contentDescription?.let { textElements.add(it.toString()) }
            for (i in 0 until node.childCount) {
                traverse(node.getChild(i))
            }
        }
        traverse(rootNode)
        return textElements
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}
}`;
    }

    // 4. Accessibility UI Click/Action
    if (intent.requiredService === 'AccessibilityService') {
      return `// Android AccessibilityService Implementation
class IstikharAutomationService : AccessibilityService() {
    fun executeAutomationTask() {
        // Target Intent: ${intent.action}
        val rootNode = rootInActiveWindow ?: return
        // Find UI elements and perform automated click/type
        val nodes = rootNode.findAccessibilityNodeInfosByViewId("${intent.extras?.targetViewId || 'com.target.app:id/action'}")
        nodes.firstOrNull()?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}
}`;
    }

    // 5. App Launch via PackageManager
    if (intent.action.includes('getLaunchIntentForPackage') || intent.extras?.launchApp) {
      const pkg = intent.extras?.packageName || 'com.target.app';
      return `// Launch Supported Android Application
val packageManager = context.packageManager
val launchIntent = packageManager.getLaunchIntentForPackage("${pkg}")
if (launchIntent != null) {
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(launchIntent)
} else {
    // Open Play Store to install
    val storeIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=${pkg}"))
    storeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(storeIntent)
}`;
    }

    // 6. Android System Settings
    if (intent.action.includes('android.settings')) {
      return `// Android System Settings Intent
val intent = Intent(Settings.${intent.action.replace('android.settings.', '')})
intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
context.startActivity(intent)
// Requires Permission: ${intent.requiredPermission || 'None (Settings Activity)'}`;
    }

    // 7. Generic Native Intent
    return `// Android Native Intent Dispatcher
val intent = Intent("${intent.action}").apply {
    ${intent.dataUri ? `data = Uri.parse("${intent.dataUri}")` : ''}
    ${intent.category ? `addCategory("${intent.category}")` : ''}
    ${Object.entries(intent.extras || {})
      .map(([k, v]) => `putExtra("${k}", ${JSON.stringify(v)})`)
      .join('\n    ')}
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
}
if (intent.resolveActivity(context.packageManager) != null) {
    context.startActivity(intent)
}`;
  }
}

export const androidBridge = new AndroidBridgeService();
