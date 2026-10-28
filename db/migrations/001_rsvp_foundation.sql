-- Applied as a single transaction by scripts/database.mjs.
-- Statement markers avoid unsafe splitting of SQL function bodies.
CREATE TABLE wedding.invitation_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 200),
  invitation_code_hash text NOT NULL UNIQUE CHECK (invitation_code_hash ~ '^[a-f0-9]{64}$'),
  access_revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE wedding.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_party_id uuid NOT NULL REFERENCES wedding.invitation_parties(id),
  first_name text NOT NULL CHECK (length(btrim(first_name)) BETWEEN 1 AND 100),
  last_name text NOT NULL CHECK (length(btrim(last_name)) BETWEEN 1 AND 100),
  is_child boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX guests_invitation_party_idx ON wedding.guests(invitation_party_id);
-- statement-breakpoint
CREATE TABLE wedding.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (length(btrim(slug)) BETWEEN 1 AND 100),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  event_date date NOT NULL,
  time_zone text NOT NULL DEFAULT 'America/New_York',
  venue_name text NOT NULL,
  venue_address text NOT NULL,
  -- Exclusive cutoff: replies allowed while now() < rsvp_closes_at.
  rsvp_closes_at timestamptz NOT NULL,
  meals_selected_at_event boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE TABLE wedding.event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES wedding.guests(id),
  event_id uuid NOT NULL REFERENCES wedding.events(id),
  allows_plus_one boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guest_id, event_id),
  UNIQUE (id, allows_plus_one)
);
-- statement-breakpoint
CREATE INDEX event_invitations_event_idx ON wedding.event_invitations(event_id);
-- statement-breakpoint
CREATE TABLE wedding.rsvp_responses (
  event_invitation_id uuid PRIMARY KEY REFERENCES wedding.event_invitations(id),
  attending boolean NOT NULL,
  dietary_restrictions text NOT NULL DEFAULT '' CHECK (length(dietary_restrictions) <= 500),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (attending OR dietary_restrictions = ''),
  UNIQUE (event_invitation_id, attending)
);
-- statement-breakpoint
CREATE TABLE wedding.plus_one_responses (
  event_invitation_id uuid PRIMARY KEY,
  -- Composite foreign keys enforce explicit permission and an attending host.
  plus_one_permitted boolean NOT NULL DEFAULT true CHECK (plus_one_permitted),
  host_attending boolean NOT NULL DEFAULT true CHECK (host_attending),
  attending boolean NOT NULL,
  full_name text CHECK (full_name IS NULL OR length(btrim(full_name)) BETWEEN 1 AND 150),
  dietary_restrictions text NOT NULL DEFAULT '' CHECK (length(dietary_restrictions) <= 500),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (event_invitation_id, plus_one_permitted)
    REFERENCES wedding.event_invitations(id, allows_plus_one),
  FOREIGN KEY (event_invitation_id, host_attending)
    REFERENCES wedding.rsvp_responses(event_invitation_id, attending),
  CHECK (NOT attending OR full_name IS NOT NULL),
  CHECK (attending OR (full_name IS NULL AND dietary_restrictions = ''))
);
-- statement-breakpoint
CREATE TABLE wedding.guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_party_id uuid NOT NULL REFERENCES wedding.invitation_parties(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
-- statement-breakpoint
CREATE INDEX guest_sessions_party_idx ON wedding.guest_sessions(invitation_party_id);
-- statement-breakpoint
CREATE INDEX guest_sessions_expiry_idx ON wedding.guest_sessions(expires_at);
-- statement-breakpoint
CREATE FUNCTION wedding.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- statement-breakpoint
CREATE TRIGGER invitation_parties_updated BEFORE UPDATE ON wedding.invitation_parties
FOR EACH ROW EXECUTE FUNCTION wedding.touch_updated_at();
-- statement-breakpoint
CREATE TRIGGER guests_updated BEFORE UPDATE ON wedding.guests
FOR EACH ROW EXECUTE FUNCTION wedding.touch_updated_at();
-- statement-breakpoint
CREATE TRIGGER events_updated BEFORE UPDATE ON wedding.events
FOR EACH ROW EXECUTE FUNCTION wedding.touch_updated_at();
-- statement-breakpoint
CREATE TRIGGER event_invitations_updated BEFORE UPDATE ON wedding.event_invitations
FOR EACH ROW EXECUTE FUNCTION wedding.touch_updated_at();
-- statement-breakpoint
CREATE TRIGGER rsvp_responses_updated BEFORE UPDATE ON wedding.rsvp_responses
FOR EACH ROW EXECUTE FUNCTION wedding.touch_updated_at();
-- statement-breakpoint
CREATE TRIGGER plus_one_responses_updated BEFORE UPDATE ON wedding.plus_one_responses
FOR EACH ROW EXECUTE FUNCTION wedding.touch_updated_at();
-- statement-breakpoint
INSERT INTO wedding.events (slug, name, event_date, venue_name, venue_address, rsvp_closes_at)
VALUES (
  'wedding-2027', 'Kelly & Luke’s Wedding', '2027-04-11',
  'Philadelphia Water Works', '640 Waterworks Dr, Philadelphia, PA 19130',
  '2027-02-12 00:00:00 America/New_York'::timestamptz
);
