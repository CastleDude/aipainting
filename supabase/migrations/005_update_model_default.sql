-- Update default model from qwen-image to schnell (Runware Flux Schnell)
ALTER TABLE public.generations
  ALTER COLUMN model SET DEFAULT 'schnell';
