-- 1. Create garbage_duties table
CREATE TABLE IF NOT EXISTS garbage_duties (
  id SERIAL PRIMARY KEY,
  duty_date DATE NOT NULL,
  shift VARCHAR(20) NOT NULL CHECK (shift IN ('morning', 'afternoon')),
  classroom VARCHAR(50) NOT NULL,
  assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create garbage_reports table
CREATE TABLE IF NOT EXISTS garbage_reports (
  id SERIAL PRIMARY KEY,
  duty_id INT REFERENCES garbage_duties(id) ON DELETE SET NULL,
  classroom VARCHAR(50) NOT NULL,
  reported_by INT REFERENCES users(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'not_clean', 'extra_help')),
  score_modifier DECIMAL(3,1) DEFAULT 0,
  inspector_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_garbage_reports
BEFORE UPDATE ON garbage_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
