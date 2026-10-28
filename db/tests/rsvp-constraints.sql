-- All fixture writes are deliberately rolled back by the final exception.
DO $$
DECLARE
  party_id uuid;
  guest_a uuid;
  guest_b uuid;
  wedding_id uuid;
  without_plus_one uuid;
  with_plus_one uuid;
BEGIN
  INSERT INTO wedding.invitation_parties(display_name, invitation_code_hash)
    VALUES ('Database verification fixture', repeat(md5(gen_random_uuid()::text), 2))
    RETURNING id INTO party_id;
  INSERT INTO wedding.guests(invitation_party_id, first_name, last_name)
    VALUES (party_id, 'Sample', 'Verification') RETURNING id INTO guest_a;
  INSERT INTO wedding.guests(invitation_party_id, first_name, last_name)
    VALUES (party_id, 'Example', 'Verification') RETURNING id INTO guest_b;
  SELECT id INTO STRICT wedding_id FROM wedding.events WHERE slug = 'wedding-2027';
  INSERT INTO wedding.event_invitations(guest_id, event_id, allows_plus_one)
    VALUES (guest_a, wedding_id, false) RETURNING id INTO without_plus_one;
  INSERT INTO wedding.event_invitations(guest_id, event_id, allows_plus_one)
    VALUES (guest_b, wedding_id, true) RETURNING id INTO with_plus_one;
  INSERT INTO wedding.rsvp_responses(event_invitation_id, attending)
    VALUES (without_plus_one, true), (with_plus_one, true);

  BEGIN
    INSERT INTO wedding.rsvp_responses(event_invitation_id, attending)
      VALUES (without_plus_one, true);
    RAISE EXCEPTION 'Duplicate RSVP was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO wedding.plus_one_responses(event_invitation_id, attending, full_name)
      VALUES (without_plus_one, true, 'Unauthorized sample guest');
    RAISE EXCEPTION 'Unpermitted plus-one was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO wedding.plus_one_responses(event_invitation_id, attending)
      VALUES (with_plus_one, true);
    RAISE EXCEPTION 'Attending plus-one without a name was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  INSERT INTO wedding.plus_one_responses(event_invitation_id, attending, full_name)
    VALUES (with_plus_one, true, 'Permitted sample guest');
  BEGIN
    UPDATE wedding.rsvp_responses SET attending = false WHERE event_invitation_id = with_plus_one;
    RAISE EXCEPTION 'Declined host retained an attending plus-one';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    UPDATE wedding.rsvp_responses SET attending = false, dietary_restrictions = 'Stale sample note'
      WHERE event_invitation_id = without_plus_one;
    RAISE EXCEPTION 'Declined guest retained dietary notes';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  DELETE FROM wedding.plus_one_responses WHERE event_invitation_id = with_plus_one;
  UPDATE wedding.rsvp_responses SET attending = false WHERE event_invitation_id = with_plus_one;
  BEGIN
    INSERT INTO wedding.plus_one_responses(event_invitation_id, attending, full_name)
      VALUES (with_plus_one, true, 'Sample guest without attending host');
    RAISE EXCEPTION 'Plus-one without an attending host was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO wedding.guest_sessions(invitation_party_id, token_hash, expires_at)
      VALUES (party_id, repeat(md5(gen_random_uuid()::text), 2), now() - interval '1 hour');
    RAISE EXCEPTION 'Already-expired session was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO wedding.invitation_parties(display_name, invitation_code_hash)
      VALUES ('Invalid credential fixture', 'plaintext-invitation-code');
    RAISE EXCEPTION 'Plaintext invitation code was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  RAISE EXCEPTION 'RSVP_SCHEMA_VERIFICATION_ROLLBACK';
END;
$$;
