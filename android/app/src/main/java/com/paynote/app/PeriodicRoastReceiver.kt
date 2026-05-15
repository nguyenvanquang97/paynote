package com.paynote.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.graphics.BitmapFactory
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class PeriodicRoastReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "PeriodicRoastReceiver"
        private const val MODEL = "gemini-2.5-flash-lite"
    }

    private fun ensureBudgetAlertChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return
        val existing = manager.getNotificationChannel("budget_alerts")
        if (existing != null) return
        val channel = NotificationChannel(
            "budget_alerts",
            "Cảnh báo chi tiêu",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Nhắc nhở và cảnh báo chi tiêu định kỳ"
        }
        manager.createNotificationChannel(channel)
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != NotificationBridge.PERIODIC_REMINDER_ACTION) {
            return
        }
        val pendingResult = goAsync()
        thread {
            try {
                ensureBudgetAlertChannel(context)

                val prefs = context.getSharedPreferences(NotificationBridge.PERIODIC_PREFS, Context.MODE_PRIVATE)
                val aiEnabled = prefs.getBoolean(NotificationBridge.PERIODIC_PREF_AI_ENABLED, true)
                val apiKey = prefs.getString(NotificationBridge.PERIODIC_PREF_API_KEY, "")?.trim().orEmpty()
                val toneModeRaw = prefs.getString(NotificationBridge.PERIODIC_PREF_TONE_MODE, "sarcastic_strong").orEmpty()
                val toneMode = if (toneModeRaw == "strict") "angry" else toneModeRaw

                val fallbackMessage = PeriodicFallbackTemplates.pick(toneMode)
                val aiMessage = if (aiEnabled && apiKey.isNotBlank()) requestGeminiRoast(apiKey, toneMode) else null
                val message = aiMessage ?: fallbackMessage

                val notification = NotificationCompat.Builder(context, "budget_alerts")
                    .setSmallIcon(R.drawable.ic_stat_paynote)
                    .setLargeIcon(BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher_round))
                    .setContentTitle("Nhắc nhở chi tiêu định kỳ")
                    .setContentText(message)
                    .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .build()

                NotificationManagerCompat.from(context).notify(
                    (System.currentTimeMillis() % Int.MAX_VALUE).toInt(),
                    notification
                )

                NotificationBridge.schedulePeriodicRoastReminder(
                    context,
                    System.currentTimeMillis() + NotificationBridge.PERIODIC_REMINDER_INTERVAL_MS
                )
            } catch (e: Exception) {
                Log.e(TAG, "Periodic reminder failed", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun requestGeminiRoast(apiKey: String, toneMode: String): String? {
        return try {
            val url = URL("https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent?key=${apiKey}")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 8000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
            val toneInstruction = when (toneMode) {
                "gentle" -> "Giọng nhẹ nhàng, đồng cảm, khích lệ."
                "cute" -> "Giọng dễ thương, dí dỏm."
                "angry", "strict" -> "Giọng cáu gắt rất mạnh, xưng tao-mày, mắng thẳng như người thật nhưng tuyệt đối không chửi bậy."
                else -> "Giọng xéo xắc mạnh, châm biếm thâm nhưng văn minh."
            }
            val prompt = """
                Bạn là trợ lý tài chính nói tiếng Việt.
                Tone: $toneInstruction
                Viết đúng 1 câu ngắn nhắc người dùng tiết chế chi tiêu, nêu hậu quả tài chính rõ hơn.
                Không chửi thề, không xúc phạm cá nhân.
                Trả về JSON: {"message":"..."}.
            """.trimIndent()
            val body = JSONObject()
                .put("contents", JSONArray().put(JSONObject().put("parts", JSONArray().put(JSONObject().put("text", prompt)))))
                .put("generationConfig", JSONObject().put("temperature", 0.85).put("maxOutputTokens", 120))
                .toString()
            conn.outputStream.use { os ->
                os.write(body.toByteArray(Charsets.UTF_8))
            }

            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.use { s ->
                BufferedReader(InputStreamReader(s)).readText()
            }.orEmpty()
            if (code !in 200..299) {
                Log.w(TAG, "Gemini non-OK for periodic: $code")
                return null
            }
            val payload = JSONObject(text)
            val raw = payload
                .optJSONArray("candidates")
                ?.optJSONObject(0)
                ?.optJSONObject("content")
                ?.optJSONArray("parts")
                ?.optJSONObject(0)
                ?.optString("text")
                .orEmpty()

            val jsonStart = raw.indexOf('{')
            val jsonEnd = raw.lastIndexOf('}')
            val candidate = if (jsonStart >= 0 && jsonEnd > jsonStart) raw.substring(jsonStart, jsonEnd + 1) else raw
            val msg = JSONObject(candidate).optString("message", "").trim()
            if (msg.isBlank()) null else msg.take(170)
        } catch (e: Exception) {
            Log.w(TAG, "Gemini periodic request failed", e)
            null
        }
    }
}
