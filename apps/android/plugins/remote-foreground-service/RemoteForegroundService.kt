package io.github.liguobao.dshremote

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/** Keeps the React Native process eligible to run while a remote carrier is active. */
class RemoteForegroundService : Service() {
  override fun onCreate() {
    super.onCreate()
    createChannel()
    // Android 14 (API 34) requires the foreground service type at the call
    // site, not only in the manifest. The manifest already declares
    // `android:foregroundServiceType="remoteMessaging"`, but without passing it
    // here the platform stops the service with
    // "FGS stop call for: <uid> has no types!" as soon as the app leaves the
    // foreground, which drops the remote carrier.
    // The three-argument overload exists from API 29 while this app's
    // minSdkVersion is 26, so keep the older overload as a fallback.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING)
    } else {
      startForeground(NOTIFICATION_ID, notification())
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }
    // The JavaScript Runtime owns reconnect and session restoration. Do not
    // resurrect a notification-only service after the process is killed.
    return START_NOT_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun notification(): Notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setSmallIcon(applicationInfo.icon)
    .setContentTitle(getString(R.string.app_name))
    .setContentText("Remote connection is active")
    .setCategory(NotificationCompat.CATEGORY_SERVICE)
    .setOngoing(true)
    .setOnlyAlertOnce(true)
    .build()

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(
      CHANNEL_ID,
      "Remote connection",
      NotificationManager.IMPORTANCE_LOW,
    ))
  }

  companion object {
    private const val ACTION_START = "io.github.liguobao.dshremote.action.START"
    private const val ACTION_STOP = "io.github.liguobao.dshremote.action.STOP"
    private const val CHANNEL_ID = "remote_connection"
    private const val NOTIFICATION_ID = 7401

    fun start(context: Context) {
      val intent = Intent(context, RemoteForegroundService::class.java).setAction(ACTION_START)
      ContextCompat.startForegroundService(context, intent)
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, RemoteForegroundService::class.java))
    }
  }
}

