import { QueryClient } from '@tanstack/react-query';
import { secureStoreService } from './secureStoreService';
import { notificationService } from './notificationService';
import { BASE_WS_URL } from '../config/apiConfig';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionalDisconnect = false;
  private queryClient: QueryClient | null = null;

  public async connect(queryClient: QueryClient) {
    this.queryClient = queryClient;

    // One socket per app, not per mount. The dashboard calls connect() from more than one
    // effect, so without this every mount opened a second socket and doubled the log spam.
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) return;

    const accessToken = await secureStoreService.getAccessToken();
    if (!accessToken) {
      console.warn('[WebSocket] Cannot connect: No access token available');
      return;
    }

    this.isIntentionalDisconnect = false;

    // Use the shared BASE_WS_URL (already converted from http→ws by apiConfig)
    const wsUrl = `${BASE_WS_URL}/ws/dashboard?token=${accessToken}`;
    // Never log wsUrl itself -- the access token rides in the query string.
    console.log('[WebSocket] Connecting to:', `${BASE_WS_URL}/ws/dashboard`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connection established');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = async (event) => {
      try {
        if (event.data === 'pong') return;
        const rawData = JSON.parse(event.data);
        const { event: eventName, data } = rawData;
        console.log('[WebSocket] Event:', eventName);

        if (!this.queryClient) return;

        switch (eventName) {
          case 'new_telemetry':
            this.queryClient.setQueryData(
              ['vitals', 'latest', data.patient_id],
              {
                reading_id:  data.reading_id,
                patient_id:  data.patient_id,
                device_id:   data.device_id,
                timestamp:   data.timestamp,
                spo2:        data.spo2,
                heart_rate:  data.heart_rate,
                temperature: data.temperature,
              }
            );
            this.queryClient.invalidateQueries({ queryKey: ['patients'] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'prediction', data.patient_id] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', data.patient_id, 'timeline'] });
            break;

          case 'new_alert':
            this.queryClient.invalidateQueries({ queryKey: ['alerts'] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'alerts'] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
            if (data.patient_id) {
              this.queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', data.patient_id, 'timeline'] });
            }
            await notificationService.showLocalAsync({
              title: `${data.alert_type.toUpperCase()} ALERT: Bed ${data.bed_number ?? 'N/A'}`,
              body:  data.message,
              data:  { patientId: data.patient_id },
            });
            break;

          case 'alert_acknowledged':
          case 'alert_resolved':
            this.queryClient.invalidateQueries({ queryKey: ['alerts'] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'alerts'] });
            this.queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
            break;

          case 'device_status':
            this.queryClient.invalidateQueries({ queryKey: ['devices'] });
            break;

          default:
            console.log('[WebSocket] Unhandled event:', eventName);
        }
      } catch (err) {
        console.error('[WebSocket] Error parsing message:', err);
      }
    };

    this.ws.onerror = () => {
      // Logging the event dumps its target socket -- including the tokenised URL -- and
      // React Native renders that as a full-screen error. onclose already reports the reason.
      console.warn('[WebSocket] Connection failed:', BASE_WS_URL);
    };

    this.ws.onclose = (event) => {
      console.log('[WebSocket] Closed:', event.reason);
      this.stopHeartbeat();
      if (!this.isIntentionalDisconnect) {
        this.attemptReconnect();
      }
    };
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /** Exponential backoff capped at 30s, forever. A ward monitor that stops retrying after
   *  five tries is dead until someone restarts the app -- the cap on delay is the real fix. */
  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 30_000);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => {
      if (this.queryClient && !this.isIntentionalDisconnect) {
        this.connect(this.queryClient);
      }
    }, delay);
  }
}

export const websocketService = new WebSocketService();
