package com.paynote.app

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationService : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationService"
        private const val CACHE_WINDOW_MS = 15_000L
        private const val MAX_CACHE_ENTRIES = 200
    }

    private val recentNotificationCache = object : LinkedHashMap<String, Long>(MAX_CACHE_ENTRIES, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Long>?): Boolean {
            return size > MAX_CACHE_ENTRIES
        }
    }

    @Synchronized
    private fun shouldSkipDuplicate(sbn: StatusBarNotification, text: String?): Boolean {
        val now = System.currentTimeMillis()
        val key = "${sbn.key}|${sbn.postTime}|${text ?: ""}"

        val iterator = recentNotificationCache.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (now - entry.value > CACHE_WINDOW_MS) {
                iterator.remove()
            }
        }

        val lastSeen = recentNotificationCache[key]
        if (lastSeen != null && now - lastSeen <= CACHE_WINDOW_MS) {
            return true
        }

        recentNotificationCache[key] = now
        return false
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val packageName = sbn.packageName
            val extras = sbn.notification.extras

            val title = extras
                .getString(Notification.EXTRA_TITLE)

            val text = extractNotificationText(extras)

            if (shouldSkipDuplicate(sbn, text)) {
                Log.d(TAG, "Skip duplicate notification from: $packageName")
                return
            }

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

    private fun extractNotificationText(extras: Bundle): String? {
        extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
            ?.toString()
            ?.takeIf { it.isNotBlank() }
            ?.let { return it }

        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
            ?.mapNotNull { it?.toString() }
            ?.filter { it.isNotBlank() }
            ?.takeIf { it.isNotEmpty() }
            ?.joinToString("\n")
            ?.let { return it }

        return extras.getCharSequence(Notification.EXTRA_TEXT)
            ?.toString()
            ?.takeIf { it.isNotBlank() }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Optional: handle notification removal
    }
}
