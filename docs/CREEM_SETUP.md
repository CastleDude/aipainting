# Creem Payment Integration Setup

This guide walks through setting up [Creem](https://app.creem.io) for the AI Painting payment system.

## 1. Create a Creem Account

1. Go to [app.creem.io](https://app.creem.io) and sign up
2. Switch to **Test Mode** during development (toggle in the dashboard header)
3. Complete any verification steps Creem requires

## 2. Get API Keys

1. Navigate to **Developers → API Keys** in the Creem dashboard
2. Create a new API key (or copy the existing test key)
3. Copy the key — this goes into `CREEM_API_KEY`

## 3. Create Subscription Products

Go to **Products** and create three subscription products. Each needs a **monthly recurring** pricing model.

| Product | Price | Notes |
|---------|-------|-------|
| Basic | $6/month | 500 fast images/month |
| Premium | $10/month | 2,000 fast images/month |
| Ultimate | $20/month | 5,000 fast images/month |

After creating each product, copy its **Product ID** (visible in the product detail page). You'll need three IDs:
- `CREEM_BASIC_PRODUCT_ID`
- `CREEM_PREMIUM_PRODUCT_ID`
- `CREEM_ULTIMATE_PRODUCT_ID`

## 4. Configure Webhook

The webhook handler at `/api/creem/webhook` processes subscription lifecycle events.

1. Go to **Developers → Webhooks**
2. Click **Add Endpoint**
3. Set the URL to: `https://your-domain.com/api/creem/webhook` (use your production domain or a tunnel like ngrok for local dev)
4. Select these events:
   - `checkout.completed` — creates order record and upgrades user tier after payment
   - `subscription.paid` — grants monthly credits on each renewal
   - `subscription.canceled` — marks subscription as canceled
   - `subscription.expired` — marks subscription as expired, downgrades to free
5. After creating the webhook, copy the **Webhook Secret**
6. Paste it into `CREEM_WEBHOOK_SECRET`

### Webhook events mapped to app behavior

| Creem Event | App Action |
|-------------|-----------|
| `checkout.completed` | Creates order record, upgrades user tier, inserts subscription |
| `subscription.paid` | Adds monthly credits to user profile, updates subscription period |
| `subscription.canceled` | Sets subscription status to `canceled` |
| `subscription.expired` | Sets subscription status to `expired`, downgrades user to free |

## 5. Environment Variables

Add these to your `.env.local` (and your deployment platform's env vars):

```bash
CREEM_API_KEY=creem_test_your-api-key
CREEM_WEBHOOK_SECRET=your-webhook-secret
CREEM_BASIC_PRODUCT_ID=prod_basic_xxx
CREEM_PREMIUM_PRODUCT_ID=prod_premium_xxx
CREEM_ULTIMATE_PRODUCT_ID=prod_ultimate_xxx
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 6. Test the Integration

### Test checkout flow
1. Start the dev server: `npm run dev`
2. Click "Subscribe" on the pricing page for any paid plan
3. You should be redirected to the Creem checkout page
4. In Test Mode, use Creem's test cards:
   - `4242 4242 4242 4242` — successful payment
   - Any valid future expiry date and CVC

### Test webhook locally
- Use [ngrok](https://ngrok.com) to expose your local server: `ngrok http 3000`
- Set the webhook URL in Creem to your ngrok URL + `/api/creem/webhook`
- Complete a test purchase — watch your terminal for webhook logs

### Verify in the app
1. Check the **Dashboard** — tier should update to the purchased plan
2. Check the **Admin → Subscriptions** page — the subscription should appear
3. Dashboard "Manage Plan" button opens the Creem Customer Portal

## 7. Customer Portal

Users can manage their subscription (cancel, update payment method, view invoices) via the Customer Portal. The "Manage Plan" button in the Dashboard calls `/api/creem/portal` which creates a portal session and redirects the user.

## 8. Go Live

1. Replace test API keys with live keys in your environment
2. Replace test product IDs with live product IDs
3. Update the webhook URL to your production domain
4. Switch Creem dashboard from Test Mode to Live Mode
5. Do a real test purchase and immediately cancel (within trial period) to verify end-to-end

## Troubleshooting

| Problem | Check |
|---------|-------|
| Checkout redirects fail | Verify `CREEM_API_KEY` and product IDs are correct |
| Webhook not received | Check webhook endpoint URL is publicly accessible. View webhook delivery logs in Creem dashboard |
| Subscription not activating | Check `SUPABASE_SERVICE_ROLE_KEY` is set. Check webhook logs for payload format errors |
| Portal returns 404 | User must have an active subscription with a valid `creem_subscription_id` |
| Portal returns 401 | User must be logged in |
