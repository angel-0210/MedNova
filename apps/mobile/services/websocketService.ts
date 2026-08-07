import { QueryClient } from '@tanstack/react-query';
import { secureStoreService } from './secureStoreService';
import { notificationService } from './notificationService';
import { BASE_WS_URL } from '../config/apiConfig';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionalDisconnect = false;
  private queryClient: QueryClient | null = null;

  public async connect(queryClient: QueryClient) {
    this.queryClient = queryClient;
    const accessToken = await secureStoreService.getAccessToken();
    if (!accessToken) {
      console.warn('[WebSocket] Cannot connect: No access token available');
      return;
    }

    this.isIntentionalDisconnect = false;

    // Use the shared BASE_WS_URL (already converted from http→ws by apiConfig)
    const wsUrl = `${BASE_WS_URL}/ws/dashboard?token=${accessToken}`;
    console.log('[WebSocket] Connecting to:', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connection established');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
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
            break;

          case 'new_alert':
            this.queryClient.invalidateQueries({ queryKey: ['alerts'] });
            await notificationService.showLocalAsync({
              title: `${data.alert_type.toUpperCase()} ALERT: Bed ${data.bed_number ?? 'N/A'}`,
              body:  data.message,
              data:  { patientId: data.patient_id },
            });
            break;

          case 'alert_acknowledged':
          case 'alert_resolved':
            this.queryClient.invalidateQueries({ queryKey: ['alerts'] });
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

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Connection error:', error);
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

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached.');
      return;
    }
    this.reconnectAttempts++;
    console.log(
      `[WebSocket] Reconnecting in ${this.reconnectDelay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );
    setTimeout(() => {
      if (this.queryClient) {
        this.connect(this.queryClient);
      }
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
    }, this.reconnectDelay);
  }
}

export const websocketService = new WebSocketService();
