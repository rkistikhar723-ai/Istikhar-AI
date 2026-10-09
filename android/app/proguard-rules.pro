# Keep JavaScript Interface methods so WebView bridge works in release mode
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.istikhar.ai.bridge.** { *; }
-keep class com.istikhar.ai.service.** { *; }
