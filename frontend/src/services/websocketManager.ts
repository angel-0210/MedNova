import { useAuthStore, useVitalsStore, useAlertStore, useAIStore } from '../stores';
import { keychainService } from './keychainService';

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // start with 1 second
  private heartbeatInterval: any = null;
  private isIntentionalDisconnect = false;

  public async connect() {
    const tokens = await keychainService.getTokens();
    if (!tokens?.accessToken) {
      console.warn('Cannot connect to WebSocket: No access token available');
      return;
    }

    this.isIntentionalDisconnect = false;
    // Connect to backend WebSocket dashboard router
    const wsUrl = `ws://10.0.2.2:8000/ws/dashboard?token=${tokens.accessToken}`;
    
    console.log('Connecting to WebSocket dashboard...');
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connection established successfully');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        if (rawData === 'pong') return; // Heartbeat pong response
        
        const { event: eventName, data } = rawData;
        console.log(`Received WebSocket message: ${eventName}`, data);

        switch (eventName) {
          case 'new_telemetry':
            // Add sensor reading to vitalsStore
            useVitalsStore.getState().addReading(data.patient_id, {
              reading_id: data.reading_id,
              hospital_id: useAuthStore.getState().user?.hospital_id || '',
              patient_id: data.patient_id,
              device_id: data.device_id,
              timestamp: data.timestamp,
              spo2: data.spo2,
              heart_rate: data.heart_rate,
              temperature: data.temperature,
            });
            // Update AI prediction in aiStore
            if (data.prediction) {
              useAIStore.getState().addPrediction(data.patient_id, {
                prediction_id: '',
                hospital_id: useAuthStore.getState().user?.hospital_id || '',
                patient_id: data.patient_id,
                risk_score: data.prediction.risk_score,
                risk_level: data.prediction.risk_level,
                confidence: 0.9,
                recommendation: data.prediction.recommendation,
                model_version: 'realtime_predictions',
                created_at: data.timestamp,
                updated_at: data.timestamp,
              });
            }
            break;

          case 'new_alert':
            useAlertStore.getState().addAlert({
              alert_id: data.alert_id,
              hospital_id: useAuthStore.getState().user?.hospital_id || '',
              patient_id: data.patient_id,
              alert_type: data.alert_type,
              message: data.message,
              status: 'pending',
              created_at: data.created_at,
              updated_at: data.created_at,
            });
            break;

          case 'alert_acknowledged':
            // Force reload active alerts to get updated details
            useAlertStore.getState().fetchActiveAlerts();
            break;

          case 'alert_resolved':
            // Remove resolved alert from activeAlerts
            useAlertStore.getState().removeAlert(data.alert_id);
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
    }, 30000); // 30 second heartbeat ping
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached. Connection failed.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting WebSocket reconnection in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }, this.reconnectDelay);
  }
}

export const websocketManager = new WebSocketManager();
