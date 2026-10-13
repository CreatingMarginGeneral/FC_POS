import { useState, useEffect } from 'react';
import { loadStripeTerminal } from '@stripe/terminal-js';
import type { Terminal, Reader } from '@stripe/terminal-js';
import { CartItem } from '../types';
import { fetchTerminalConnectionToken } from './api';

let terminalInstance: Terminal | null = null;
let currentConnectedReader: Reader | null = null;

export interface TerminalState {
  status: 'idle' | 'discovering' | 'connecting' | 'connected' | 'error';
  reader: Reader | null;
  errorMessage: string | null;
}

let listeners: ((state: TerminalState) => void)[] = [];

let currentState: TerminalState = {
  status: 'idle',
  reader: null,
  errorMessage: null,
};

function notifyState(state: Partial<TerminalState>) {
  currentState = { ...currentState, ...state };
  listeners.forEach((fn) => fn(currentState));
}

export function subscribeTerminalState(listener: (state: TerminalState) => void) {
  listeners.push(listener);
  listener(currentState);
  return () => {
    listeners = listeners.filter((fn) => fn !== listener);
  };
}

export function getTerminalState(): TerminalState {
  return currentState;
}

export function useTerminal(): TerminalState {
  const [state, setState] = useState<TerminalState>(currentState);

  useEffect(() => {
    return subscribeTerminalState(setState);
  }, []);

  return state;
}

/**
 * Initializes or gets the Stripe Terminal singleton instance
 */
export async function getTerminalInstance(): Promise<Terminal> {
  if (terminalInstance) {
    return terminalInstance;
  }

  const StripeTerminal = await loadStripeTerminal();
  if (!StripeTerminal) {
    throw new Error('Failed to load Stripe Terminal JS SDK.');
  }

  terminalInstance = StripeTerminal.create({
    onFetchConnectionToken: async () => {
      try {
        return await fetchTerminalConnectionToken();
      } catch (err: any) {
        console.warn('Could not fetch Terminal connection token from backend:', err);
        throw err;
      }
    },
    onUnexpectedReaderDisconnect: () => {
      currentConnectedReader = null;
      notifyState({
        status: 'error',
        reader: null,
        errorMessage: 'WisePOS E reader disconnected unexpectedly.',
      });
    },
    onConnectionStatusChange: (event) => {
      if (event.status === 'not_connected') {
        currentConnectedReader = null;
        notifyState({ status: 'idle', reader: null });
      }
    },
  });

  return terminalInstance;
}

/**
 * Scans for BBPOS WisePOS E on the network and connects to it.
 * If already connected, returns existing reader.
 */
export async function scanAndConnectWisePOSE(): Promise<Reader> {
  notifyState({ status: 'discovering', errorMessage: null });

  try {
    const terminal = await getTerminalInstance();

    // If already connected and reader is healthy, reuse it
    if (currentConnectedReader && terminal.getConnectionStatus() === 'connected') {
      notifyState({ status: 'connected', reader: currentConnectedReader });
      return currentConnectedReader;
    }

    // Discover internet readers on this location / network
    const discoverResult = await terminal.discoverReaders({
      simulated: import.meta.env.VITE_STRIPE_TERMINAL_SIMULATED === 'true',
    });

    if ('error' in discoverResult && discoverResult.error) {
      throw new Error(discoverResult.error.message || 'Error scanning for readers.');
    }

    const readers = 'discoveredReaders' in discoverResult ? discoverResult.discoveredReaders : [];
    if (!readers || readers.length === 0) {
      throw new Error('No BBPOS WisePOS E reader found on this Wi-Fi network.');
    }

    // Prefer WisePOS E device type or take first available online internet reader
    const wisePosReader =
      readers.find(
        (r) =>
          r.device_type === 'bbpos_wisepos_e' ||
          r.device_type?.toLowerCase().includes('wisepos')
      ) || readers[0];

    notifyState({ status: 'connecting', reader: wisePosReader });

    const connectResult = await terminal.connectReader(wisePosReader);
    if ('error' in connectResult && connectResult.error) {
      throw new Error(connectResult.error.message || 'Failed to connect to WisePOS E reader.');
    }

    currentConnectedReader = 'reader' in connectResult ? connectResult.reader : wisePosReader;
    notifyState({ status: 'connected', reader: currentConnectedReader, errorMessage: null });

    return currentConnectedReader;
  } catch (err: any) {
    const errorMsg =
      'Could not connect to BBPOS WisePOS E on Wi-Fi. Please ask the customer to enter their credit card information below (all card information is securely stored in Stripe).';
    notifyState({ status: 'error', errorMessage: errorMsg });
    throw err;
  }
}

/**
 * Sends the current cart line items, tax, and total to the WisePOS E reader display.
 */
export async function sendCartToWisePOSE(cart: CartItem[]): Promise<boolean> {
  try {
    const reader = await scanAndConnectWisePOSE();
    if (!reader) return false;

    const terminal = await getTerminalInstance();
    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

    const lineItems = cart.map((item) => ({
      description: item.name + (item.unit === 'lb' ? ` (${item.quantity} lbs)` : ''),
      amount: Math.round(item.total * 100),
      quantity: item.unit === 'lb' ? 1 : item.quantity,
    }));

    await terminal.setReaderDisplay({
      type: 'cart',
      cart: {
        currency: 'usd',
        tax: 0,
        total: Math.round(totalAmount * 100),
        line_items: lineItems,
      },
    });

    return true;
  } catch (err) {
    console.warn('Failed to send cart to WisePOS E reader:', err);
    return false;
  }
}

/**
 * Clears the customer-facing display on the WisePOS E back to default splash screen.
 */
export async function clearWisePOSDisplay(): Promise<void> {
  try {
    if (terminalInstance && currentConnectedReader) {
      await terminalInstance.clearReaderDisplay();
    }
  } catch (err) {
    console.warn('Could not clear reader display:', err);
  }
}
