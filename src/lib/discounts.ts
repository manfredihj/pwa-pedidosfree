import type { EntityDiscount } from "./api";
import type { CartDetailItem } from "./CartContext";

export interface AppliedDiscount {
  idorderdiscount: null;
  identitydiscount: number;
  iduserdiscountcoupon: null;
  description: string;
  amount: number;
}

/**
 * Check if a discount applies given the current cart context.
 */
function isAppliedDiscount(
  discount: EntityDiscount,
  subtotal: number,
  paymentType: string | null,
  serviceCode: string,
  identitySchedule: number | null,
  items: CartDetailItem[],
): boolean {
  // Minimum amount condition
  if (discount.amountmin != null && discount.amountmin > 0) {
    if (subtotal <= discount.amountmin) return false;
  }

  // Payment type condition
  if (discount.conditionspayments && discount.conditionspayments !== "ALL") {
    const allowed = discount.conditionspayments.split(";");
    if (!paymentType || !allowed.includes(paymentType)) return false;
  }

  // Service type condition (DELIVERY / TAKE-AWAY)
  if (discount.conditionstypeorder && discount.conditionstypeorder !== "ALL") {
    const allowed = discount.conditionstypeorder.split(";");
    if (!allowed.includes(serviceCode)) return false;
  }

  // Schedule condition
  if (discount.conditionstime && discount.conditionstime !== "ALL") {
    const allowed = discount.conditionstime.split(";");
    if (identitySchedule == null || !allowed.includes(String(identitySchedule))) return false;
  }

  // Item-specific condition
  if (discount.conditionsitems && discount.conditionsitems !== "ALL") {
    const totalDiscount = calculateDiscountForItems(discount, items);
    if (totalDiscount <= 0) return false;
  }

  return true;
}

/**
 * Calculate discount amount for PERC_ITEM type (percentage on specific products).
 */
function calculateDiscountForItems(discount: EntityDiscount, items: CartDetailItem[]): number {
  if (!discount.conditionsitems) return 0;

  const appliedIds = discount.conditionsitems.split(";");
  let total = 0;

  for (const item of items) {
    if (appliedIds.includes(String(item.idproduct))) {
      let optionsTotal = 0;
      for (const group of item.orderdetailgroups) {
        for (const opt of group.orderdetailproductoptions) {
          if (opt.price !== 0 && !opt.modifiedtotal) {
            optionsTotal += opt.price * opt.quantity;
          }
        }
      }
      const itemTotal = (item.price + optionsTotal) * item.quantity;
      total += itemTotal * discount.percentage / 100;
    }
  }

  return total;
}

/**
 * Build applied discount entry.
 */
function buildDiscount(
  discount: EntityDiscount,
  subtotal: number,
  items: CartDetailItem[],
): AppliedDiscount {
  let amount = 0;

  switch (discount.discounttype.code) {
    case "PERC_CART":
      amount = subtotal * discount.percentage / 100;
      break;
    case "PERMANENT_CART":
      amount = discount.percentage; // fixed amount stored in percentage field
      break;
    case "PERC_ITEM":
      amount = calculateDiscountForItems(discount, items);
      break;
  }

  return {
    idorderdiscount: null,
    identitydiscount: discount.identitydiscount,
    iduserdiscountcoupon: null,
    description: discount.description,
    amount,
  };
}

/**
 * Calculate all applicable discounts.
 *
 * Logic from Ionic DiscountService:
 * 1. From EXCLUSIVE discounts, pick only the one with the highest amount
 * 2. Add all NO_EXCLUSIVE discounts that apply (they stack)
 */
export function getApplicableDiscounts(
  discounts: EntityDiscount[],
  subtotal: number,
  items: CartDetailItem[],
  serviceCode: string,
  paymentType: string | null,
  identitySchedule: number | null,
): AppliedDiscount[] {
  const result: AppliedDiscount[] = [];

  // 1. Exclusive discounts — pick the biggest one
  const exclusiveDiscounts = discounts.filter((d) => d.markpromoas === "EXCLUSIVE");
  const appliedExclusive: AppliedDiscount[] = [];

  for (const discount of exclusiveDiscounts) {
    if (isAppliedDiscount(discount, subtotal, paymentType, serviceCode, identitySchedule, items)) {
      appliedExclusive.push(buildDiscount(discount, subtotal, items));
    }
  }

  if (appliedExclusive.length > 0) {
    // Pick the one with highest amount
    let best = appliedExclusive[0];
    for (const d of appliedExclusive) {
      if (d.amount > best.amount) best = d;
    }
    result.push(best);
  }

  // 2. Non-exclusive discounts — all that apply
  const noExclusiveDiscounts = discounts.filter((d) => d.markpromoas === "NO_EXCLUSIVE");

  for (const discount of noExclusiveDiscounts) {
    if (isAppliedDiscount(discount, subtotal, paymentType, serviceCode, identitySchedule, items)) {
      result.push(buildDiscount(discount, subtotal, items));
    }
  }

  return result;
}

/**
 * Sum all discount amounts.
 */
export function totalDiscounts(discounts: AppliedDiscount[]): number {
  return discounts.reduce((sum, d) => sum + d.amount, 0);
}
