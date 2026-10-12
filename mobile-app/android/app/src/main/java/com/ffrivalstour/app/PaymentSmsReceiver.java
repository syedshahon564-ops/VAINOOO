package com.ffrivalstour.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

/**
 * PaymentSmsReceiver
 * Native Android background receiver for automatic bKash & Nagad SMS detection.
 * Listens to incoming SMS, parses TrxID, sender number, and amount,
 * then instantly forwards the transaction to the PayBot microservice webhook.
 */
public class PaymentSmsReceiver extends BroadcastReceiver {
    private static final String TAG = "PaymentSmsReceiver";
    private static final String WEBHOOK_URL = "https://web-production-2c40b.up.railway.app/api/webhook/payment";
    private static final String API_KEY = "ff_rivals_secure_sms_key_2026";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                try {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    if (pdus != null) {
                        for (Object pdu : pdus) {
                            SmsMessage message = SmsMessage.createFromPdu((byte[]) pdu);
                            if (message != null) {
                                String sender = message.getDisplayOriginatingAddress();
                                String body = message.getMessageBody();
                                Log.d(TAG, "Incoming SMS from: " + sender);
                                processSms(sender, body);
                            }
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error parsing SMS bundle", e);
                }
            }
        }
    }

    private void processSms(String sender, String body) {
        if (body == null || body.trim().isEmpty()) return;
        String lower = body.toLowerCase();

        boolean isBkash = lower.contains("bkash") || (sender != null && sender.contains("16247")) || lower.contains("trxid");
        boolean isNagad = lower.contains("nagad") || (sender != null && sender.contains("16167")) || lower.contains("txnid");

        // Only process financial SMS containing transaction identifiers
        if (!isBkash && !isNagad) {
            return;
        }

        String provider = isBkash ? "BKASH" : "NAGAD";
        String trxId = extractRegex(body, "(?:TrxID|TxnID|trxid|txnid)[:\\s]*([A-Za-z0-9]+)");
        String amountStr = extractRegex(body, "(?:Tk|BDT|Tk\\.)[:\\s]*([0-9]+(?:\\.[0-9]+)?)");
        String senderPhone = extractRegex(body, "(?:from|Sender)[:\\s]*([0-9]{11})");

        if (trxId == null || trxId.length() < 6) {
            return;
        }
        if (amountStr == null) {
            return;
        }

        double parsedAmount = 0.0;
        try {
            parsedAmount = Double.parseDouble(amountStr);
        } catch (Exception e) {
            return;
        }

        final double amount = parsedAmount;
        final String finalSender = senderPhone != null ? senderPhone : (sender != null ? sender : "Unknown");
        final String finalTrxId = trxId.toUpperCase();

        Log.i(TAG, "⚡ Detected " + provider + " Payment: TrxID=" + finalTrxId + ", Amount=" + amount + ", Sender=" + finalSender);

        // Forward to Webhook asynchronously in background thread
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(WEBHOOK_URL);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    conn.setRequestProperty("x-api-key", API_KEY);
                    conn.setRequestProperty("x-device-name", android.os.Build.MODEL + " (Native PayBot)");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(10000);

                    JSONObject json = new JSONObject();
                    json.put("provider", provider);
                    json.put("sender", finalSender);
                    json.put("amount", amount);
                    json.put("trx_id", finalTrxId);
                    json.put("raw_message", body);

                    byte[] outputInBytes = json.toString().getBytes("UTF-8");
                    OutputStream os = conn.getOutputStream();
                    os.write(outputInBytes);
                    os.flush();
                    os.close();

                    int responseCode = conn.getResponseCode();
                    Log.i(TAG, "Webhook HTTP Response Code: " + responseCode);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to deliver SMS to Webhook", e);
                } finally {
                    if (conn != null) {
                        conn.disconnect();
                    }
                }
            }
        }).start();
    }

    private String extractRegex(String text, String regex) {
        Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }
}
