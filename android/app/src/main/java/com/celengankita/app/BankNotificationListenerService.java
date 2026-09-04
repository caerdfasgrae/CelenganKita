package com.celengankita.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BankNotificationListenerService extends NotificationListenerService {

    private static final String TAG = "CelenganNotification";
    private static final String CHANNEL_ID = "celengan_detection_channel";

    // Daftar paket aplikasi m-banking dan e-wallet Indonesia yang didukung
    private static final String[] SUPPORTED_PACKAGES = {
        "com.bca",
        "com.bca.mobile",
        "com.bankmandiri.livin",
        "com.gojek.app",
        "com.shopee.id",
        "id.co.bri.brimo",
        "com.bni.mbanking",
        "com.seabank.id",
        "id.dana",
        "com.telkom.indonesia.o2o"
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;

        String packageName = sbn.getPackageName();
        if (!isSupportedPackage(packageName)) return;

        Bundle extras = sbn.getNotification().extras;
        if (extras == null) return;

        CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextSeq = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleSeq != null ? titleSeq.toString() : "";
        String text = bigTextSeq != null ? bigTextSeq.toString() : (textSeq != null ? textSeq.toString() : "");
        String combined = (title + " " + text).trim();

        if (combined.isEmpty()) return;

        // Ekstraksi nominal pembayaran dengan regex
        Pattern rpPattern = Pattern.compile("(?:rp|idr)\\s*([0-9.,]{3,})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = rpPattern.matcher(combined);

        String detectedAmount = "";
        if (matcher.find()) {
            detectedAmount = matcher.group(1);
        }

        // Coba ekstraksi merchant atau gunakan nama aplikasi
        String merchant = getAppName(packageName);
        Pattern diKePattern = Pattern.compile("(?:di|ke)\\s+([a-zA-Z0-9\\s/&-]{3,25})", Pattern.CASE_INSENSITIVE);
        Matcher merchantMatcher = diKePattern.matcher(combined);
        if (merchantMatcher.find()) {
            merchant = merchantMatcher.group(1).trim();
        }

        // HUMAN-IN-THE-LOOP: Tampilkan notifikasi interaktif ke pengguna
        showHumanInTheLoopNotification(packageName, combined, detectedAmount, merchant);
    }

    private boolean isSupportedPackage(String pkg) {
        if (pkg == null) return false;
        for (String supported : SUPPORTED_PACKAGES) {
            if (pkg.equalsIgnoreCase(supported) || pkg.contains("bca") || pkg.contains("mandiri") || pkg.contains("gopay") || pkg.contains("shopee") || pkg.contains("brimo") || pkg.contains("seabank")) {
                return true;
            }
        }
        return false;
    }

    private String getAppName(String pkg) {
        if (pkg.contains("bca")) return "BCA";
        if (pkg.contains("mandiri")) return "Livin Mandiri";
        if (pkg.contains("gojek") || pkg.contains("gopay")) return "GoPay";
        if (pkg.contains("shopee")) return "ShopeePay";
        if (pkg.contains("bri")) return "BRImo";
        if (pkg.contains("bni")) return "BNI";
        if (pkg.contains("seabank")) return "SeaBank";
        if (pkg.contains("dana")) return "DANA";
        return "m-Banking";
    }

    private void showHumanInTheLoopNotification(String packageName, String rawText, String amount, String merchant) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Deteksi Transaksi Otomatis",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifikasi konfirmasi saat pembayaran bank/e-wallet terdeteksi");
            manager.createNotificationChannel(channel);
        }

        int notificationId = (int) System.currentTimeMillis();

        // 1. Intent buka aplikasi CelenganKita ke halaman /validations
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openAppIntent.putExtra("route", "/validations");
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 2. Intent Action [Ya, Masukkan]
        Intent confirmIntent = new Intent(this, NotificationActionReceiver.class);
        confirmIntent.setAction(NotificationActionReceiver.ACTION_CONFIRM);
        confirmIntent.putExtra("notificationId", notificationId);
        confirmIntent.putExtra("packageName", packageName);
        confirmIntent.putExtra("rawText", rawText);
        PendingIntent confirmPendingIntent = PendingIntent.getBroadcast(
            this,
            notificationId + 1,
            confirmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 3. Intent Action [Abaikan]
        Intent dismissIntent = new Intent(this, NotificationActionReceiver.class);
        dismissIntent.setAction(NotificationActionReceiver.ACTION_DISMISS);
        dismissIntent.putExtra("notificationId", notificationId);
        PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(
            this,
            notificationId + 2,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String messageBody = !amount.isEmpty()
            ? "Terdeteksi pembayaran Rp " + amount + " di " + merchant + ", masukkan ke celengan?"
            : "Terdeteksi transaksi baru dari " + merchant + ", masukkan ke celengan?";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("CelenganKita")
            .setContentText(messageBody)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(0, "Ya, Masukkan", confirmPendingIntent)
            .addAction(0, "Abaikan", dismissPendingIntent);

        manager.notify(notificationId, builder.build());
    }
}
