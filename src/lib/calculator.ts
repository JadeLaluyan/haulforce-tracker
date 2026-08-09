export interface CalculatorInput {
  distanceKm: number;
  weightKg: number;
  fuelCost: number;
  tollFee: number;
  mealAllowance: number;
  otherExpenses: number;
  marginPercent: number;
}

export interface PricingBreakdown {
  baseRate: number;
  fuelCost: number;
  tollFee: number;
  mealAllowance: number;
  otherExpenses: number;
  totalExpenses: number;
  suggestedPrice: number;
  estimatedProfit: number;
}

// Base haulage rate model: per-km rate plus weight surcharge per ton beyond 5 tons.
const RATE_PER_KM = 55; // ₱ per km
const WEIGHT_SURCHARGE_PER_TON = 250; // ₱ per ton above threshold
const WEIGHT_THRESHOLD_TONS = 5;

export function calculatePricing(input: CalculatorInput): PricingBreakdown {
  const tons = input.weightKg / 1000;
  const surcharge =
    tons > WEIGHT_THRESHOLD_TONS
      ? (tons - WEIGHT_THRESHOLD_TONS) * WEIGHT_SURCHARGE_PER_TON
      : 0;
  const baseRate = input.distanceKm * RATE_PER_KM + surcharge;
  const totalExpenses =
    input.fuelCost + input.tollFee + input.mealAllowance + input.otherExpenses;
  const suggestedPrice =
    (baseRate + totalExpenses) * (1 + input.marginPercent / 100);
  const estimatedProfit = suggestedPrice - totalExpenses;
  return {
    baseRate,
    fuelCost: input.fuelCost,
    tollFee: input.tollFee,
    mealAllowance: input.mealAllowance,
    otherExpenses: input.otherExpenses,
    totalExpenses,
    suggestedPrice,
    estimatedProfit,
  };
}
