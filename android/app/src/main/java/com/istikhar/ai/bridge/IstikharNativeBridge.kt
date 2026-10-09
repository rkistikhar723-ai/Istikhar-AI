package com.istikhar.ai.bridge

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.webkit.JavascriptInterface
import com.istikhar.ai.MainActivity
import com.istikhar.ai.camera.CameraCaptureHelper
import com.istikhar.ai.gallery.PhotoGalleryHelper
import com.istikhar.ai.security.SensitiveActionConfirmationDialog
import com.istikhar.ai.service.IstikharAccessibilityService
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * JavaScript Interface injected into the WebView.
 * Handles dispatching native commands, enforcing security allowlists,
 * and requiring explicit user confirmation for sensitive operations.
 */
class IstikharNativeBridge(
    private val activity: Activity,
    private val cameraHelper: CameraCaptureHelper,
    private val galleryHelper: PhotoGalleryHelper
) {

    @JavascriptInterface
    fun isNativeEnvironment(): Boolean {
        return true
    }

    @JavascriptInterface
    fun getServerUrl(): String {
        val prefs = activity.getSharedPreferences("istikhar_prefs", Context.MODE_PRIVATE)
        return prefs.getString("server_url", "") ?: ""
    }

    @JavascriptInterface
    fun setServerUrl(url: String) {
        val prefs = activity.getSharedPreferences("istikhar_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("server_url", url.trim()).apply()
    }

    @JavascriptInterface
    fun isAccessibilityEnabled(): Boolean {
        return IstikharAccessibilityService.isServiceEnabled(activity)
    }

    @JavascriptInterface
    fun dispatchIntent(intentJson: String): String {
        return try {
            val request = NativeActionRequest.fromJson(intentJson)

            // 1. Enforce Strict Security Allowlist
            if (!BridgeActionAllowlist.isActionAllowed(request.action, request.dataUri)) {
                return NativeActionResponse(
                    executed = false,
                    success = false,
                    error = "सुरक्षा नीति उल्लंघन: यह क्रिया अधिकृत सूची (Allowlist) में नहीं है: ${request.action}"
                ).toJson()
            }

            // 2. Handle Sensitive Actions requiring User Confirmation Dialog
            if (BridgeActionAllowlist.isSensitiveAction(request.action)) {
                return handleSensitiveActionWithConfirmation(request)
            }

            // 3. Dispatch Safe, Allowlisted Actions
            when {
                // A. Camera Photo Capture
                BridgeActionAllowlist.ALLOWED_CAMERA_ACTIONS.contains(request.action) -> {
                    handleCameraAction()
                }

                // B. Photo Gallery / MediaStore Selection & Query
                BridgeActionAllowlist.ALLOWED_GALLERY_ACTIONS.contains(request.action) -> {
                    handleGalleryAction(request)
                }

                // C. System Settings
                BridgeActionAllowlist.ALLOWED_SETTINGS_ACTIONS.contains(request.action) -> {
                    handleSettingsAction(request.action)
                }

                // D. Accessibility Screen Reading or Interaction
                BridgeActionAllowlist.ALLOWED_ACCESSIBILITY_ACTIONS.contains(request.action) -> {
                    handleAccessibilityAction(request)
                }

                // E. App Launch
                request.extras.containsKey("packageName") || request.extras.containsKey("launchApp") -> {
                    val pkgName = request.extras["packageName"] as? String ?: ""
                    val fallbackUrl = request.extras["fallbackUrl"] as? String
                    handleAppLaunch(pkgName, fallbackUrl)
                }

                // F. Home Screen Navigation Intent
                request.action == "android.intent.action.MAIN" && request.category == "android.intent.category.HOME" -> {
                    handleHomeScreenAction()
                }

                // G. Generic Allowlisted Intent
                else -> {
                    dispatchGenericIntent(request)
                }
            }
        } catch (e: Exception) {
            NativeActionResponse(
                executed = true,
                success = false,
                error = "ब्रिज निष्पादन त्रुटि: ${e.message}"
            ).toJson()
        }
    }

    private fun handleCameraAction(): String {
        if (!cameraHelper.hasCameraPermission()) {
            return NativeActionResponse(
                executed = false,
                success = false,
                error = "कैमरा अनुमति (android.permission.CAMERA) आवश्यक है। कृपया अनुमति दें।"
            ).toJson()
        }

        var launched = false
        activity.runOnUiThread {
            launched = cameraHelper.launchCamera()
        }

        return NativeActionResponse(
            executed = true,
            success = true,
            message = "कैमरा सफलतापूर्वक शुरू किया गया (Camera launched with user permission)"
        ).toJson()
    }

    private fun handleGalleryAction(request: NativeActionRequest): String {
        return if (request.action == "android.intent.action.PICK" || request.action == "android.intent.action.GET_CONTENT") {
            activity.runOnUiThread {
                galleryHelper.openGalleryPicker()
            }
            NativeActionResponse(
                executed = true,
                success = true,
                message = "गैलरी पिकर खोला गया (Gallery picker launched)"
            ).toJson()
        } else {
            // MediaStore Query
            val photos = galleryHelper.queryRecentPhotos(activity, limit = 5)
            NativeActionResponse(
                executed = true,
                success = true,
                message = "हालिया फोटो प्राप्त किए गए: ${photos.size} फोटो उपलब्ध हैं",
                data = mapOf("photos" to photos)
            ).toJson()
        }
    }

    private fun handleSettingsAction(action: String): String {
        val intent = Intent(action).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return try {
            activity.startActivity(intent)
            NativeActionResponse(
                executed = true,
                success = true,
                message = "सेटिंग्स स्क्रीन खोली गई: $action"
            ).toJson()
        } catch (e: Exception) {
            NativeActionResponse(
                executed = true,
                success = false,
                error = "सेटिंग्स खोलने में असमर्थ: ${e.message}"
            ).toJson()
        }
    }

    private fun handleAccessibilityAction(request: NativeActionRequest): String {
        if (!IstikharAccessibilityService.isServiceEnabled(activity)) {
            return NativeActionResponse(
                executed = false,
                success = false,
                error = "AccessibilityService सक्षम नहीं है। कृपया फोन सेटिंग्स > एक्सेसिबिलिटी में जाकर 'ISTIKHAR AI' को चालू करें।"
            ).toJson()
        }

        val service = IstikharAccessibilityService.getInstance()
            ?: return NativeActionResponse(
                executed = false,
                success = false,
                error = "AccessibilityService कनेक्टेड नहीं है।"
            ).toJson()

        return when (request.action) {
            "accessibility.action.READ_SCREEN" -> {
                val elements = service.readScreenElements()
                NativeActionResponse(
                    executed = true,
                    success = true,
                    message = "स्क्रीन से ${elements.size} टेक्स्ट तत्व पढ़े गए",
                    data = mapOf("elements" to elements)
                ).toJson()
            }
            "accessibility.action.CLICK_NODE" -> {
                val target = request.extras["targetViewId"] as? String
                    ?: request.extras["targetText"] as? String ?: ""
                val clicked = service.performClickOnElement(target)
                NativeActionResponse(
                    executed = true,
                    success = clicked,
                    message = if (clicked) "तत्व पर सफलतापूर्वक क्लिक किया गया" else "तत्व नहीं मिला अथवा क्लिक करने में असमर्थ"
                ).toJson()
            }
            else -> NativeActionResponse(
                executed = false,
                success = false,
                error = "असमर्थित एक्सेसिबिलिटी एक्शन"
            ).toJson()
        }
    }

    private fun handleAppLaunch(pkgName: String, fallbackUrl: String? = null): String {
        if (!BridgeActionAllowlist.isPackageAllowed(pkgName)) {
            return NativeActionResponse(
                executed = false,
                success = false,
                error = "ऐप $pkgName सुरक्षा सूची में अधिकृत नहीं है।"
            ).toJson()
        }

        val launchIntent = activity.packageManager.getLaunchIntentForPackage(pkgName)
        return if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            activity.startActivity(launchIntent)
            NativeActionResponse(
                executed = true,
                success = true,
                message = "ऐप $pkgName सफलतापूर्वक खोला गया"
            ).toJson()
        } else {
            // If app is not installed, but fallback website is available (e.g. YouTube web)
            val webFallback = fallbackUrl ?: when (pkgName) {
                "com.google.android.youtube" -> "https://www.youtube.com"
                "com.spotify.music" -> "https://open.spotify.com"
                "com.google.android.apps.maps" -> "https://maps.google.com"
                "com.android.chrome" -> "https://www.google.com"
                else -> null
            }

            if (webFallback != null) {
                try {
                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(webFallback)).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    activity.startActivity(browserIntent)
                    NativeActionResponse(
                        executed = true,
                        success = true,
                        message = "ऐप $pkgName फोन में स्थापित नहीं था, इसलिए इसकी आधिकारिक वेबसाइट खोली गई: $webFallback"
                    ).toJson()
                } catch (e: Exception) {
                    NativeActionResponse(
                        executed = true,
                        success = false,
                        error = "ऐप $pkgName फोन में स्थापित नहीं है और वेब पेज खोलने में त्रुटि: ${e.message}"
                    ).toJson()
                }
            } else {
                NativeActionResponse(
                    executed = true,
                    success = false,
                    error = "ऐप $pkgName फोन में स्थापित (Installed) नहीं है।"
                ).toJson()
            }
        }
    }

    private fun handleHomeScreenAction(): String {
        return try {
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            activity.startActivity(homeIntent)
            NativeActionResponse(
                executed = true,
                success = true,
                message = "फोन की होम स्क्रीन खोली गई"
            ).toJson()
        } catch (e: Exception) {
            NativeActionResponse(
                executed = true,
                success = false,
                error = "होम स्क्रीन खोलने में त्रुटि: ${e.message}"
            ).toJson()
        }
    }

    private fun handleSensitiveActionWithConfirmation(request: NativeActionRequest): String {
        val latch = CountDownLatch(1)
        var confirmed = false

        val detailText = when (request.action) {
            "android.intent.action.CALL" -> "फ़ोन कॉल: ${request.dataUri}"
            "android.intent.action.SENDTO", "android.intent.action.SEND" -> "संदेश (SMS): ${request.extras["sms_body"] ?: request.dataUri}"
            "action.device.DELETE_DATA" -> "डेटा हटाना: ${request.extras["target"] ?: "फ़ाइलें"}"
            else -> request.action
        }

        SensitiveActionConfirmationDialog.show(
            activity = activity,
            actionTitle = "कार्रवाई: ${request.action}",
            actionDetails = detailText,
            onConfirmed = {
                confirmed = true
                latch.countDown()
            },
            onRejected = {
                confirmed = false
                latch.countDown()
            }
        )

        // Wait up to 30 seconds for user response
        latch.await(30, TimeUnit.SECONDS)

        return if (confirmed) {
            // Execute the confirmed sensitive action
            dispatchGenericIntent(request)
        } else {
            NativeActionResponse(
                executed = true,
                success = false,
                requiresConfirmation = true,
                error = "उपयोगकर्ता द्वारा संवेदनशील कार्रवाई अस्वीकार कर दी गई (User rejected confirmation)"
            ).toJson()
        }
    }

    private fun dispatchGenericIntent(request: NativeActionRequest): String {
        val intent = Intent(request.action).apply {
            request.dataUri?.let { data = Uri.parse(it) }
            request.category?.let { addCategory(it) }
            request.extras.forEach { (k, v) ->
                when (v) {
                    is String -> putExtra(k, v)
                    is Int -> putExtra(k, v)
                    is Boolean -> putExtra(k, v)
                    is Long -> putExtra(k, v)
                    else -> putExtra(k, v.toString())
                }
            }
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivity(intent)
                NativeActionResponse(
                    executed = true,
                    success = true,
                    message = "इंटेंट सफलतापूर्वक निष्पादित किया गया: ${request.action}"
                ).toJson()
            } else {
                NativeActionResponse(
                    executed = true,
                    success = false,
                    error = "इस इंटेंट को संभालने के लिए कोई ऐप नहीं मिला: ${request.action}"
                ).toJson()
            }
        } catch (e: Exception) {
            NativeActionResponse(
                executed = true,
                success = false,
                error = "इंटेंट निष्पादन त्रुटि: ${e.message}"
            ).toJson()
        }
    }
}
