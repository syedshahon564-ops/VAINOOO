package com.ffrivalstour.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class PayBotKeepAliveService extends Service {
    public static final String CHANNEL_ID = "ff_paybot_service_channel";
    public static final int NOTIFICATION_ID = 2026;
    public static final String PREFS_NAME = "ff_paybot_prefs";
    public static final String PREF_ALWAYS_ON = "always_on";
    public static final String PREF_PHONE = "device_phone";
    public static final String PREF_NAME_KEY = "device_name";

    private static volatile boolean isRunning = false;
    private ScheduledExecutorService scheduler;
    private PowerManager.WakeLock wakeLock;
    private String currentPhone = "01799000001";
    private String currentDeviceName = "PAYBOT_DEVICE_1";

    public static boolean isServiceRunning() {
        return isRunning;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FFRivals::PayBotWakeLock");
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire(10 * 60 * 1000L /* 10 mins auto-release guard */);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        if (intent != null) {
            String phoneExtra = intent.getStringExtra("phone");
            String nameExtra = intent.getStringExtra("deviceName");
            if (phoneExtra != null && !phoneExtra.trim().isEmpty()) {
                currentPhone = phoneExtra.trim();
                prefs.edit().putString(PREF_PHONE, currentPhone).apply();
            }
            if (nameExtra != null && !nameExtra.trim().isEmpty()) {
                currentDeviceName = nameExtra.trim();
                prefs.edit().putString(PREF_NAME_KEY, currentDeviceName).apply();
            }
        } else {
            currentPhone = prefs.getString(PREF_PHONE, "01799000001");
            currentDeviceName = prefs.getString(PREF_NAME_KEY, "PAYBOT_DEVICE_1");
        }

        prefs.edit().putBoolean(PREF_ALWAYS_ON, true).apply();
        isRunning = true;

        Notification notification = buildNotification(currentPhone, currentDeviceName);

        try {
            if (Build.VERSION.SDK_INT >= 34) { // Android 14+
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) { // Android 10+
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            e.printStackTrace();
            try {
                startForeground(NOTIFICATION_ID, notification);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }

        startHeartbeatLoop();

        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "FF Rivals PayBot Background Service",
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Keeps PayBot auto-collector connected 24/7 in the background");
                channel.setShowBadge(false);
                NotificationManager manager = getSystemService(NotificationManager.class);
                if (manager != null) {
                    manager.createNotificationChannel(channel);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private Notification buildNotification(String phone, String name) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getActivity(this, 101, openIntent, pendingFlags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("⚡ FF Rivals PayBot সক্রিয় (Always Connected)")
            .setContentText("কালেক্টর: " + phone + " • বিকাশ/নগদ অটো-পেমেন্ট ব্যাকগ্রাউন্ডে চলছে")
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText("ডিভাইস অনলাইন: " + name + " (" + phone + ")\nবিকাশ ও নগদ অটো-ডিপোজিট মেসেজ রিসিভ করতে ব্যাকগ্রাউন্ডে সর্বদা সক্রিয় রয়েছে। গেম খেললেও বা অ্যাপ কেটে দিলেও কানেক্ট থাকবে।"))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pi)
            .build();
    }

    private void startHeartbeatLoop() {
        if (scheduler != null && !scheduler.isShutdown()) {
            return;
        }
        scheduler = Executors.newSingleThreadScheduledExecutor();
        // Ping immediately once, then every 15 seconds
        scheduler.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                sendPingToServer();
            }
        }, 1, 15, TimeUnit.SECONDS);
    }

    private void sendPingToServer() {
        HttpURLConnection conn = null;
        try {
            int battery = getBatteryPercentage();
            URL url = new URL("https://ffrivalstourbd.com/api/webhook/payment?key=ff_rivals_secure_sms_key_2026");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("x-api-key", "ff_rivals_secure_sms_key_2026");
            conn.setRequestProperty("x-device-name", currentDeviceName);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setDoOutput(true);

            String jsonBody = "{"
                + "\"type\":\"PING\","
                + "\"deviceName\":\"" + escapeJson(currentDeviceName) + " (" + escapeJson(currentPhone) + ")\","
                + "\"phone\":\"" + escapeJson(currentPhone) + "\","
                + "\"status\":\"ONLINE\","
                + "\"service\":\"NATIVE_FOREGROUND_ALWAYS_ON\","
                + "\"battery\":" + battery
                + "}";

            byte[] bytes = jsonBody.getBytes(StandardCharsets.UTF_8);
            conn.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
                os.flush();
            }
            int respCode = conn.getResponseCode();
            // Connection successful
        } catch (Exception e) {
            // Silently retry on next scheduled interval
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Exception ignored) {}
            }
        }
    }

    private int getBatteryPercentage() {
        try {
            BatteryManager bm = (BatteryManager) getSystemService(BATTERY_SERVICE);
            if (bm != null) {
                return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            }
        } catch (Exception ignored) {}
        return 95;
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\"", "\\\"");
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (scheduler != null) {
            try { scheduler.shutdownNow(); } catch (Exception ignored) {}
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
