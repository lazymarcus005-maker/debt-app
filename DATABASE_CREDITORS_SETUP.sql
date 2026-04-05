-- Create creditors table
CREATE TABLE creditors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL DEFAULT 'bank', -- 'bank', 'digital_wallet', 'card', 'other'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add creditor_id to bills table (if not already exists)
ALTER TABLE bills ADD COLUMN creditor_id BIGINT REFERENCES creditors(id) ON DELETE SET NULL;

-- Insert initial creditor master data
INSERT INTO creditors (name, type) VALUES
('ธนาคารกรุงเทพ (Bangkok Bank)', 'bank'),
('ธนาคารกสิกรไทย (KBank)', 'bank'),
('ธนาคารกรุงไทย (Krungthai Bank)', 'bank'),
('ธนาคารไทยพาณิชย์ (SCB)', 'bank'),
('ธนาคารกรุงศรีอยุธยา (Krungsri / BAY)', 'bank'),
('ธนาคารทหารไทยธนชาต (ttb)', 'bank'),
('ธนาคารยูโอบี (UOB)', 'bank'),
('ธนาคารซีไอเอ็มบี ไทย (CIMB Thai)', 'bank'),
('ธนาคารเกียรตินาคินภัทร (KKP)', 'bank'),
('ธนาคารทิสโก้ (TISCO)', 'bank'),
('KTC (Krungthai Card)', 'card'),
('AEON Thana Sinsap', 'card'),
('ShopeePayLater', 'digital_wallet'),
('LazadaPayLater', 'digital_wallet')
ON CONFLICT (name) DO NOTHING;

-- Create index for better query performance
CREATE INDEX idx_creditors_type ON creditors(type);
