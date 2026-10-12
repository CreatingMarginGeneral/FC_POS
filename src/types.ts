export interface Employee {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  storeUID?: string;
  active?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: 'lb' | 'item' | 'service';
  defaultQuantity?: number;
  iconType: 'washer' | 'budget' | 'shoe' | 'iron' | 'other';
}

export interface CartItem {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: 'lb' | 'item' | 'service';
  quantity: number;
  total: number;
  customNotes?: string;
}

export interface Customer {
  id?: string;
  uid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  storeUID?: string;
  address?: string;
  city?: string;
  state?: string;
  postalcode?: string;
}

export interface PosOrder {
  id?: string;
  orderNumber: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  careInstructions?: string[];
  customer: Customer;
  employee: {
    uid: string;
    email: string;
    name?: string;
  };
  storeUID: string;
  paymentIntentId: string;
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
}
