package com.paynote.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationBridge(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "NotificationBridge"
        private const val EVENT_NAME = "BANK_NOTIFICATION"
        private const val ACTION_EVENT_NAME = "NOTIFICATION_ACTION"
        private const val BUDGET_ALERT_CHANNEL_ID = "budget_alerts"
        private const val EXTRA_NOTIFICATION_ACTION_JSON = "notification_action_json"

        const val PERIODIC_REMINDER_ACTION = "com.paynote.app.PERIODIC_ROAST_REMINDER"
        const val PERIODIC_REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000L
        const val PERIODIC_PREFS = "periodic_roast_prefs"
        const val PERIODIC_PREF_AI_ENABLED = "ai_enabled"
        const val PERIODIC_PREF_API_KEY = "api_key"
        const val PERIODIC_PREF_TONE_MODE = "tone_mode"
        const val PERIODIC_PREF_ALLOW_STRONG = "allow_strong_language"
        const val PERIODIC_PREF_INTENSITY = "intensity"

        private var instance: NotificationBridge? = null
        private var pendingInitialActionJson: String? = null

        fun send(packageName: String, title: String?, text: String?) {
            instance?.sendEvent(packageName, title, text)
        }

        fun handleAppIntent(intent: Intent?) {
            val actionJson = intent?.getStringExtra(EXTRA_NOTIFICATION_ACTION_JSON)?.trim().orEmpty()
            if (actionJson.isBlank()) {
                return
            }
            pendingInitialActionJson = actionJson
            instance?.emitNotificationAction(actionJson)
        }

        fun consumeInitialActionJson(): String {
            val value = pendingInitialActionJson.orEmpty()
            pendingInitialActionJson = null
            return value
        }

        fun getPeriodicReminderPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, PeriodicRoastReceiver::class.java).apply {
                action = PERIODIC_REMINDER_ACTION
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            return PendingIntent.getBroadcast(context, 77421, intent, flags)
        }

        fun getOpenAppPendingIntent(context: Context, actionJson: String? = null): PendingIntent {
            val normalizedAction = actionJson?.trim().orEmpty()
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                if (normalizedAction.isNotBlank()) {
                    putExtra(EXTRA_NOTIFICATION_ACTION_JSON, normalizedAction)
                }
            }
            val requestCode = if (normalizedAction.isBlank()) {
                99117
            } else {
                99117 + kotlin.math.abs(normalizedAction.hashCode() % 10000)
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            return PendingIntent.getActivity(context, requestCode, launchIntent, flags)
        }

        fun schedulePeriodicRoastReminder(
            context: Context,
            triggerAtMillis: Long = System.currentTimeMillis() + PERIODIC_REMINDER_INTERVAL_MS,
        ) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
                val pendingIntent = getPeriodicReminderPendingIntent(context)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerAtMillis,
                        pendingIntent,
                    )
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule periodic reminder", e)
            }
        }

        fun cancelPeriodicRoastReminder(context: Context) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
                alarmManager.cancel(getPeriodicReminderPendingIntent(context))
            } catch (e: Exception) {
                Log.e(TAG, "Failed to cancel periodic reminder", e)
            }
        }
    }

    init {
        instance = this
    }

    override fun getName(): String = "NotificationBridge"

    private fun ensureBudgetAlertChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return
        val existing = manager.getNotificationChannel(BUDGET_ALERT_CHANNEL_ID)
        if (existing != null) return
        val channel = NotificationChannel(
            BUDGET_ALERT_CHANNEL_ID,
            "Cảnh báo chi tiêu",
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = "Cảnh báo khi chi tiêu tiệm cận hoặc vượt ngân sách danh mục"
        }
        manager.createNotificationChannel(channel)
    }

    private fun sendEvent(packageName: String, title: String?, text: String?) {
        try {
            val params = Arguments.createMap().apply {
                putString("packageName", packageName)
                putString("title", title ?: "")
                putString("text", text ?: "")
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_NAME, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event", e)
        }
    }

    private fun emitNotificationAction(actionJson: String) {
        try {
            if (actionJson.isBlank()) {
                return
            }
            val params = Arguments.createMap().apply {
                putString("target", "notification_action")
                putString("actionJson", actionJson)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(ACTION_EVENT_NAME, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error emitting notification action", e)
        }
    }

    @ReactMethod
    fun getInitialNotificationAction(callback: Callback) {
        callback.invoke(consumeInitialActionJson())
    }

    @ReactMethod
    fun isNotificationAccessGranted(callback: Callback) {
        try {
            val contentResolver = reactContext.contentResolver
            val enabledListeners = android.provider.Settings.Secure.getString(
                contentResolver,
                "enabled_notification_listeners",
            )
            val isGranted = enabledListeners?.contains(reactContext.packageName) == true
            callback.invoke(isGranted)
        } catch (e: Exception) {
            callback.invoke(false)
        }
    }

    @ReactMethod
    fun openNotificationSettings() {
        try {
            val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening notification settings", e)
        }
    }

    @ReactMethod
    fun openBatteryOptimizationSettings() {
        try {
            val intent = Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening battery settings", e)
        }
    }

    @ReactMethod
    fun isBatteryOptimizationDisabled(callback: Callback) {
        try {
            val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (powerManager == null) {
                callback.invoke(false)
                return
            }
            val isIgnoring = powerManager.isIgnoringBatteryOptimizations(reactContext.packageName)
            callback.invoke(isIgnoring)
        } catch (e: Exception) {
            callback.invoke(false)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun showBudgetAlertNotification(title: String, message: String, actionJson: String?) {
        try {
            ensureBudgetAlertChannel()
            val notification = NotificationCompat.Builder(reactContext, BUDGET_ALERT_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_paynote)
                .setContentTitle(title.ifBlank { "Cảnh báo chi tiêu" })
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setContentIntent(getOpenAppPendingIntent(reactContext, actionJson))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build()
            NotificationManagerCompat.from(reactContext).notify(
                (System.currentTimeMillis() % Int.MAX_VALUE).toInt(),
                notification,
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error showing budget alert notification", e)
        }
    }

    @ReactMethod
    fun startPeriodicRoastReminder() {
        schedulePeriodicRoastReminder(reactContext)
    }

    @ReactMethod
    fun stopPeriodicRoastReminder() {
        cancelPeriodicRoastReminder(reactContext)
    }

    @ReactMethod
    fun triggerPeriodicRoastReminderNow() {
        try {
            val intent = Intent(reactContext, PeriodicRoastReceiver::class.java).apply {
                action = PERIODIC_REMINDER_ACTION
                setPackage(reactContext.packageName)
            }
            reactContext.sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to trigger periodic reminder now", e)
        }
    }

    @ReactMethod
    fun configurePeriodicRoast(
        aiEnabled: Boolean,
        apiKey: String,
        toneMode: String,
        allowStrongLanguage: Boolean,
        intensity: String,
    ) {
        try {
            val prefs = reactContext.getSharedPreferences(PERIODIC_PREFS, Context.MODE_PRIVATE)
            prefs.edit()
                .putBoolean(PERIODIC_PREF_AI_ENABLED, aiEnabled)
                .putString(PERIODIC_PREF_API_KEY, apiKey.trim())
                .putString(PERIODIC_PREF_TONE_MODE, toneMode)
                .putBoolean(PERIODIC_PREF_ALLOW_STRONG, allowStrongLanguage)
                .putString(PERIODIC_PREF_INTENSITY, intensity)
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save periodic roast config", e)
        }
    }
}
