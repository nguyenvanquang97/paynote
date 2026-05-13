package com.paynote.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationService : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationService"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val packageName = sbn.packageName

            val title = sbn.notification.extras
                .getString("android.title")

            val text = sbn.notification.extras
                .getCharSequence("android.text")
                ?.toString()

            Log.d(TAG, "Notification from: $packageName")

            NotificationBridge.send(
                packageName,
                title,
                text
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Optional: handle notification removal
    }
}
