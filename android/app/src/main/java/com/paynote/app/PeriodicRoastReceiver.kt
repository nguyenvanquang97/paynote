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
        private const val DEFAULT_MODEL = "gemini-2.5-flash-lite"
        private const val PREF_LAST_NATIVE_PERIODIC_AT = "last_native_periodic_at"
        private const val PREF_NATIVE_PERIODIC_COUNT = "native_periodic_count"
        private const val PREF_NATIVE_PERIODIC_DATE = "native_periodic_date"
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
                val proxyUrl = prefs.getString(NotificationBridge.PERIODIC_PREF_PROXY_URL, "")?.trim().orEmpty()
                val proxyToken = prefs.getString(NotificationBridge.PERIODIC_PREF_PROXY_TOKEN, "")?.trim().orEmpty()
                val model = prefs.getString(NotificationBridge.PERIODIC_PREF_MODEL, DEFAULT_MODEL)?.trim().orEmpty().ifBlank {
                    DEFAULT_MODEL
                }
                val allowStrongLanguage = prefs.getBoolean(NotificationBridge.PERIODIC_PREF_ALLOW_STRONG, false)
                val intensity = prefs.getString(NotificationBridge.PERIODIC_PREF_INTENSITY, "normal").orEmpty()
                val toneModeRaw = prefs.getString(NotificationBridge.PERIODIC_PREF_TONE_MODE, "advisor").orEmpty()
                val toneMode = when (toneModeRaw) {
                    "advisor", "gentle" -> "gentle"
                    "wallet_pet", "cute" -> "cute"
                    "vietnamese_parent", "angry", "strict" -> "angry"
                    else -> "sarcastic"
                }
                val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                    .format(java.util.Date())
                val lastDate = prefs.getString(PREF_NATIVE_PERIODIC_DATE, "") ?: ""
                val nextCount = if (lastDate == today) (prefs.getInt(PREF_NATIVE_PERIODIC_COUNT, 0) + 1) else 1
                val tier = when {
                    nextCount >= 7 -> 4
                    nextCount >= 5 -> 3
                    nextCount >= 3 -> 2
                    else -> 1
                }
                val adjustedTier = when (intensity) {
                    "sharp" -> (tier + 1).coerceAtMost(4)
                    "soft" -> (tier - 1).coerceAtLeast(1)
                    else -> tier
                }

                val lastAt = prefs.getLong(PREF_LAST_NATIVE_PERIODIC_AT, 0L)
                if (System.currentTimeMillis() - lastAt < 10_000L) {
                    return@thread
                }

                val fallbackMessage = PeriodicPlanFallbackTemplates.pick(toneMode, allowStrongLanguage, adjustedTier)
                val aiMessage = if (aiEnabled) {
                    requestPeriodicRoast(
                        apiKey = apiKey,
                        proxyUrl = proxyUrl,
                        proxyToken = proxyToken,
                        model = model,
                        toneMode = toneMode,
                        allowStrongLanguage = allowStrongLanguage,
                        intensity = intensity,
                    )
                } else {
                    null
                }
                val message = aiMessage ?: fallbackMessage
                val actionJson = """{"target":"dashboard","monthKey":"${java.text.SimpleDateFormat("yyyy-MM", java.util.Locale.US).format(java.util.Date())}","ts":${System.currentTimeMillis()}}"""

                val notification = NotificationCompat.Builder(context, "budget_alerts")
                    .setSmallIcon(R.drawable.ic_stat_paynote)
                    .setLargeIcon(BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher_round))
                    .setContentTitle("Nhắc nhở chi tiêu định kỳ")
                    .setContentText(message)
                    .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                    .setContentIntent(NotificationBridge.getOpenAppPendingIntent(context, actionJson))
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .build()

                NotificationManagerCompat.from(context).notify(
                    (System.currentTimeMillis() % Int.MAX_VALUE).toInt(),
                    notification
                )
                prefs.edit().putLong(PREF_LAST_NATIVE_PERIODIC_AT, System.currentTimeMillis()).apply()
                prefs.edit()
                    .putString(PREF_NATIVE_PERIODIC_DATE, today)
                    .putInt(PREF_NATIVE_PERIODIC_COUNT, nextCount)
                    .apply()

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

    private fun requestPeriodicRoast(
        apiKey: String,
        proxyUrl: String,
        proxyToken: String,
        model: String,
        toneMode: String,
        allowStrongLanguage: Boolean,
        intensity: String,
    ): String? {
        val prompt = buildPrompt(toneMode, allowStrongLanguage, intensity)
        if (proxyUrl.isNotBlank()) {
            val viaProxy = requestProxyRoast(proxyUrl, proxyToken, model, prompt)
            if (!viaProxy.isNullOrBlank()) {
                return viaProxy
            }
        }
        if (apiKey.isNotBlank()) {
            return requestGeminiRoast(apiKey, model, prompt)
        }
        return null
    }

    private fun buildPrompt(toneMode: String, allowStrongLanguage: Boolean, intensity: String): String {
        val toneInstruction = when (toneMode) {
            "gentle" -> "Giọng nhẹ nhàng, đồng cảm, khích lệ."
            "cute" -> "Giọng dễ thương, dí dỏm."
            "angry", "strict" -> if (allowStrongLanguage)
                "Giọng cáu gắt rất mạnh, có thể xưng mày, mắng thẳng như người thật nhưng tuyệt đối không chửi bậy."
            else
                "Giọng phụ huynh nghiêm khắc, gắt vừa, tuyệt đối không chửi bậy hay xưng hô nặng."
            else -> "Giọng xéo xắc mạnh, châm biếm thâm nhưng văn minh."
        }
        return """
            Bạn là trợ lý tài chính nói tiếng Việt.
            Tone: $toneInstruction
            Intensity: ${if (intensity == "sharp") "gắt rõ hơn" else if (intensity == "soft") "nhẹ hơn" else "cân bằng"}.
            Viết đúng 1 câu ngắn nhắc người dùng tiết chế chi tiêu, nêu hậu quả tài chính rõ hơn.
            Không chửi thề, không xúc phạm cá nhân.
            Trả về JSON: {"message":"..."}.
        """.trimIndent()
    }

    private fun requestProxyRoast(proxyUrl: String, proxyToken: String, model: String, prompt: String): String? {
        return try {
            val conn = (URL(proxyUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 8000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                if (proxyToken.isNotBlank()) {
                    setRequestProperty("Authorization", "Bearer $proxyToken")
                }
            }
            val body = JSONObject()
                .put("model", model)
                .put("messages", JSONArray().put(
                    JSONObject()
                        .put("role", "user")
                        .put("content", prompt)
                ))
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
                Log.w(TAG, "Proxy non-OK for periodic: $code")
                return null
            }

            val payload = JSONObject(text)
            val content = payload.optString("content", "").trim()
            parseMessage(content)
        } catch (e: Exception) {
            Log.w(TAG, "Proxy periodic request failed", e)
            null
        }
    }

    private fun requestGeminiRoast(apiKey: String, model: String, prompt: String): String? {
        return try {
            val url = URL("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 8000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
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
            parseMessage(raw)
        } catch (e: Exception) {
            Log.w(TAG, "Gemini periodic request failed", e)
            null
        }
    }

    private fun parseMessage(rawText: String): String? {
        val normalized = stripMarkdownFence(rawText).trim()
        if (normalized.isBlank()) {
            return null
        }

        parseMessageFromJson(normalized)?.let { parsed ->
            return parsed.take(170)
        }

        val plain = normalized
            .replace("`", " ")
            .replace(Regex("(?im)^\\s*json\\s*$"), " ")
            .replace(Regex("(?m)^\\s*[{}]\\s*$"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
        if (plain.isBlank()) {
            return null
        }
        val looksLikeJson = plain.contains("{") || plain.contains("}") || plain.contains("\"message\"")
        return if (looksLikeJson) null else plain.take(170)
    }

    private fun stripMarkdownFence(text: String): String {
        val trimmed = text.trim()
        val fenced = Regex("(?s)^```(?:json)?\\s*(.*?)\\s*```$").find(trimmed)
        return fenced?.groupValues?.getOrNull(1)?.trim() ?: trimmed
    }

    private fun parseMessageFromJson(text: String): String? {
        parseMessageField(text)?.let { return it }

        val jsonStart = text.indexOf('{')
        val jsonEnd = text.lastIndexOf('}')
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            parseMessageField(text.substring(jsonStart, jsonEnd + 1))?.let { return it }
        }

        val regexHit = Regex("(?s)\"message\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"").find(text)
        val escaped = regexHit?.groupValues?.getOrNull(1)?.trim().orEmpty()
        if (escaped.isBlank()) {
            return null
        }
        return try {
            val json = JSONObject("{\"message\":\"$escaped\"}")
            json.optString("message", "").trim().ifBlank { null }
        } catch (_: Exception) {
            null
        }
    }

    private fun parseMessageField(jsonText: String): String? {
        return try {
            val msg = JSONObject(jsonText).optString("message", "").trim()
            if (msg.isBlank()) null else msg
        } catch (_: Exception) {
            null
        }
    }
}
