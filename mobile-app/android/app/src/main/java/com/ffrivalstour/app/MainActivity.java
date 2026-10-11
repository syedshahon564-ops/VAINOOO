package com.ffrivalstour.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastBackPressTime = 0;
    private static final long BACK_PRESS_INTERVAL = 2000; // 2 seconds

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register OnBackPressedCallback on AndroidX Dispatcher to intercept BOTH system button and gesture navigation
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleSystemBack();
            }
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);

            // Handle file downloads (e.g. APK update download) in external browser / Download Manager
            webView.setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        }
    }

    private void handleSystemBack() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            handleDoublePressExit();
            return;
        }

        final WebView webView = getBridge().getWebView();

        // 1. Query JavaScript: checks inputs/modals first, then subpages/categories/tabs
        webView.evaluateJavascript(
            "(function(){ " +
            "  try { " +
            "    if (typeof window.__handleAndroidBack === 'function') { " +
            "      return window.__handleAndroidBack() ? 'HANDLED' : 'NOT_HANDLED'; " +
            "    } " +
            "  } catch(e) {} " +
            "  return 'NO_HANDLER'; " +
            "})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if (value != null && value.contains("HANDLED") && !value.contains("NOT_HANDLED")) {
                        // Handled by in-page handler (modal closed, category closed, tab switched, etc.)
                        return;
                    }

                    // 2. Not handled by in-page handler: check if browser/WebView has navigation history
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        @Override
                        public void run() {
                            if (webView.canGoBack()) {
                                webView.goBack();
                            } else {
                                // 3. No history exists: prevent accidental exit via double back press within 2s
                                handleDoublePressExit();
                            }
                        }
                    });
                }
            }
        );
    }

    private void handleDoublePressExit() {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastBackPressTime < BACK_PRESS_INTERVAL) {
            finish();
        } else {
            lastBackPressTime = currentTime;
            Toast.makeText(this, "অ্যাপ থেকে বের হতে আবার ব্যাক চাপুন", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        handleSystemBack();
    }
}
