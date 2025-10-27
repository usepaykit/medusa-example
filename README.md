# Medusa PayKit Integration

A complete integration between Medusa and PayKit SDK for payment processing with Stripe.

## Quick Start

### Prerequisites

- Node.js >= 20
- PostgreSQL database
- Docker (for database)
- Stripe account with API keys

### Setup

1. Install dependencies:

```bash
npm install
```

2. Start the database:

```bash
docker start medusa-postgres
```

3. Start the development server:

```bash
npm run dev
```

The server will be available at http://localhost:9000

## Testing the PayKit Integration

### Step 1: Get Admin API Token

POST http://localhost:9000/auth/user/emailpass
Content-Type: application/json

```json
{
  "email": "admin@example.com",
  "password": "admin"
}
```

Response:

```json
{
  "token": "eyJhbGc..."
}
```

Use `Authorization: Bearer {token}` header for subsequent requests.

### Step 2: Create a Customer

POST http://localhost:9000/admin/customers
Authorization: Bearer {token}
Content-Type: application/json

```json
{
  "email": "test@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

Response:

```json
{
  "customer": {
    "id": "cust_123...",
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

Save the customer.id for the next step.

### Step 3: Get Region & Products

GET http://localhost:9000/admin/regions
Authorization: Bearer {token}
Content-Type: application/json

Response:

```json
{
  "regions": [
    {
      "id": "reg_123...",
      "name": "US"
    }
  ]
}
```

GET http://localhost:9000/admin/products
Authorization: Bearer {token}
Content-Type: application/json

Response:

```json
{
  "products": [
    {
      "id": "prod_123...",
      "title": "Product Name",
      "variants": [
        {
          "id": "variant_123...",
          "title": "Default Title"
        }
      ]
    }
  ]
}
```

Save the variant_id and region_id.

### Step 4: Create an Order

POST http://localhost:9000/admin/orders
Authorization: Bearer {token}
Content-Type: application/json

```json
{
  "email": "test@example.com",
  "customer_id": "cust_123...",
  "region_id": "reg_123...",
  "items": [
    {
      "variant_id": "variant_123...",
      "quantity": 2
    }
  ],
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "San Francisco",
    "province": "CA",
    "postal_code": "94111",
    "country_code": "US"
  },
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "San Francisco",
    "province": "CA",
    "postal_code": "94111",
    "country_code": "US"
  }
}
```

Response:

```json
{
  "order": {
    "id": "order_123...",
    "display_id": 1,
    "customer_id": "cust_123...",
    "email": "test@example.com",
    "items": [...],
    "total": 10000,
    "status": "pending"
  }
}
```

### Step 5: Create Payment Session

This is where PayKit gets involved automatically:

POST http://localhost:9000/admin/orders/order_123.../payment-sessions
Authorization: Bearer {token}
Content-Type: application/json

```json
{
  "provider_id": "pp_paykit"
}
```

What happens here:

- Medusa calls the PayKit adapter
- PayKit adapter calls initiatePayment()
- PayKit creates customer in Stripe
- PayKit creates payment intent in Stripe
- Returns payment intent data

Response:

```json
{
  "payment_session": {
    "id": "ps_123...",
    "provider_id": "pp_paykit",
    "data": {
      "id": "pi_...",
      "client_secret": "pi_...secret",
      "requires_action": false,
      "status": "requires_capture"
    }
  }
}
```

### Step 6: Authorize Payment (Capture)

POST http://localhost:9000/admin/orders/order_123.../payment-sessions/ps_123.../authorize
Authorization: Bearer {token}
Content-Type: application/json

```json
{}
```

Response:

```json
{
  "payment_session": {
    "id": "ps_123...",
    "provider_id": "pp_paykit",
    "data": {
      "status": "succeeded"
    }
  }
}
```

## Configuration

The PayKit integration is configured in `medusa-config.ts` with Stripe as the payment provider. Make sure to set your Stripe API keys in the `.env` file:

```
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Admin Interface

Access the Medusa admin at http://localhost:9000/app to manage orders, customers, and products through the web interface.
