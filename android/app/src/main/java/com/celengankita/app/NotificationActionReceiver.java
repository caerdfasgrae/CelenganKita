package com.celengankita.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class NotificationActionReceiver extends BroadcastReceiver {

    public static final String ACTION_CONFIRM = "com.celengankita.app.ACTION_CONFIRM";
    public static final String ACTION_DISMISS = "com.celengankita.app.ACTION_DISMISS";
    private static final String WEBHOOK_URL = "https://celengan-kita-two.vercel.app/api/v1/webhook/notify";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        int notificationId = intent.getIntExtra("notificationId", 0);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null && notificationId != 0) {
            manager.cancel(notificationId);
        }

        String action = intent.getAction();

        if (ACTION_CONFIRM.equals(action)) {
            String packageName = intent.getStringExtra("packageName");
            String rawText = intent.getStringExtra("rawText");

            // Ambil kunci API Space dari SharedPreferences jika tersimpan di aplikasi
            SharedPreferences prefs = context.getSharedPreferences("celengan_prefs", Context.MODE_PRIVATE);
            String apiKey = prefs.getString("webhook_api_key", "");

            Toast.makeText(context, "Memasukkan transaksi ke CelenganKita...", Toast.LENGTH_SHORT).show();

            // Kirim notifikasi secara asynchronous ke endpoint webhook CelenganKita
            new Thread(() -> {
                try {
                    URL url = new URL(WEBHOOK_URL);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);
                    conn.setDoOutput(true);

                    if (!apiKey.isEmpty()) {
                        conn.setRequestProperty("X-Celengan-Key", apiKey);
                    }

                    String jsonPayload = String.format(
                        "{\"app\":\"%s\",\"text\":\"%s\"}",
                        escapeJson(packageName != null ? packageName : "Android Companion"),
                        escapeJson(rawText != null ? rawText : "")
                    );

                    byte[] outputInBytes = jsonPayload.getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(outputInBytes);
                    }

                    int responseCode = conn.getResponseCode();
                    new Handler(Looper.getMainLooper()).post(() -> {
                        if (responseCode >= 200 && responseCode < 300) {
                            Toast.makeText(context, "✅ Berhasil dicatat ke antrean validasi CelenganKita!", Toast.LENGTH_LONG).show();
                        } else {
                            Toast.makeText(context, "Buka CelenganKita untuk meninjau transaksi.", Toast.LENGTH_SHORT).show();
                        }
                    });
                } catch (Exception e) {
                    new Handler(Looper.getMainLooper()).post(() -> {
                        Toast.makeText(context, "Disimpan! Tinjau di menu Validasi CelenganKita.", Toast.LENGTH_SHORT).show();
                    });
                }
            }).start();
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
