import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, PosOrder } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://us-central1-fresh-clothes.cloudfunctions.net';

const DEFAULT_SUPPORT_EMAIL = 'support_boisewb@freshclotheslaundry.com';

/**
 * Searches the Firestore 'users' collection for an existing customer
 * by either email or phone number.
 */
export async function searchCustomer(term: { email?: string; phone?: string }): Promise<Customer | null> {
  const usersRef = collection(db, 'users');

  if (term.email && term.email.trim()) {
    const emailNorm = term.email.trim().toLowerCase();
    const qEmail = query(usersRef, where('email', '==', emailNorm));
    const snap = await getDocs(qEmail);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data();
      return {
        id: d.id,
        uid: d.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || emailNorm,
        phoneNumber: data.phoneNumber || '',
        storeUID: data.storeUID || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postalcode: data.postalcode || '',
      };
    }
  }

  if (term.phone && term.phone.trim()) {
    const rawPhone = term.phone.trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    
    // Check various formats (raw, formatted, or with +1)
    const candidates = [rawPhone, cleanPhone, `+1${cleanPhone}`, `1${cleanPhone}`];
    
    for (const phoneCandidate of candidates) {
      const qPhone = query(usersRef, where('phoneNumber', '==', phoneCandidate));
      const snap = await getDocs(qPhone);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        return {
          id: d.id,
          uid: d.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || rawPhone,
          storeUID: data.storeUID || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalcode: data.postalcode || '',
        };
      }
    }
  }

  return null;
}

/**
 * Resolves the store's notification email address from Firestore 'stores' or 'store'
 */
export async function resolveStoreSupportEmail(storeUID?: string): Promise<string> {
  if (!storeUID) return DEFAULT_SUPPORT_EMAIL;

  for (const col of ['store', 'stores']) {
    try {
      const storeDoc = await getDoc(doc(db, col, storeUID));
      if (storeDoc.exists()) {
        const data = storeDoc.data() || {};
        const owner = data.owner || {};
        const candidates = [
          data.supportEmail,
          data.adminEmail,
          data.ownerEmail,
          data.email,
          owner.email,
          owner.contactEmail,
          owner.primaryEmail,
        ];
        for (const c of candidates) {
          if (typeof c === 'string' && c.trim().length > 0) {
            return c.trim();
          }
        }
      }
    } catch (err) {
      console.warn(`Could not fetch store record from ${col}:`, err);
    }
  }

  return DEFAULT_SUPPORT_EMAIL;
}

/**
 * Helper to call Cloud Function endpoint with fallback naming
 */
async function callFunctionEndpoint(endpointName: string, bodyData: any): Promise<Response> {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const candidateUrls = [
    `${base}/${endpointName}`,
    `${base}/api-v2-${endpointName}`,
    `https://freshclotheslaundry.com/api/pos/${endpointName.replace(/V2$/, '')}`,
  ];

  let lastError: any = null;
  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      // If 404 (endpoint not found under this name), try next candidate URL
      if (resp.status === 404) continue;
      return resp;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Could not connect to function endpoint ${endpointName}`);
}

/**
 * Creates a Stripe PaymentIntent for the POS order
 */
export async function createPaymentIntent(params: {
  amountCents: number;
  customerEmail: string;
  customerName: string;
  storeUID: string;
  orderSummary: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const response = await callFunctionEndpoint('posCreatePaymentIntentV2', params);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create payment intent');
  }

  return await response.json();
}

/**
 * Records the completed POS order in Firestore and triggers customer & store receipts
 */
export async function recordOrderAndSendReceipt(order: Omit<PosOrder, 'id' | 'createdAt'>): Promise<string> {
  // 1. Save order to Firestore 'posOrders' collection
  const orderRef = await addDoc(collection(db, 'posOrders'), {
    ...order,
    createdAt: serverTimestamp(),
  });

  // 2. Trigger receipt email dispatch endpoint
  try {
    const storeEmail = await resolveStoreSupportEmail(order.storeUID);
    await callFunctionEndpoint('posSendReceiptV2', {
      orderId: orderRef.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      customerPhone: order.customer.phoneNumber,
      storeSupportEmail: storeEmail,
      items: order.items,
      careInstructions: order.careInstructions || [],
      totalItems: order.totalItems,
      subtotal: order.subtotal,
      total: order.total,
      paymentIntentId: order.paymentIntentId,
      storeUID: order.storeUID,
    });
  } catch (err) {
    console.error('Receipt dispatch request error:', err);
  }

  return orderRef.id;
}
