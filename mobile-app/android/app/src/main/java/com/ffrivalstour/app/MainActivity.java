package com.ffrivalstour.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.BridgeActivity;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public class MainActivity extends BridgeActivity {
    private long lastBackPressTime = 0;
    private static final long BACK_PRESS_INTERVAL = 2000; // 2 seconds
    public static final String NOTIFICATION_CHANNEL_ID = "ff_rivals_alerts";
    public static final String NOTIFICATION_CHANNEL_NAME = "FF Rivals Alerts";

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

        // Initialize Android O+ Notification Channel
        createNotificationChannel();

        // Request runtime notification permission on Android 13+ (API 33+)
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            try {
                NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    NOTIFICATION_CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Tournaments, Match Room IDs & Wallet Updates");
                channel.enableLights(true);
                channel.enableVibration(true);
                NotificationManager manager = getSystemService(NotificationManager.class);
                if (manager != null) {
                    manager.createNotificationChannel(channel);
                }
            } catch (Exception e) {
                e.printStackTrace();
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
        public String getClipboardText() {
            try {
                final AtomicReference<String> clipText = new AtomicReference<>("");
                final CountDownLatch latch = new CountDownLatch(1);
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                            if (clipboard != null && clipboard.hasPrimaryClip() && clipboard.getPrimaryClip().getItemCount() > 0) {
                                ClipData.Item item = clipboard.getPrimaryClip().getItemAt(0);
                                CharSequence text = item.coerceToText(MainActivity.this);
                                if (text != null) {
                                    clipText.set(text.toString());
                                }
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        } finally {
                            latch.countDown();
                        }
                    }
                });
                latch.await(600, TimeUnit.MILLISECONDS);
                return clipText.get();
            } catch (Exception e) {
                e.printStackTrace();
            }
            return "";
        }

        @android.webkit.JavascriptInterface
        public void setClipboardText(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                        if (clipboard != null) {
                            ClipData clip = ClipData.newPlainText("FF Rivals", text != null ? text : "");
                            clipboard.setPrimaryClip(clip);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void showNativeNotification(final String title, final String message, final String targetUrl) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                        if (manager == null) return;

                        Intent intent = new Intent(MainActivity.this, MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        if (targetUrl != null && !targetUrl.isEmpty()) {
                            intent.putExtra("target_url", targetUrl);
                        }

                        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                            flags |= PendingIntent.FLAG_IMMUTABLE;
                        }
                        PendingIntent pendingIntent = PendingIntent.getActivity(
                            MainActivity.this,
                            (int) System.currentTimeMillis(),
                            intent,
                            flags
                        );

                        NotificationCompat.Builder builder = new NotificationCompat.Builder(MainActivity.this, NOTIFICATION_CHANNEL_ID)
                            .setSmallIcon(R.mipmap.ic_launcher)
                            .setContentTitle(title != null ? title : "FF Rivals")
                            .setContentText(message != null ? message : "")
                            .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                            .setPriority(NotificationCompat.PRIORITY_HIGH)
                            .setAutoCancel(true)
                            .setContentIntent(pendingIntent);

                        manager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
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
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setJavaScriptEnabled(true);

            // Enable focus, long-click and paste context menu for Ridmik, Gboard and all keyboards
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);
            webView.setLongClickable(true);
            webView.setHapticFeedbackEnabled(true);

            // Support ServiceWorker in WebView on Android 7+ (API 24+)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                try {
                    android.webkit.ServiceWorkerController swController = android.webkit.ServiceWorkerController.getInstance();
                    swController.getServiceWorkerWebSettings().setBlockNetworkLoads(false);
                    swController.getServiceWorkerWebSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
                } catch (Exception e) {}
            }

            // Enable persistent session cookies so user is NEVER logged out on app exit
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

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

    @Override
    public void onPause() {
        super.onPause();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception e) {}
    }

    @Override
    public void onStop() {
        super.onStop();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception e) {}
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
