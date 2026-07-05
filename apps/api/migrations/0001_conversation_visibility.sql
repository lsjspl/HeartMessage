ALTER TABLE conversations ADD COLUMN deleted_by_participant_a_at INTEGER;
ALTER TABLE conversations ADD COLUMN deleted_by_participant_b_at INTEGER;
ALTER TABLE messages ADD COLUMN read_at INTEGER;
