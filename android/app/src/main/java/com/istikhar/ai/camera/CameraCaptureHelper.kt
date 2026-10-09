package com.istikhar.ai.camera

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Manages Camera capture with explicit runtime permission handling and FileProvider support.
 */
class CameraCaptureHelper(
    private val activity: ComponentActivity,
    private val onCaptureResult: (success: Boolean, imageUri: Uri?, error: String?) -> Unit
) {

    private var currentPhotoUri: Uri? = null

    private val takePictureLauncher: ActivityResultLauncher<Uri> =
        activity.registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
            if (success) {
                onCaptureResult(true, currentPhotoUri, null)
            } else {
                onCaptureResult(false, null, "Camera capture was cancelled by user")
            }
        }

    fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun launchCamera(): Boolean {
        return try {
            val photoFile = createImageFile(activity)
            val photoUri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.fileprovider",
                photoFile
            )
            currentPhotoUri = photoUri
            takePictureLauncher.launch(photoUri)
            true
        } catch (e: Exception) {
            onCaptureResult(false, null, "Failed to launch camera: ${e.message}")
            false
        }
    }

    private fun createImageFile(context: Context): File {
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir: File? = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(
            "ISTIKHAR_IMG_${timeStamp}_",
            ".jpg",
            storageDir
        )
    }
}
