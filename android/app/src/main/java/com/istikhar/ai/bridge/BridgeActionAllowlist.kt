package com.istikhar.ai.bridge

/**
 * Strict Security Policy for ISTIKHAR AI Native Bridge.
 * Enforces an explicit allowlist of actions that web JavaScript can invoke.
 * Arbitrary intent reflection or unauthorized system modification is strictly rejected.
 */
object BridgeActionAllowlist {

    // Allowed Camera Actions
    val ALLOWED_CAMERA_ACTIONS = setOf(
        "android.media.action.IMAGE_CAPTURE",
        "android.media.action.STILL_IMAGE_CAMERA",
        "androidx.camera.action.CAPTURE"
    )

    // Allowed Photo & Gallery Actions
    val ALLOWED_GALLERY_ACTIONS = setOf(
        "android.intent.action.VIEW",
        "android.intent.action.PICK",
        "android.intent.action.GET_CONTENT"
    )

    // Allowed System Settings Actions
    val ALLOWED_SETTINGS_ACTIONS = setOf(
        "android.settings.SETTINGS",
        "android.settings.BLUETOOTH_SETTINGS",
        "android.settings.WIFI_SETTINGS",
        "android.settings.DISPLAY_SETTINGS",
        "android.settings.ACCESSIBILITY_SETTINGS",
        "android.settings.APPLICATION_DETAILS_SETTINGS",
        "android.settings.SOUND_SETTINGS",
        "android.settings.DATE_SETTINGS"
    )

    // Allowed App Launch Actions (Packages must be in allowlist or recognized safe intents)
    val ALLOWED_APP_PACKAGES = setOf(
        "com.whatsapp",
        "com.google.android.youtube",
        "com.android.chrome",
        "com.spotify.music",
        "com.google.android.apps.maps",
        "com.google.android.calculator",
        "com.google.android.deskclock",
        "com.google.android.gm"
    )

    // Allowed System Navigation Actions
    val ALLOWED_NAVIGATION_ACTIONS = setOf(
        "android.intent.action.MAIN"
    )

    // Actions that are categorized as SENSITIVE and REQUIRE explicit runtime user confirmation dialog
    val SENSITIVE_ACTIONS = setOf(
        "android.intent.action.CALL",
        "android.intent.action.SENDTO",
        "android.intent.action.SEND",
        "action.device.DELETE_DATA",
        "action.device.CLEAR_STORAGE"
    )

    // Supported Accessibility Actions
    val ALLOWED_ACCESSIBILITY_ACTIONS = setOf(
        "accessibility.action.READ_SCREEN",
        "accessibility.action.CLICK_NODE",
        "accessibility.action.SCROLL_FORWARD"
    )

    /**
     * Checks whether an action is permitted by the security policy
     */
    fun isActionAllowed(action: String, dataUri: String? = null): Boolean {
        if (action.isBlank()) return false

        if (ALLOWED_CAMERA_ACTIONS.contains(action)) return true
        if (ALLOWED_SETTINGS_ACTIONS.contains(action)) return true
        if (ALLOWED_ACCESSIBILITY_ACTIONS.contains(action)) return true
        if (SENSITIVE_ACTIONS.contains(action)) return true // Allowed ONLY with explicit user confirmation dialog

        if (ALLOWED_GALLERY_ACTIONS.contains(action)) {
            // Must target image or media content
            if (dataUri == null || dataUri.contains("images") || dataUri.contains("media")) {
                return true
            }
        }

        // Generic launch intent action
        if (action == "android.intent.action.MAIN") return true

        return false
    }

    /**
     * Identifies if an action requires explicit user confirmation before proceeding
     */
    fun isSensitiveAction(action: String): Boolean {
        return SENSITIVE_ACTIONS.contains(action)
    }

    /**
     * Checks if a package is allowed to be launched
     */
    fun isPackageAllowed(packageName: String): Boolean {
        return ALLOWED_APP_PACKAGES.contains(packageName)
    }
}
