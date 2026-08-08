-- =========================================================================
-- MedNova Migration: Patient Follow-Up Status
-- Adds a clinician-owned follow-up state and note to each AI prediction --
-- the record that carries the risk level, triage and recommendation a
-- clinician actually acts on.
-- =========================================================================

ALTER TABLE public.ai_predictions
  ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS clinician_note   TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_by     UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_at     TIMESTAMPTZ;

-- Reject typos at the database, not just in Pydantic -- an unknown status would
-- render as an unstyled badge and silently drop out of every filter.
ALTER TABLE public.ai_predictions
  DROP CONSTRAINT IF EXISTS ai_predictions_follow_up_status_check;
ALTER TABLE public.ai_predictions
  ADD CONSTRAINT ai_predictions_follow_up_status_check
  CHECK (follow_up_status IN ('pending', 'in_progress', 'completed', 'not_required'));

-- Outstanding follow-ups are the only rows anyone queries by status.
CREATE INDEX IF NOT EXISTS ai_predictions_follow_up_status_idx
  ON public.ai_predictions (hospital_id, follow_up_status);
