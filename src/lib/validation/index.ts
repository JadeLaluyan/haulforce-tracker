import { z } from "zod";

export const tripSchema = z.object({
  date: z.string().min(1, "Date is required"),
  driverId: z.string().min(1, "Driver is required"),
  customerId: z.string().min(1, "Customer is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoType: z.string().min(1, "Cargo type is required"),
  weightKg: z.coerce.number().min(0, "Must be 0 or more"),
  tripRate: z.coerce.number().positive("Trip rate must be greater than 0"),
  fuelCost: z.coerce.number().min(0, "Must be 0 or more"),
  tollFee: z.coerce.number().min(0, "Must be 0 or more"),
  mealAllowance: z.coerce.number().min(0, "Must be 0 or more"),
  otherExpenses: z.coerce.number().min(0, "Must be 0 or more"),
  driverFee: z.coerce.number().min(0, "Must be 0 or more"),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "IN_TRANSIT", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
  paymentTerms: z.string().default("COD"),
});

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNo: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().default(true),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  tin: z.string().optional(),
  terms: z.string().default("COD"),
});

export const paymentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  customerId: z.string().min(1, "Customer is required"),
  tripId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK_TRANSFER", "GCASH", "CHECK"]).default("CASH"),
  refNo: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.enum([
    "FUEL",
    "MAINTENANCE",
    "TOLL",
    "SALARY",
    "PERMITS_LICENSES",
    "OFFICE",
    "OTHER",
  ]),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  driverId: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const cashAdvanceSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().optional(),
});

export const payrollGenerateSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
});

export type TripInput = z.infer<typeof tripSchema>;
export type DriverInput = z.infer<typeof driverSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CashAdvanceInput = z.infer<typeof cashAdvanceSchema>;
export type PayrollGenerateInput = z.infer<typeof payrollGenerateSchema>;
