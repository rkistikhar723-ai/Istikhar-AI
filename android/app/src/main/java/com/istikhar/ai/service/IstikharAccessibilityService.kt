package com.istikhar.ai.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Native Android AccessibilityService for ISTIKHAR AI.
 * Used exclusively for explicitly authorized user interactions.
 * Security safeguards:
 * - Strictly ignores password and secure input fields.
 * - Does not log sensitive keystrokes.
 * - Only operates when user explicitly enables this service in Android Settings.
 */
class IstikharAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "ISTIKHAR_ACCESSIBILITY"
        private var instance: IstikharAccessibilityService? = null

        fun getInstance(): IstikharAccessibilityService? = instance

        /**
         * Checks whether the user has enabled this AccessibilityService in system settings
         */
        fun isServiceEnabled(context: Context): Boolean {
            val expectedServiceName = "${context.packageName}/${IstikharAccessibilityService::class.java.canonicalName}"
            val enabledServicesSetting = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServicesSetting)
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(expectedServiceName, ignoreCase = true)) {
                    return true
                }
            }
            return false
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "ISTIKHAR AccessibilityService connected and initialized.")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "ISTIKHAR AccessibilityService destroyed.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Passive monitoring is disabled; actions are triggered on-demand by explicit user commands
    }

    override fun onInterrupt() {
        Log.w(TAG, "AccessibilityService interrupted.")
    }

    /**
     * Reads all visible text elements on the active phone screen.
     * Password fields are strictly excluded for privacy and security.
     */
    fun readScreenElements(): List<String> {
        val rootNode = rootInActiveWindow ?: return emptyList()
        val textList = mutableListOf<String>()

        fun traverse(node: AccessibilityNodeInfo?) {
            if (node == null) return

            // PRIVACY SAFEGUARD: Do not read password fields
            if (node.isPassword) {
                return
            }

            node.text?.let {
                val str = it.toString().trim()
                if (str.isNotEmpty() && !textList.contains(str)) {
                    textList.add(str)
                }
            }
            node.contentDescription?.let {
                val str = it.toString().trim()
                if (str.isNotEmpty() && !textList.contains(str)) {
                    textList.add(str)
                }
            }

            for (i in 0 until node.childCount) {
                traverse(node.getChild(i))
            }
        }

        traverse(rootNode)
        return textList
    }

    /**
     * Performs a click on an authorized view element by ID or text match.
     */
    fun performClickOnElement(targetIdOrText: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false

        // Try by View ID first
        val nodesById = rootNode.findAccessibilityNodeInfosByViewId(targetIdOrText)
        if (nodesById.isNotEmpty()) {
            for (node in nodesById) {
                if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    return true
                }
            }
        }

        // Try by text match
        val nodesByText = rootNode.findAccessibilityNodeInfosByText(targetIdOrText)
        if (nodesByText.isNotEmpty()) {
            for (node in nodesByText) {
                if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    return true
                }
                // Try parent if parent is clickable
                node.parent?.let { parent ->
                    if (parent.isClickable && parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                        return true
                    }
                }
            }
        }

        return false
    }
}
