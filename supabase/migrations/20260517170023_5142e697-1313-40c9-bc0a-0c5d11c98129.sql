ALTER TABLE public.booking_links
  DROP CONSTRAINT IF EXISTS booking_links_kind_check;

ALTER TABLE public.booking_links
  ADD CONSTRAINT booking_links_kind_check
  CHECK (kind IN ('videochamada', 'presencial', 'ligacao', 'whatsapp'));