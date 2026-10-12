import { Employee } from '../types';

export interface EmployeeCodeConfig {
  code: string;
  employee: Employee;
}

// Default fallback list of counter staff codes
export const DEFAULT_EMPLOYEE_CODES: EmployeeCodeConfig[] = [
  {
    code: '1234',
    employee: {
      uid: 'staff-1234',
      email: 'counter@freshclotheslaundry.com',
      name: 'Counter Staff',
      role: 'staff',
      storeUID: 'boise-store',
      active: true,
    },
  },
  {
    code: '2081',
    employee: {
      uid: 'staff-2081',
      email: 'boise1@freshclotheslaundry.com',
      name: 'Boise Staff 1',
      role: 'staff',
      storeUID: 'boise-store',
      active: true,
    },
  },
  {
    code: '2082',
    employee: {
      uid: 'staff-2082',
      email: 'boise2@freshclotheslaundry.com',
      name: 'Boise Staff 2',
      role: 'staff',
      storeUID: 'boise-store',
      active: true,
    },
  },
  {
    code: '9999',
    employee: {
      uid: 'manager-9999',
      email: 'manager@freshclotheslaundry.com',
      name: 'Store Manager',
      role: 'manager',
      storeUID: 'boise-store',
      active: true,
    },
  },
];

export function getEmployeeCodes(): EmployeeCodeConfig[] {
  const envRaw = import.meta.env.VITE_EMPLOYEE_CODES;
  if (!envRaw) {
    return DEFAULT_EMPLOYEE_CODES;
  }

  try {
    const parsed = JSON.parse(envRaw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Could not parse VITE_EMPLOYEE_CODES JSON, falling back to default:', err);
  }

  return DEFAULT_EMPLOYEE_CODES;
}

export function verifyEmployeeCode(inputCode: string): Employee | null {
  const cleanCode = inputCode.trim();
  const list = getEmployeeCodes();
  const match = list.find((item) => item.code === cleanCode);
  return match ? match.employee : null;
}
