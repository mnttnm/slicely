-- Add trigger function to update tsv column
CREATE OR REPLACE FUNCTION outputs_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('english', NEW.text_content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update tsv column before insert or update
CREATE TRIGGER outputs_tsv_update
  BEFORE INSERT OR UPDATE ON outputs
  FOR EACH ROW
  EXECUTE FUNCTION outputs_tsv_trigger();

-- Update existing records with tsv values
UPDATE outputs SET tsv = to_tsvector('english', text_content);

-- Add GIN index for text search
CREATE INDEX outputs_tsv_idx ON outputs USING GIN (tsv);
