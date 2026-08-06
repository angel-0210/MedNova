-- =========================================================================
-- MedNova Migration: Remove Obsolete Sensor Columns
-- Drop pressure, airflow, and respiratory_rate from sensor_readings
-- =========================================================================

ALTER TABLE public.sensor_readings DROP COLUMN IF EXISTS pressure;
ALTER TABLE public.sensor_readings DROP COLUMN IF EXISTS airflow;
ALTER TABLE public.sensor_readings DROP COLUMN IF EXISTS respiratory_rate;
