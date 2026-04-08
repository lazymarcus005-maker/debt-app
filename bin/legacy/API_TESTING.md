# API Testing Guide

Test the Finance Manager API using `curl`, Postman, or any HTTP client.

## Base URL

```
http://localhost:3030  # Docker
http://localhost:3000  # Local dev
```

---

## Authentication Endpoints

### 1. Sign Up (Create Account)

```bash
curl -X POST http://localhost:3030/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "john@example.com",
    "name": "John Doe"
  }'
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo@example.com"
  }'
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Demo User",
    "email": "demo@example.com"
  }
}
```

**Save the token:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Bills Endpoints

All bill endpoints require authentication. Include the JWT token:

```bash
-H "Authorization: Bearer $TOKEN"
```

### 3. Get All Bills

```bash
curl -X GET http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "bills": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Electricity",
      "billing_type": "recurring",
      "sub_type": "utility",
      "amount": 100,
      "due_day": 27,
      "start_date": "2024-01-01",
      "next_due_date": "2024-04-27",
      "last_paid_at": null,
      "is_active": true,
      "created_at": "2024-04-05T10:00:00Z",
      "updated_at": "2024-04-05T10:00:00Z"
    }
  ]
}
```

### 4. Create a Bill (Recurring)

```bash
curl -X POST http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netflix Subscription",
    "billing_type": "recurring",
    "sub_type": "subscription",
    "amount": 150,
    "due_day": 1,
    "start_date": "2024-04-01"
  }'
```

**Response (201):**
```json
{
  "bill": {
    "id": 6,
    "user_id": 1,
    "name": "Netflix Subscription",
    "billing_type": "recurring",
    "sub_type": "subscription",
    "amount": 150,
    "due_day": 1,
    "start_date": "2024-04-01",
    "next_due_date": "2024-05-01",
    "last_paid_at": null,
    "is_active": true
  }
}
```

### 5. Create a Bill (Debt - Credit Card)

```bash
curl -X POST http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Visa Card",
    "billing_type": "debt",
    "sub_type": "credit_card",
    "total_amount": 50000,
    "remaining_amount": 35000,
    "due_day": 15,
    "start_date": "2024-03-01"
  }'
```

### 6. Record a Payment

```bash
curl -X POST http://localhost:3030/api/bills/1/pay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "cycle_due_date": "2024-04-27"
  }'
```

**Response (201):**
```json
{
  "payment": {
    "id": 1,
    "bill_id": 1,
    "amount": 100,
    "paid_at": "2024-04-05T10:30:00Z",
    "cycle_due_date": "2024-04-27",
    "created_at": "2024-04-05T10:30:00Z"
  }
}
```

---

## Error Responses

### 401 Unauthorized (Missing Token)

```bash
curl -X GET http://localhost:3030/api/bills
```

**Response:**
```json
{
  "error": "Missing or invalid authorization header"
}
```

### 401 Invalid Token

```bash
curl -X GET http://localhost:3030/api/bills \
  -H "Authorization: Bearer invalid-token"
```

**Response:**
```json
{
  "error": "Invalid or expired token"
}
```

### 400 Bad Request (Missing Fields)

```bash
curl -X POST http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electricity"
  }'
```

**Response:**
```json
{
  "error": "Missing required fields"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Testing with Postman

### 1. Create Environment

- **Base URL**: `http://localhost:3030`
- **Token**: (empty initially)

### 2. Create Requests

#### POST /api/auth/login
- **URL**: `{{base_url}}/api/auth/login`
- **Body** (JSON):
```json
{
  "email": "demo@example.com",
  "password": "demo@example.com"
}
```

#### GET /api/bills
- **URL**: `{{base_url}}/api/bills`
- **Headers**:
  - `Authorization`: `Bearer {{token}}`

---

## Testing with JavaScript/Fetch

### 1. Login and Save Token

```javascript
const response = await fetch('http://localhost:3030/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo@example.com',
    password: 'demo@example.com'
  })
});

const data = await response.json();
const token = data.token;
localStorage.setItem('auth_token', token);
```

### 2. Get Bills

```javascript
const token = localStorage.getItem('auth_token');
const response = await fetch('http://localhost:3030/api/bills', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.bills);
```

### 3. Create Bill

```javascript
const token = localStorage.getItem('auth_token');
const response = await fetch('http://localhost:3030/api/bills', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Water Bill',
    billing_type: 'recurring',
    sub_type: 'utility',
    amount: 150,
    due_day: 25,
    start_date: '2024-01-01'
  })
});

const data = await response.json();
console.log(data.bill);
```

---

## Test Scenarios

### Scenario 1: User Signup & First Bill

```bash
# 1. Sign up
RESPONSE=$(curl -s -X POST http://localhost:3030/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "newuser@example.com",
    "name": "New User"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 2. Create bill
curl -X POST http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "First Bill",
    "billing_type": "recurring",
    "sub_type": "utility",
    "amount": 100,
    "due_day": 15,
    "start_date": "2024-04-01"
  }'

# 3. Get bills
curl -X GET http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN"
```

### Scenario 2: Record Payment

```bash
# 1. Get bills to find ID
curl -X GET http://localhost:3030/api/bills \
  -H "Authorization: Bearer $TOKEN" | jq '.bills[0].id'

# 2. Record payment (assuming bill ID is 1)
curl -X POST http://localhost:3030/api/bills/1/pay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "cycle_due_date": "2024-04-15"
  }'
```

---

## Common Issues

### "Cannot POST /api/bills"
→ Make sure you're using `POST`, not `GET`

### "Invalid or expired token"
→ Token expired or malformed (login again)

### CORS Error
→ Running from different domain (use proxy or add CORS headers)

### "Network Error"
→ Make sure Docker is running or dev server is started

---

## Rate Limiting (Future)

Currently no rate limiting. Production ready:
```bash
# Example: 100 requests per minute per IP
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1712250600
```

---

For more, see:
- 📖 [README.md](./README.md)
- 🚀 [QUICKSTART.md](./QUICKSTART.md)
- 📝 Source code in `/app/api`
