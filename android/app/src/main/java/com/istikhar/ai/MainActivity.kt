package com.istikhar.ai

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import com.istikhar.ai.bridge.IstikharNativeBridge
import com.istikhar.ai.camera.CameraCaptureHelper
import com.istikhar.ai.databinding.ActivityMainBinding
import com.istikhar.ai.gallery.PhotoGalleryHelper

/**
 * Native Android WebView Wrapper for ISTIKHAR AI.
 * Hosts the mobile-first frontend from local bundled assets with WebViewAssetLoader,
 * ensuring 100% offline reliability, instant startup, and zero blank error screens.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cameraHelper: CameraCaptureHelper
    private lateinit var galleryHelper: PhotoGalleryHelper
    private lateinit var nativeBridge: IstikharNativeBridge

    // Local bundled assets entrypoint - 100% reliable, zero network dependency, no blank screen
    private val localAppUrl: String = "https://appassets.androidplatform.net/assets/www/index.html"

    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val recordAudioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        if (!recordAudioGranted) {
            Toast.makeText(this, "माइक्रोफ़ोन अनुमति अस्वीकार की गई (Microphone permission required for voice)", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initHelpers()
        setupWebView()
        requestCorePermissions()
        handleBackNavigation()

        // Check if user set a custom remote web URL; otherwise boot instantly from bundled offline assets
        val prefs = getSharedPreferences("istikhar_prefs", Context.MODE_PRIVATE)
        val customRemoteUrl = prefs.getString("remote_web_url", "")
        val targetUrl = if (!customRemoteUrl.isNullOrBlank()) customRemoteUrl else localAppUrl

        binding.webView.loadUrl(targetUrl)
    }

    private fun initHelpers() {
        cameraHelper = CameraCaptureHelper(this) { success, uri, error ->
            if (success && uri != null) {
                runOnUiThread {
                    Toast.makeText(this, "फोटो सफलतापूर्वक ली गई: $uri", Toast.LENGTH_SHORT).show()
                    binding.webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('istikhar:photo_captured', { detail: { uri: '$uri' } }));",
                        null
                    )
                }
            } else if (error != null) {
                runOnUiThread {
                    Toast.makeText(this, "कैमरा त्रुटि: $error", Toast.LENGTH_SHORT).show()
                }
            }
        }

        galleryHelper = PhotoGalleryHelper(this) { uri ->
            if (uri != null) {
                runOnUiThread {
                    binding.webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('istikhar:photo_selected', { detail: { uri: '$uri' } }));",
                        null
                    )
                }
            }
        }

        nativeBridge = IstikharNativeBridge(this, cameraHelper, galleryHelper)
    }

    private fun setupWebView() {
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        binding.webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            // Bind the secure Native Bridge into window.IstikharNativeBridge
            addJavascriptInterface(nativeBridge, "IstikharNativeBridge")

            webChromeClient = object : WebChromeClient() {
                // Grant microphone and audio capture permission to WebView
                override fun onPermissionRequest(request: PermissionRequest?) {
                    request?.let {
                        val resources = it.resources
                        val requestedAudio = resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                        if (requestedAudio) {
                            it.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        } else {
                            it.grant(resources)
                        }
                    }
                }

                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    if (newProgress < 100) {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.progressBar.progress = newProgress
                    } else {
                        binding.progressBar.visibility = View.GONE
                    }
                }
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    return request?.url?.let { assetLoader.shouldInterceptRequest(it) }
                }

                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    binding.progressBar.visibility = View.VISIBLE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    binding.progressBar.visibility = View.GONE
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    if (request?.isForMainFrame == true) {
                        val failingUrl = request.url?.toString() ?: ""
                        if (!failingUrl.contains("appassets.androidplatform.net") && !failingUrl.startsWith("file:///android_asset")) {
                            // Remote server was unreachable: smoothly fall back to bundled offline assets
                            runOnUiThread {
                                Toast.makeText(
                                    this@MainActivity,
                                    "रिमोट सर्वर अनुपलब्ध। स्थानीय ऑफ़लाइन मोड में लोड हो रहा है...",
                                    Toast.LENGTH_SHORT
                                ).show()
                                binding.webView.loadUrl(localAppUrl)
                            }
                            return
                        }
                    }
                    super.onReceivedError(view, request, error)
                }
            }
        }
    }

    private fun requestCorePermissions() {
        val permissionsToRequest = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }

        val missingPermissions = permissionsToRequest.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            requestPermissionsLauncher.launch(missingPermissions.toTypedArray())
        }
    }

    private fun handleBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }
}
