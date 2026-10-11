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
        // Request runtime notification permission on Android 13+ (API 33+)
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    public class WebAppInterface {
        @android.webkit.JavascriptInterface
        public void requestNotificationPermission() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (android.os.Build.VERSION.SDK_INT >= 33) {
                        if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
                        }
                    } else {
                        openNotificationSettings();
                    }
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void openNotificationSettings() {
            try {
                Intent intent = new Intent();
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    intent.setAction(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
                } else {
                    intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
                    intent.putExtra("app_package", getPackageName());
                    intent.putExtra("app_uid", getApplicationInfo().uid);
                }
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @android.webkit.JavascriptInterface
        public void exitApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    finishAffinity();
                }
            });
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            webView.clearCache(true);
            try {
                android.webkit.WebStorage.getInstance().deleteAllData();
            } catch (Exception ignored) {}
            webView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");

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
                public void onReceiveValue(final String value) {
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        @Override
                        public void run() {
                            if (value != null && value.contains("HANDLED") && !value.contains("NOT_HANDLED")) {
                                // Handled by in-page handler (modal closed, category closed, tab switched, or exit toast shown)
                                return;
                            }

                            if (value != null && value.contains("NOT_HANDLED")) {
                                // In-page handler confirmed 2nd back press within 2s -> exit activity cleanly
                                finish();
                                return;
                            }

                            // 2. Not handled by in-page handler: check if browser/WebView has navigation history
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
