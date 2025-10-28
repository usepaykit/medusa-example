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

### Step 2: Create a Draft Order

POST http://localhost:9000/admin/draft-orders
Authorization: Bearer {token}
Content-Type: application/json

```json
{
  "email": "test@example.com",
  "region_id": "reg_123...",
  "items": [
    {
      "variant_id": "variant_123...",
      "quantity": 1
    }
  ],
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "Copenhagen",
    "country_code": "DK",
    "postal_code": "2100"
  },
  "billing_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "Copenhagen",
    "country_code": "DK",
    "postal_code": "2100"
  }
}
```

Response:

```json
{
  "draft_order": {
    "id": "order_123...",
    "status": "draft",
    "total": 10
  }
}
```

### Step 3: Convert Draft Order to Order

POST http://localhost:9000/admin/draft-orders/order_123.../convert-to-order
Authorization: Bearer {token}
Content-Type: application/json

Response:

```json
{
  "order": {
    "id": "order_123...",
    "status": "pending",
    "total": 10
  }
}
```

### Step 4: Create Payment Collection

POST http://localhost:9000/admin/payment-collections
Authorization: Bearer {token}
Content-Type: application/json

```json
{
  "order_id": "order_123...",
  "amount": 10
}
```

Response:

```json
{
  "payment_collection": {
    "id": "pay_col_123...",
    "amount": 10,
    "status": "not_paid"
  }
}
```

### Step 5: Create Publishable API Key

Create a publishable API key in the Medusa admin dashboard or via API:

POST http://localhost:9000/admin/api-keys
Authorization: Bearer {token}
Content-Type: application/json

```json
{
  "title": "Test Key",
  "type": "publishable"
}
```

Response:

```json
{
  "api_key": {
    "token": "pk_123..."
  }
}
```

### Step 6: Create Payment Session

This is where PayKit gets involved:

POST http://localhost:9000/store/payment-collections/pay_col_123.../payment-sessions
x-publishable-api-key: pk_123...
Content-Type: application/json

```json
{
  "provider_id": "pp_paykit_stripe",
  "data": {
    "email": "test@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "item_id": "order_123...",
    "provider_metadata": {
      "success_url": "https://example.com/success",
      "cancel_url": "https://example.com/cancel"
    }
  }
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
      "status": "requires_capture"
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

## Webhook Setup

To enable automatic payment completion, set up Stripe webhooks:

### 0. Setup Stripe CLI for Local Development

Since Stripe requires HTTPS endpoints, use the Stripe CLI to forward webhooks to your local server:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe: `stripe login`
3. Start your Medusa server: `yarn dev`
4. Forward webhooks: `stripe listen --forward-to localhost:9000/hooks/payment/paykit_stripe`
5. Copy the webhook secret: The CLI will display a webhook secret starting with `whsec_`

### 1. Configure Webhook Secret

Copy the webhook secret from the Stripe CLI output and add it to your `.env` file:

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli
```

### 2. Test Webhook

The Stripe CLI automatically forwards these events to your local server:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `checkout.session.completed`

Once configured, payments completed in Stripe will automatically:

- Update payment session status in Medusa
- Create payment records
- Complete the order flow

## Admin Interface

Access the Medusa admin at http://localhost:9000/app to manage orders, customers, and products through the web interface.
