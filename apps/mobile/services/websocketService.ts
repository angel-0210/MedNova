import { QueryClient } from '@tanstack/react-query';
import { secureStoreService } from './secureStoreService';
import * as Notifications from 'expo-notifications';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: any = null;
  private isIntentionalDisconnect = false;
  private queryClient: QueryClient | null = null;

  public async connect(queryClient: QueryClient) {
    this.queryClient = queryClient;
    const accessToken = await secureStoreService.getAccessToken();
    if (!accessToken) {
      console.warn('Cannot connect to WebSocket: No access token available');
      return;
    }

    this.isIntentionalDisconnect = false;
    
    // Get WS URL from environment variables
    const rawUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    const wsBase = rawUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/dashboard?token=${accessToken}`;
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established successfully');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.startHeartbeat();
    };

    this.ws.onmessage = async (event) => {
      try {
        const rawData = JSON.parse(event.data);
        if (rawData === 'pong') return;
        
        const { event: eventName, data } = rawData;
        console.log(`Received WebSocket message: ${eventName}`, data);

        if (!this.queryClient) return;

        switch (eventName) {
          case 'new_telemetry':
            // Update the cache for latest vitals
            this.queryClient.setQueryData(
              ['vitals', 'latest', data.patient_id],
              {
                reading_id: data.reading_id,
                patient_id: data.patient_id,
                device_id: data.device_id,
                timestamp: data.timestamp,
                spo2: data.spo2,
                heart_rate: data.heart_rate,
                temperature: data.temperature,
              }
            );
            
            // Invalidate patients so dashboard counters update
            this.queryClient.invalidateQueries({ queryKey: ['patients'] });
            break;

          case 'new_alert':
            // Invalidate alerts query
            this.queryClient.invalidateQueries({ queryKey: ['alerts'] });
            
            // Trigger local notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${data.alert_type.toUpperCase()} ALERT: Bed ${data.bed_number || 'N/A'}`,
                body: data.message,
                data: { patientId: data.patient_id },
              },
              trigger: null,
            });
            break;

          case 'alert_acknowledged':
          case 'alert_resolved':
            this.queryClient.invalidateQueries({ queryKey: ['alerts'] });
            break;

          default:
            console.log('Unhandled WebSocket event:', eventName);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.reason);
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
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting WebSocket in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.queryClient) {
        this.connect(this.queryClient);
      }
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }, this.reconnectDelay);
  }
}

export const websocketService = new WebSocketService();
