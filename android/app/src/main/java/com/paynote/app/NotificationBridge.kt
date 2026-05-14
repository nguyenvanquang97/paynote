package com.paynote.app

import android.util.Log
import android.os.PowerManager
import com.facebook.react.bridge.Arguments
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

        private var instance: NotificationBridge? = null

        fun send(packageName: String, title: String?, text: String?) {
            instance?.sendEvent(packageName, title, text)
        }
    }

    init {
        instance = this
    }

    override fun getName(): String = "NotificationBridge"

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

            Log.d(TAG, "Event sent: $packageName")
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event", e)
        }
    }

    @ReactMethod
    fun isNotificationAccessGranted(callback: com.facebook.react.bridge.Callback) {
        try {
            val contentResolver = reactContext.contentResolver
            val enabledListeners = android.provider.Settings.Secure.getString(
                contentResolver,
                "enabled_notification_listeners"
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
            val intent = android.content.Intent(
                "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
            )
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening notification settings", e)
        }
    }

    @ReactMethod
    fun openBatteryOptimizationSettings() {
        try {
            val intent = android.content.Intent(
                android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
            )
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening battery settings", e)
        }
    }

    @ReactMethod
    fun isBatteryOptimizationDisabled(callback: com.facebook.react.bridge.Callback) {
        try {
            val powerManager = reactContext.getSystemService(
                android.content.Context.POWER_SERVICE
            ) as? PowerManager

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
}
