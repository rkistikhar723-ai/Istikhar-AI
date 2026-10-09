package com.istikhar.ai.security

import android.app.Activity
import androidx.appcompat.app.AlertDialog
import com.istikhar.ai.R

/**
 * Handles explicit user confirmation for sensitive actions (calls, SMS, data deletion).
 * Prevents automated background abuse by ensuring the phone owner confirms the action.
 */
object SensitiveActionConfirmationDialog {

    fun show(
        activity: Activity,
        actionTitle: String,
        actionDetails: String,
        onConfirmed: () -> Unit,
        onRejected: () -> Unit
    ) {
        activity.runOnUiThread {
            AlertDialog.Builder(activity)
                .setTitle(activity.getString(R.string.confirmation_title))
                .setMessage("क्या आप इस संवेदनशील कार्रवाई की पुष्टि करते हैं?\n\n$actionTitle\n$actionDetails")
                .setIcon(android.R.drawable.ic_dialog_alert)
                .setPositiveButton(activity.getString(R.string.confirmation_confirm)) { dialog, _ ->
                    dialog.dismiss()
                    onConfirmed()
                }
                .setNegativeButton(activity.getString(R.string.confirmation_cancel)) { dialog, _ ->
                    dialog.dismiss()
                    onRejected()
                }
                .setCancelable(false)
                .show()
        }
    }
}
