package com.istikhar.ai.bridge

import org.json.JSONObject

/**
 * Payload sent from JavaScript WebView to the native bridge
 */
data class NativeActionRequest(
    val action: String,
    val category: String? = null,
    val dataUri: String? = null,
    val component: String? = null,
    val extras: Map<String, Any> = emptyMap(),
    val requiredPermission: String? = null,
    val requiredService: String? = null
) {
    companion object {
        fun fromJson(jsonStr: String): NativeActionRequest {
            val json = JSONObject(jsonStr)
            val extrasMap = mutableMapOf<String, Any>()
            if (json.has("extras") && !json.isNull("extras")) {
                val extrasObj = json.getJSONObject("extras")
                extrasObj.keys().forEach { key ->
                    extrasMap[key] = extrasObj.get(key)
                }
            }

            return NativeActionRequest(
                action = json.optString("action", ""),
                category = json.optString("category", "").takeIf { it.isNotEmpty() },
                dataUri = json.optString("dataUri", "").takeIf { it.isNotEmpty() },
                component = json.optString("component", "").takeIf { it.isNotEmpty() },
                extras = extrasMap,
                requiredPermission = json.optString("requiredPermission", "").takeIf { it.isNotEmpty() },
                requiredService = json.optString("requiredService", "").takeIf { it.isNotEmpty() }
            )
        }
    }
}

/**
 * Response returned from native bridge to JavaScript WebView
 */
data class NativeActionResponse(
    val executed: Boolean,
    val success: Boolean,
    val error: String? = null,
    val message: String? = null,
    val requiresConfirmation: Boolean = false,
    val data: Map<String, Any>? = null
) {
    fun toJson(): String {
        val json = JSONObject()
        json.put("executed", executed)
        json.put("success", success)
        if (error != null) json.put("error", error)
        if (message != null) json.put("message", message)
        json.put("requiresConfirmation", requiresConfirmation)
        if (data != null) {
            val dataObj = JSONObject()
            data.forEach { (k, v) -> dataObj.put(k, v) }
            json.put("data", dataObj)
        }
        return json.toString()
    }
}
