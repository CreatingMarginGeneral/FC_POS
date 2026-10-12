# Fresh Clothes Counter POS

Dedicated touch-screen Point of Sale application designed for the service counter to quickly tally services, look up customers, process card payments via Stripe Elements, and email receipts to customers and store support.

## Features
- **Employee Login**: Authenticates counter staff via Firebase Auth against the `employee` (or `employees`) Firestore collection, linking orders to the specific staff member and store.
- **Quick Service Tally**:
  - Premium Drop Off ($1.25 / lb) with direct weight calculation
  - Budget Drop Off ($0.50 / lb)
  - Shoe Polish ($15.00)
  - Ironing ($3.00)
  - Other (custom service name & custom dollar amount)
  - Live order tally table and items counter
- **Customer Lookup**:
  - Search existing customers by **Email** or **Phone number** in the Firestore `users` collection.
  - Or quickly register new counter walk-ins with First Name, Email, and Phone.
- **Order Care Instructions**:
  - Add stain treatment, hang-dry, or fragrance-free instructions and order-specific notes at checkout.
  - Carry care instructions into the saved order, receipt dispatch, and printable counter receipt.
- **Touch-screen Card Payment**:
  - Embedded **Stripe Elements** for credit and debit cards.
  - High-contrast, large touch-target buttons and fields optimized for touch tablets and kiosk screens.
- **Automated Receipts & Store Notifications**:
  - Emails itemized receipt to customer upon successful payment.
  - Resolves store record in Firestore (`stores` or `store`) and sends an order notification to the store's support inbox.
  - Auto-reset timer (15 seconds) or instant reset button to prepare the screen for the next customer.
  - Printable counter receipt via browser print dialog.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Dev Mode
```bash
npm run dev
```
The app will launch at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```
The optimized static build will be generated in `dist/`.

## Environment Variables
Configured in `.env`:
- `VITE_FIREBASE_API_KEY`: Fresh Clothes Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_STRIPE_PUBLISHABLE_KEY`: Live Stripe publishable key for card entry
- `VITE_API_BASE_URL`: Cloud Functions URL for payment intent & receipt dispatch
