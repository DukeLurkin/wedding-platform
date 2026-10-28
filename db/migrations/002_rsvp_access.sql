ALTER TABLE wedding.invitation_parties
  ADD COLUMN is_test boolean NOT NULL DEFAULT false,
  ADD COLUMN source_key text UNIQUE,
  ADD COLUMN revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0);
-- statement-breakpoint
CREATE TABLE wedding.rsvp_rate_limits (
  bucket_hash text PRIMARY KEY CHECK (bucket_hash ~ '^[a-f0-9]{64}$'),
  attempts integer NOT NULL CHECK (attempts > 0),
  resets_at timestamptz NOT NULL
);
-- statement-breakpoint
CREATE INDEX rsvp_rate_limits_expiry_idx ON wedding.rsvp_rate_limits(resets_at);
