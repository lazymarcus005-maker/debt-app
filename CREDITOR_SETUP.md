# Creditor Management Setup Guide

## Overview
You now have creditor/lender selection for installment and loan bills. This allows you to track which creditor/bank you owe money to.

## Step 1: Add Creditors Table to Supabase

Go to your Supabase dashboard and run the SQL from [DATABASE_CREDITORS_SETUP.sql](./DATABASE_CREDITORS_SETUP.sql):

**SQL Query:**
```sql
-- Create creditors table
CREATE TABLE creditors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL DEFAULT 'bank',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add creditor_id to bills table
ALTER TABLE bills ADD COLUMN creditor_id BIGINT REFERENCES creditors(id) ON DELETE SET NULL;

-- Insert master data
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

-- Create index for performance
CREATE INDEX idx_creditors_type ON creditors(type);
```

## Step 2: How to Use

### Adding Loan/Installment Bills with Creditor

1. Go to **Bills** tab
2. Click **+** button to add bill
3. Select **Type**: "Debt"
4. Select **Category**: "Loan" or "Installment"
5. Fill in bill details and amounts
6. **New**: Select creditor from dropdown or click **+ Add** to add new creditor
7. Click **Add Bill**

### Fields

- **Bill Name**: e.g., "Home Loan"
- **Type**: Recurring or Debt
- **Category**: 
  - Recurring: Utility, Subscription
  - Debt: Credit Card, Loan, Installment
- **Start Date**: When the debt started
- **Due Day**: Day of month payment is due (1-31)
- **Total Amount (฿)**: Total debt amount
- **Remaining Amount (฿)**: Amount still owed
- **Installment Amount (฿)**: Optional - monthly payment amount
- **Creditor/Lender**: Which bank/company you borrowed from
  - Pre-populated with 14 Thai creditors
  - Click **+ Add** to add custom creditors

## API Endpoints

### Get All Creditors
```
GET /api/creditors
Response: { creditors: Creditor[] }
```

### Add New Creditor
```
POST /api/creditors
Headers: Authorization: Bearer <token>
Body: { name: string, type?: string }
Response: { creditor: Creditor }
```

### Create Bill with Creditor
```
POST /api/bills
Headers: Authorization: Bearer <token>
Body: {
  name: string,
  billing_type: 'recurring' | 'debt',
  sub_type: string,
  amount?: number,
  due_day: number,
  start_date: string,
  total_amount?: number,
  remaining_amount?: number,
  installment_amount?: number,
  creditor_id?: number
}
```

## Creditor Types Available

### Pre-loaded Banks (14 default)
- **Government Banks**: Bangkok Bank, KBank, Krungthai, SCB, Krungsri, TTB
- **Private Banks**: UOB, CIMB Thai, KKP, TISCO
- **Cards**: KTC, AEON
- **Digital Wallets**: ShopeePayLater, LazadaPayLater

### Add Custom Creditor
Click the **+ Add** button next to creditor dropdown to add any creditor not in the list.

## Database Schema

```
TABLE creditors
├── id (BIGSERIAL PRIMARY KEY)
├── name (VARCHAR UNIQUE)
├── type (VARCHAR) - 'bank', 'card', 'digital_wallet', 'other'
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

TABLE bills
├── ... existing fields ...
├── creditor_id (BIGINT FOREIGN KEY)
└── ... other fields ...
```

## Troubleshooting

**Issue**: "Creditor already exists" error
- **Solution**: The creditor name must be unique. Choose a different name or select existing creditor from dropdown.

**Issue**: Creditor dropdown is empty
- **Solution**: Ensure you've run the SQL setup to create the creditors table and insert master data.

**Issue**: Creditor not appearing after adding
- **Solution**: Close and reopen the add bill modal to refresh the creditor list.
