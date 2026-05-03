import type { EntityFee } from "./api";
import type { AppliedDiscount } from "./discounts";

export interface AppliedFee {
  idorderfee: null;
  identityfee: number;
  name: string;
  description: string;
  amount: number;
}

function isAppliedFee(
  fee: EntityFee,
  total: number,
  paymentType: string | null,
  serviceCode: string,
  identitySchedule: number | null,
): boolean {
  if (fee.amountmin != null && fee.amountmin > 0) {
    if (total <= fee.amountmin) return false;
  }

  if (fee.conditionspayments && fee.conditionspayments !== "ALL") {
    const allowed = fee.conditionspayments.split(";");
    if (!paymentType || !allowed.includes(paymentType)) return false;
  }

  if (fee.conditionstypeorder && fee.conditionstypeorder !== "ALL") {
    const allowed = fee.conditionstypeorder.split(";");
    if (!allowed.includes(serviceCode)) return false;
  }

  if (fee.conditionstime && fee.conditionstime !== "ALL") {
    const allowed = fee.conditionstime.split(";");
    if (identitySchedule == null || !allowed.includes(String(identitySchedule))) return false;
  }

  return true;
}

/**
 * Calculate applicable fees.
 *
 * Fees are calculated on (subtotal + shippingcost - discounts).
 */
export function getApplicableFees(
  fees: EntityFee[],
  subtotal: number,
  shippingcost: number,
  discounts: AppliedDiscount[],
  serviceCode: string,
  paymentType: string | null,
  identitySchedule: number | null,
): AppliedFee[] {
  let total = subtotal + shippingcost;
  for (const d of discounts) {
    total -= d.amount;
  }

  const result: AppliedFee[] = [];

  for (const fee of fees) {
    if (!isAppliedFee(fee, total, paymentType, serviceCode, identitySchedule)) continue;

    let amount = 0;
    if (fee.calculationtype === "percentage") {
      amount = total * fee.feevalue / 100;
    } else if (fee.calculationtype === "fixed") {
      amount = fee.feevalue;
    }

    result.push({
      idorderfee: null,
      identityfee: fee.identityfee,
      name: fee.name,
      description: fee.description,
      amount,
    });
  }

  return result;
}

export function totalFees(fees: AppliedFee[]): number {
  return fees.reduce((sum, f) => sum + f.amount, 0);
}
