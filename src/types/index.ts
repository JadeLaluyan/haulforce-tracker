export interface DriverDTO {
  id: string;
  name: string;
  licenseNo: string | null;
  contact: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
  tripCount?: number;
  advanceOutstanding?: number;
}

export interface HelperDTO {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
  tripCount?: number;
  advanceOutstanding?: number;
}

export interface CashAdvanceDTO {
  id: string;
  driverId: string | null;
  driver?: { id: string; name: string } | null;
  helperId: string | null;
  helper?: { id: string; name: string } | null;
  date: string;
  amount: string;
  reason: string | null;
  settled: boolean;
  settledAt: string | null;
  createdAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  company: string | null;
  address: string | null;
  contact: string | null;
  email: string | null;
  tin: string | null;
  terms: string;
  createdAt: string;
  outstanding?: number;
}

export interface TripDTO {
  id: string;
  tripCode: string;
  date: string;
  driverId: string;
  helperId: string | null;
  customerId: string;
  driver: { id: string; name: string };
  helper: { id: string; name: string } | null;
  customer: { id: string; name: string; company: string | null };
  origin: string;
  destination: string;
  cargoType: string;
  weightKg: string;
  tripRate: string;
  fuelCost: string;
  tollFee: string;
  mealAllowance: string;
  otherExpenses: string;
  driverFee: string;
  helperFee: string;
  notes: string | null;
  status: "PENDING" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  invoice: { id: string; invoiceNo: string } | null;
}

export interface InvoiceDTO {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentTerms: string;
  vatRate: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  trip: TripDTO;
}

export interface PaymentDTO {
  id: string;
  date: string;
  customerId: string;
  customer: { id: string; name: string };
  tripId: string | null;
  trip: { id: string; tripCode: string } | null;
  amount: string;
  method: "CASH" | "BANK_TRANSFER" | "GCASH" | "CHECK";
  refNo: string | null;
  notes: string | null;
}

export interface ExpenseDTO {
  id: string;
  date: string;
  category:
    | "FUEL"
    | "MAINTENANCE"
    | "TOLL"
    | "SALARY"
    | "PERMITS_LICENSES"
    | "OFFICE"
    | "OTHER";
  description: string;
  amount: string;
  driverId: string | null;
  driver: { id: string; name: string } | null;
  tripId: string | null;
  notes: string | null;
}

export interface PayrollDTO {
  id: string;
  payrollNo: string;
  driverId: string | null;
  driver: { id: string; name: string } | null;
  helperId: string | null;
  helper: { id: string; name: string } | null;
  periodStart: string;
  periodEnd: string;
  totalTrips: number;
  totalEarnings: string;
  advanceDeduction: string;
  netPay: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  accountsReceivable: number;
  paymentsReceived: number;
  totalTrips: number;
  activeDrivers: number;
  monthly: { label: string; revenue: number; expenses: number }[];
  expenseBreakdown: { name: string; value: number }[];
  topCreditors: { id: string; name: string; billed: number; paid: number; outstanding: number }[];
  recentTrips: {
    id: string;
    tripCode: string;
    date: string;
    driver: string;
    customer: string;
    route: string;
    amount: number;
    status: string;
  }[];
}
