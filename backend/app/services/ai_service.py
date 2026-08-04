import numpy as np
import os
import uuid
from typing import Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.database.models import SensorReading

try:
    # Try importing tflite_runtime
    import tflite_runtime.interpreter as tflite
    TFLITE_AVAILABLE = True
except ImportError:
    try:
        # Try importing full tensorflow as a backup
        import tensorflow.lite as tflite
        TFLITE_AVAILABLE = True
    except ImportError:
        TFLITE_AVAILABLE = False

class AIService:
    def __init__(self):
        self.model_path = settings.AI_MODEL_PATH
        self.model_version = settings.AI_MODEL_VERSION
        self.interpreter = None
        
        if TFLITE_AVAILABLE and os.path.exists(self.model_path):
            try:
                logger.info("Loading TFLite model...", path=self.model_path)
                self.interpreter = tflite.Interpreter(model_path=self.model_path)
                self.interpreter.allocate_tensors()
                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
                logger.info("Successfully loaded TFLite model interpreter")
            except Exception as e:
                logger.exception("Failed to initialize TFLite interpreter, falling back to heuristics", error=str(e))
        else:
            if not TFLITE_AVAILABLE:
                logger.info("TFLite runtime libraries not installed. Using heuristic clinical estimator.")
            else:
                logger.warn("TFLite model file not found. Using heuristic clinical estimator.", path=self.model_path)

    async def predict_risk(self, reading: SensorReading) -> Tuple[int, float, str, str]:
        """
        Runs AI prediction on telemetry.
        Returns: Tuple[risk_score (0-100), confidence (0.0-1.0), recommendation (str), model_version (str)]
        """
        import time
        start_time = time.perf_counter()

        # Extract features
        spo2 = float(reading.spo2)
        heart_rate = float(reading.heart_rate)
        pressure = float(reading.pressure)
        temperature = float(reading.temperature)
        airflow = float(reading.airflow)
        respiratory_rate = float(reading.respiratory_rate)

        # 1. TFLite Inference
        if self.interpreter is not None:
            try:
                # Preprocess input (expects a 2D float32 array: [[spo2, hr, pressure, temp, airflow, rr]])
                input_data = np.array([[spo2, heart_rate, pressure, temperature, airflow, respiratory_rate]], dtype=np.float32)
                
                self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
                self.interpreter.invoke()
                
                # Retrieve risk score prediction
                output_data = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
                
                # Assume model output is [risk_score (0-1.0), confidence (0-1.0)]
                risk_prob = float(output_data[0])
                risk_score = int(risk_prob * 100)
                confidence = float(output_data[1]) if len(output_data) > 1 else 0.85
                
                recommendation = self._generate_recommendation(risk_score, spo2, heart_rate, pressure)
                inference_time = (time.perf_counter() - start_time) * 1000
                logger.info("TFLite inference completed", risk_score=risk_score, confidence=confidence, inference_time_ms=inference_time)
                return risk_score, confidence, recommendation, self.model_version
                
            except Exception as e:
                logger.warn("TFLite inference failed, falling back to heuristics", error=str(e))

        # 2. Heuristic fallback (High-quality rule-based clinical engine)
        risk_score, confidence = self._calculate_heuristics(spo2, heart_rate, pressure, temperature, airflow, respiratory_rate)
        recommendation = self._generate_recommendation(risk_score, spo2, heart_rate, pressure)
        
        inference_time = (time.perf_counter() - start_time) * 1000
        logger.info("Heuristic inference completed", risk_score=risk_score, confidence=confidence, inference_time_ms=inference_time)
        return risk_score, confidence, recommendation, "heuristic_estimator_v1.0"

    def _calculate_heuristics(
        self, spo2: float, hr: float, press: float, temp: float, flow: float, rr: float
    ) -> Tuple[int, float]:
        """
        Implements a weighted physiological risk scoring algorithm (resembling National Early Warning Score - NEWS).
        """
        score = 0
        factors = 0

        # spO2 (Severe hypoxemia weight)
        if spo2 < 85:
            score += 40
        elif spo2 < 90:
            score += 25
        elif spo2 < 95:
            score += 10
        factors += 1

        # Heart Rate
        if hr < 40 or hr > 140:
            score += 25
        elif hr < 50 or hr > 120:
            score += 15
        elif hr < 60 or hr > 100:
            score += 5
        factors += 1

        # Respiratory Rate
        if rr < 8 or rr > 35:
            score += 25
        elif rr < 10 or rr > 25:
            score += 15
        elif rr < 12 or rr > 20:
            score += 5
        factors += 1

        # Pressure (Ventilator disconnect / High-pressure obstruction)
        if press < 5 or press > 35:
            score += 35
        elif press < 10 or press > 25:
            score += 15
        factors += 1

        # Temperature
        if temp < 35.0 or temp > 39.0:
            score += 10
        elif temp < 36.0 or temp > 38.0:
            score += 5
        factors += 1

        # Airflow
        if flow < 5 or flow > 35:
            score += 15
        factors += 1

        # Normalize score to 0 - 100
        max_possible_score = 40 + 25 + 25 + 35 + 10 + 15  # 150
        risk_score = int((score / max_possible_score) * 100)
        risk_score = min(max(risk_score, 0), 100)

        # Confidence varies slightly based on stability
        confidence = 0.95 if (risk_score < 20 or risk_score > 80) else 0.80

        return risk_score, confidence

    def _generate_recommendation(self, risk_score: int, spo2: float, hr: float, press: float) -> str:
        if risk_score >= 90:
            return "CRITICAL: Immediate medical intervention required. Check ventilator connections, patient airway, and prepare for manual bagging."
        elif risk_score >= 75:
            return "HIGH: Urgent clinical review needed. Increase oxygen fraction if spO2 is low. Monitor pressure for airway blockage."
        elif risk_score >= 50:
            return f"MEDIUM: Monitor patient closely. Current spO2 is {spo2}%, Heart Rate is {hr} BPM, Ventilator Pressure is {press} cmH2O."
        elif risk_score >= 25:
            return "LOW: Patient stable, continue routine monitoring."
        else:
            return "NORMAL: All physiological parameters are within normal ventilator limits."
