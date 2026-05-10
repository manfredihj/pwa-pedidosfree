"use client";

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import PaymentsIcon from "@mui/icons-material/Payments";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import AddressSelect from "@/components/AddressSelect";
import PaymentCardForm, { type PaymentCardResult } from "@/components/PaymentCardForm";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { getApplicableDiscounts, totalDiscounts, type AppliedDiscount } from "@/lib/discounts";
import { getApplicableFees, totalFees, type AppliedFee } from "@/lib/fees";
import { getEntityScheduleStatus, createOrder, paymentOrder, getPaymentCards, removePaymentCard, validateCoupon, type UserAddress, type GroupEntity, type ScheduleData, type ScheduleItem, type SavedCard, type Order } from "@/lib/api";

interface CheckoutViewProps {
  entity: GroupEntity;
  idgroup: number;
  onBack: () => void;
  onGoToPedidos: () => void;
}

type CheckoutStep = "address" | "summary" | "card";

const PAYMENT_CONFIG: Record<string, { label: string; icon: typeof PaymentsIcon; color: string }> = {
  "PAYMENT-CASH": { label: "Efectivo", icon: PaymentsIcon, color: "#2e7d32" },
  "PAYMENT-CREDIT-CARD-MP": { label: "Pago con tarjeta", icon: CreditCardIcon, color: "#283593" },
  "payment_transfer_bank": { label: "Transferencia", icon: AccountBalanceIcon, color: "#6a1b9a" },
  "payment_mercado_pago_app": { label: "MercadoPago", icon: AccountBalanceWalletIcon, color: "#009ee3" },
};

function getPaymentLabel(name: string): string {
  return PAYMENT_CONFIG[name]?.label ?? name;
}

function getPaymentIcon(name: string) {
  const Icon = PAYMENT_CONFIG[name]?.icon ?? PaymentsIcon;
  return <Icon sx={{ fontSize: 32, color: "white" }} />;
}

function getPaymentColor(name: string): string {
  return PAYMENT_CONFIG[name]?.color ?? "#37474f";
}

export default function CheckoutView({ entity, idgroup, onBack, onGoToPedidos }: CheckoutViewProps) {
  const { items, total, serviceType, clearCart } = useCart();
  const { user, getValidToken } = useAuth();
  const isDelivery = serviceType === "DELIVERY";

  // Steps
  const [step, setStep] = useState<CheckoutStep>(isDelivery ? "address" : "summary");

  // Address & delivery zone
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryZoneId, setDeliveryZoneId] = useState<number | null>(null);

  // Phone (take-away)
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  // Payment type — exclude online card payments from carousel
  const allActivePaymentTypes = entity.attributesbuilder.typeofpayment.filter((p) => p.active);
  const hasCardPayment = allActivePaymentTypes.some(
    (p) => p.name === "PAYMENT-CREDIT-CARD-MP" && p.subtype === "PAYMENT-ONLINE"
  ) && (entity.entitypaymentconfigs || []).some(
    (c) => c.attributename === "PAYMENT-CREDIT-CARD-MP"
  );
  const activePaymentTypes = allActivePaymentTypes.filter((p) => p.subtype !== "PAYMENT-ONLINE");
  const [paymentType, setPaymentType] = useState(activePaymentTypes[0]?.name || "");

  // Card payment (MercadoPago)
  const [cardInfo, setCardInfo] = useState<PaymentCardResult | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [cvvDialogOpen, setCvvDialogOpen] = useState(false);
  const [cvvInput, setCvvInput] = useState("");
  const [cvvLength, setCvvLength] = useState(3);

  // Notes
  const [notes, setNotes] = useState("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  // Coupon
  const [couponDiscounts, setCouponDiscounts] = useState<AppliedDiscount[]>([]);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Schedule
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Sending state
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderInserted, setOrderInserted] = useState<Order | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load schedules
  useEffect(() => {
    getEntityScheduleStatus(entity.identity)
      .then((data) => {
        setScheduleData(data);
        const schedules: ScheduleItem[] = data.schedules?.[serviceType] || [];
        if (schedules.length > 0) {
          setSelectedScheduleId(schedules[0].identityschedule);
        }
      })
      .catch(() => setScheduleData(null));
  }, [entity.identity, serviceType]);

  // Load saved cards (only if MercadoPago payment type is active)
  useEffect(() => {
    if (!hasCardPayment || !user) return;
    getValidToken().then((token) => {
      if (!token) return;
      getPaymentCards(
        { user, email: user.email, identity: entity.identity },
        token,
      )
        .then((cards) => setSavedCards(cards))
        .catch(() => setSavedCards([]));
    });
  }, [hasCardPayment, user, entity.identity, getValidToken]);

  // Calculate discounts (entity auto-discounts + coupon discounts)
  const subtotal = total;
  const entityDiscounts: AppliedDiscount[] = items.length > 0
    ? getApplicableDiscounts(entity.entitydiscounts || [], subtotal, items, serviceType, paymentType, selectedScheduleId)
    : [];
  const appliedDiscounts = [...entityDiscounts, ...couponDiscounts];
  const discountAmount = totalDiscounts(appliedDiscounts);
  const deliveryCost = isDelivery ? shippingCost : 0;

  // Calculate fees on (subtotal + shipping - discounts)
  const appliedFees: AppliedFee[] = getApplicableFees(
    entity.entityfees || [],
    subtotal,
    deliveryCost,
    appliedDiscounts,
    serviceType,
    paymentType,
    selectedScheduleId,
  );
  const feesTotal = totalFees(appliedFees);

  const grandTotal = subtotal - discountAmount + deliveryCost + feesTotal;

  const handleAddressSelected = useCallback((address: UserAddress, identitydeliveryzone: number | null, zoneCost: number) => {
    setSelectedAddress(address);
    setShippingCost(zoneCost);
    setDeliveryZoneId(identitydeliveryzone);
    setPhone(address.phone || user?.phone || "");
    setStep("summary");
  }, [user?.phone]);

  const isPaymentWithCard = paymentType === "PAYMENT-CREDIT-CARD-MP";

  const processPayment = useCallback(async (order: Order, token: string) => {
    if (!user || !cardInfo) return;
    const res = await paymentOrder(
      {
        identity: entity.identity,
        user,
        order,
        fromapp: "PWA",
        paymenttype: paymentType,
        paymentcardinfo: {
          tokenId: cardInfo.tokenId,
          paymentMethodId: cardInfo.paymentMethodId,
          paymentTypeId: cardInfo.paymentTypeId,
          isNew: cardInfo.isNew,
          customerId: selectedCard?.customer_id ?? null,
        },
        totalamount: grandTotal,
      },
      token,
    );
    if (!res.success) {
      throw new Error(res.message || "Error al procesar el pago.");
    }
  }, [user, cardInfo, entity.identity, paymentType, grandTotal, selectedCard]);

  const handleConfirmOrder = useCallback(async () => {
    if (!user) return;
    setError(null);

    // Validations
    if (!isDelivery && !phone) {
      setError("Debe ingresar un número de contacto.");
      return;
    }
    if (!paymentType) {
      setError("Debe seleccionar forma de pago.");
      return;
    }
    if (isPaymentWithCard && !cardInfo) {
      setError("Debe agregar una tarjeta.");
      return;
    }

    setSending(true);

    try {
      const token = await getValidToken();
      if (!token) {
        setError("Tu sesión expiró. Por favor volvé a iniciar sesión.");
        setSending(false);
        return;
      }

      // If order was already created (retry payment)
      let order = orderInserted;

      if (!order) {
        const detail = items.map((item) => ({
          idorderdetail: null,
          idproduct: item.idproduct,
          nameproduct: item.nameproduct,
          quantity: item.quantity,
          price: item.price,
          totaloption: item.totaloption,
          note: item.note,
          orderdetailgroups: item.orderdetailgroups.map((g) => ({
            idproductoptiongroup: g.idproductoptiongroup,
            nameproductoptiongroup: g.nameproductoptiongroup,
            orderdetailproductoptions: g.orderdetailproductoptions.map((o) => ({
              idproductoption: o.idproductoption,
              nameoption: o.nameoption,
              price: o.price,
              quantity: o.quantity,
            })),
          })),
        }));

        const addressComplete = isDelivery && selectedAddress
          ? `${selectedAddress.street} ${selectedAddress.streetnumber} ${selectedAddress.streetdpto || ""}`.trim()
          : undefined;

        const res = await createOrder(
          {
            identity: entity.identity,
            userid: user.id,
            delivery: isDelivery,
            paymenttype: paymentType,
            paymentamount: 0,
            iduseraddress: isDelivery ? selectedAddress?.iduseraddress : undefined,
            identitydeliveryzone: isDelivery ? (deliveryZoneId ?? undefined) : undefined,
            addresscomplete: addressComplete,
            phone: !isDelivery ? phone : undefined,
            notes,
            deliverydateestimated: "Lo antes posible",
            preorder: false,
            fromapp: "PWA",
            detail: JSON.stringify(detail),
            discounts: JSON.stringify(appliedDiscounts.map((d) => ({
              identitydiscount: d.identitydiscount,
              iduserdiscountcoupon: d.iduserdiscountcoupon,
              description: d.description,
              amount: d.amount,
            }))),
            fees: JSON.stringify(appliedFees.map((f) => ({
              identityfee: f.identityfee,
              name: f.name,
              description: f.description,
              amount: f.amount,
            }))),
          },
          token,
        );

        if (!res.success) {
          throw new Error(res.message || "Error al crear el pedido.");
        }

        order = res.data;
        setOrderInserted(order);
      }

      // If card payment, process payment
      if (isPaymentWithCard) {
        await processPayment(order, token);
      }

      // Success
      clearCart();
      setShowSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Se produjo un error. Por favor reintente.";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [user, getValidToken, entity.identity, serviceType, paymentType, selectedScheduleId, notes, deliveryCost, isDelivery, selectedAddress, phone, items, appliedDiscounts, appliedFees, clearCart, isPaymentWithCard, cardInfo, orderInserted, processPayment]);

  // Find MercadoPago card config
  const mpConfig = (entity.entitypaymentconfigs || []).find(
    (c) => c.attributename === "PAYMENT-CREDIT-CARD-MP"
  );
  const mpPublicKey = mpConfig?.publickey;

  const handlePaymentTypeSelect = useCallback((name: string) => {
    setPaymentType(name);
    if (name === "PAYMENT-CREDIT-CARD-MP" && mpPublicKey && !cardInfo) {
      setStep("card");
    }
  }, [mpPublicKey, cardInfo]);

  const handleCardSuccess = useCallback((result: PaymentCardResult) => {
    setCardInfo(result);
    setSelectedCard(null);
    setPaymentType("PAYMENT-CREDIT-CARD-MP");
    setStep("summary");
  }, []);

  const handleSelectSavedCard = useCallback((card: SavedCard) => {
    setSelectedCard(card);
    if (card.security_code.length === 0) {
      // No CVV needed — tokenize directly
      // For now just set the payment type, tokenization happens on submit
      setPaymentType("PAYMENT-CREDIT-CARD-MP");
      setCardInfo({
        tokenId: card.id,
        paymentMethodId: card.payment_method.id,
        paymentTypeId: card.payment_type_id,
        lastFourDigits: card.last_four_digits,
        paymentMethodName: card.payment_method.name,
        isNew: false,
      });
    } else {
      setCvvLength(card.security_code.length);
      setCvvInput("");
      setCvvDialogOpen(true);
    }
  }, []);

  const handleCvvConfirm = useCallback(() => {
    if (!selectedCard || cvvInput.length !== cvvLength) return;
    setCvvDialogOpen(false);
    setPaymentType("PAYMENT-CREDIT-CARD-MP");
    setCardInfo({
      tokenId: selectedCard.id,
      paymentMethodId: selectedCard.payment_method.id,
      paymentTypeId: selectedCard.payment_type_id,
      lastFourDigits: selectedCard.last_four_digits,
      paymentMethodName: selectedCard.payment_method.name,
      isNew: false,
    });
  }, [selectedCard, cvvInput, cvvLength]);

  const handleRemoveCard = useCallback(async (card: SavedCard) => {
    if (!user) return;
    const token = await getValidToken();
    if (!token) return;
    try {
      await removePaymentCard(
        { customerid: card.customer_id, cardid: card.id, identity: entity.identity, user },
        token,
      );
      setSavedCards((prev) => prev.filter((c) => c.id !== card.id));
      if (selectedCard?.id === card.id) {
        setSelectedCard(null);
        setCardInfo(null);
      }
    } catch { /* ignore */ }
  }, [user, getValidToken, entity.identity, selectedCard]);

  const handleValidateCoupon = useCallback(async () => {
    if (!couponInput.trim() || !user) return;
    setCouponError(null);
    setCouponLoading(true);

    try {
      const token = await getValidToken();
      if (!token) {
        setCouponError("Sesión expirada.");
        setCouponLoading(false);
        return;
      }

      const result = await validateCoupon(user.id, entity.identity, couponInput.toUpperCase(), token);

      if (!result.found) {
        setCouponError(result.message || "Cupón no encontrado.");
        setCouponLoading(false);
        return;
      }

      if (!result.discount) {
        setCouponError("El descuento no aplica para este pedido.");
        setCouponLoading(false);
        return;
      }

      const disc = result.discount;
      let amount = 0;
      if (disc.discounttype.code === "PERC_CART") {
        amount = subtotal * disc.percentage / 100;
      } else if (disc.discounttype.code === "PERMANENT_CART") {
        amount = disc.percentage;
      }

      if (amount <= 0) {
        setCouponError("El descuento no aplica para este tipo de pedido.");
        setCouponLoading(false);
        return;
      }

      setCouponDiscounts((prev) => [
        ...prev,
        {
          idorderdiscount: null,
          identitydiscount: disc.identitydiscount,
          iduserdiscountcoupon: disc.iduserdiscountcoupon ?? null,
          description: disc.description,
          amount,
        },
      ]);
      setCouponDialogOpen(false);
      setCouponInput("");
    } catch {
      setCouponError("Error al validar el cupón. Reintente.");
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput, user, getValidToken, entity.identity, subtotal]);

  const handleRemoveCoupon = useCallback((index: number) => {
    setCouponDiscounts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Step: select address (delivery only)
  if (step === "address" && isDelivery) {
    const zones = entity.entitydeliveryzones || [];
    return (
      <AddressSelect
        entityDeliveryZones={zones}
        onSelect={(address, zoneId) => {
          if (zones.length > 0 && !zoneId) {
            // Should not happen — AddressSelect validates, but guard anyway
            return;
          }
          const zone = zones.find((z) => z.identitydeliveryzone === zoneId);
          handleAddressSelected(address, zoneId, zone?.shippingcost ?? 0);
        }}
        onBack={onBack}
      />
    );
  }

  // Step: add card (MercadoPago)
  if (step === "card" && mpPublicKey) {
    return (
      <PaymentCardForm
        publicKey={mpPublicKey}
        onSuccess={handleCardSuccess}
        onBack={() => setStep("summary")}
      />
    );
  }

  // Step: order success
  if (showSuccess) {
    const transferLink = orderInserted?.orderlinks?.find((l) => l.typelink === "do_transfer");

    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, px: 3, textAlign: "center" }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Pedido realizado
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: transferLink ? 2 : 4 }}>
          Tu pedido ha sido realizado. El mismo será confirmado a la brevedad.
        </Typography>

        {transferLink && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            href={transferLink.linkurl}
            target="_blank"
            rel="noopener"
            sx={{ borderRadius: 6, fontWeight: 700, px: 4, py: 1.5, mb: 2 }}
          >
            Transferir
          </Button>
        )}

        <Button
          variant={transferLink ? "outlined" : "contained"}
          color="secondary"
          size="large"
          onClick={onGoToPedidos}
          sx={{ borderRadius: 6, fontWeight: 700, px: 4, py: 1.5 }}
        >
          Ver mis pedidos
        </Button>
      </Box>
    );
  }

  // Step: order summary / confirmation
  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={() => (isDelivery ? setStep("address") : onBack())} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Finalizar pedido
        </Typography>
      </Box>
      <Divider />

      {/* ---- PAYMENT CARDS CAROUSEL (PedidosYa style) ---- */}
      <Box sx={{ pt: 2.5, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, px: 2 }}>
          ¿Cómo querés pagar?
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            pb: 1,
            px: 2,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {activePaymentTypes.map((pt, idx) => {
            const isSelected = paymentType === pt.name;
            return (
              <Box
                key={pt.name}
                onClick={() => handlePaymentTypeSelect(pt.name)}
                sx={{
                  minWidth: 150,
                  height: 90,
                  borderRadius: 3,
                  bgcolor: getPaymentColor(pt.name),
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative",
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                  border: isSelected ? "2.5px solid" : "2.5px solid transparent",
                  borderColor: isSelected ? "secondary.main" : "transparent",
                  transition: "border-color 0.2s, transform 0.15s",
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                  boxShadow: isSelected ? "0 4px 16px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {/* Check icon */}
                {isSelected && (
                  <CheckCircleIcon
                    sx={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      fontSize: 20,
                      color: "white",
                    }}
                  />
                )}
                {/* Icon */}
                <Box>{getPaymentIcon(pt.name)}</Box>
                {/* Label */}
                <Typography
                  variant="caption"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    fontSize: "0.75rem",
                  }}
                >
                  {getPaymentLabel(pt.name)}
                </Typography>
              </Box>
            );
          })}

          {/* Saved cards */}
          {hasCardPayment && savedCards.map((card) => {
            const isSelected = selectedCard?.id === card.id && paymentType === "PAYMENT-CREDIT-CARD-MP";
            return (
              <Box
                key={card.id}
                onClick={() => handleSelectSavedCard(card)}
                sx={{
                  minWidth: 150,
                  height: 90,
                  borderRadius: 3,
                  bgcolor: "#1a237e",
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative",
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                  border: isSelected ? "2.5px solid" : "2.5px solid transparent",
                  borderColor: isSelected ? "secondary.main" : "transparent",
                  transition: "border-color 0.2s, transform 0.15s",
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                  boxShadow: isSelected ? "0 4px 16px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {/* Selected check */}
                {isSelected && (
                  <CheckCircleIcon sx={{ position: "absolute", top: 6, right: 6, fontSize: 20, color: "white" }} />
                )}
                {/* Remove button */}
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleRemoveCard(card); }}
                  sx={{ position: "absolute", bottom: 4, right: 4, color: "rgba(255,255,255,0.5)", p: 0.3 }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
                {/* Card info */}
                <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.7rem" }}>
                  **** {card.last_four_digits}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6rem", textTransform: "uppercase" }}>
                    {card.payment_method.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6rem" }}>
                    {String(card.expiration_month).padStart(2, "0")}/{String(card.expiration_year).slice(-2)}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {/* New card (not yet saved) */}
          {hasCardPayment && cardInfo?.isNew && (
            <Box
              sx={{
                minWidth: 150,
                height: 90,
                borderRadius: 3,
                bgcolor: "#1a237e",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                flexShrink: 0,
                scrollSnapAlign: "start",
                border: "2.5px solid",
                borderColor: "secondary.main",
                transform: "scale(1.03)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              <CheckCircleIcon sx={{ position: "absolute", top: 6, right: 6, fontSize: 20, color: "white" }} />
              <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.7rem" }}>
                **** {cardInfo.lastFourDigits}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.6rem", textTransform: "uppercase" }}>
                {cardInfo.paymentMethodName}
              </Typography>
            </Box>
          )}

          {/* Add card — inside carousel */}
          {hasCardPayment && (
            <Box
              onClick={() => mpPublicKey && setStep("card")}
              sx={{
                minWidth: 150,
                height: 90,
                borderRadius: 3,
                bgcolor: "#e3f2fd",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                flexShrink: 0,
                scrollSnapAlign: "start",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <CreditCardIcon sx={{ fontSize: 32, color: "error.main" }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", lineHeight: 1.2, display: "block" }}>
                  Agregar tarjeta
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                  Débito o crédito
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ mt: 1 }} />

      {/* ---- COUPON ---- */}
      {/* Applied coupon discounts */}
      {couponDiscounts.map((cd, i) => (
        <Box key={i} sx={{ px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontSize: "1.1rem" }}>🏷️</Typography>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              {cd.description}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="error"
            sx={{ fontWeight: 600, cursor: "pointer" }}
            onClick={() => handleRemoveCoupon(i)}
          >
            Quitar
          </Typography>
        </Box>
      ))}
      {/* Add coupon button */}
      <Box
        onClick={() => {
          if (!paymentType) {
            setError("Por favor, seleccioná la forma de pago primero.");
            return;
          }
          setCouponInput("");
          setCouponError(null);
          setCouponDialogOpen(true);
        }}
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontSize: "1.1rem" }}>🏷️</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ¿Tenés un cupón?
          </Typography>
        </Box>
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          Agregar
        </Typography>
      </Box>

      <Divider />

      {/* ---- DELIVERY INFO ---- */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Datos de entrega
        </Typography>

        {/* Service type */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: "1.2rem", mt: 0.2 }}>{isDelivery ? "🛵" : "🏪"}</Typography>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {isDelivery ? "Delivery" : "Retiro en el local"}
            </Typography>
          </Box>
        </Box>

        {/* Address (delivery) */}
        {isDelivery && selectedAddress && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: "1.2rem", mt: 0.2 }}>📍</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Lo recibís en
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAddress.street} {selectedAddress.streetnumber}
                {selectedAddress.streetdpto ? ` Depto. ${selectedAddress.streetdpto}` : ""}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
              onClick={() => setStep("address")}
            >
              Cambiar
            </Typography>
          </Box>
        )}

        {/* Phone (take-away) */}
        {!isDelivery && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: "1.2rem", mt: 0.2 }}>📞</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Teléfono
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phone || "No agregaste teléfono"}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
              onClick={() => {
                setPhoneInput(phone);
                setPhoneDialogOpen(true);
              }}
            >
              {phone ? "Cambiar" : "Agregar"}
            </Typography>
          </Box>
        )}

        {/* Notes */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
          <Typography sx={{ fontSize: "1.2rem", mt: 0.2 }}>📝</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Instrucciones de entrega
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notes || "No agregaste instrucciones"}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="primary"
            sx={{ fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
            onClick={() => {
              setNotesInput(notes);
              setNotesDialogOpen(true);
            }}
          >
            {notes ? "Cambiar" : "Agregar"}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* ---- PRICE SUMMARY ---- */}
      <Box sx={{ px: 2, py: 2 }}>
        {/* Discounts */}
        {appliedDiscounts.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              🌿 Ahorrás ${discountAmount.toLocaleString("es-AR")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
              ${subtotal.toLocaleString("es-AR")}
            </Typography>
          </Box>
        )}

        {/* Shipping */}
        {isDelivery && shippingCost > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Envío
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ${shippingCost.toLocaleString("es-AR")}
            </Typography>
          </Box>
        )}

        {/* Fees */}
        {appliedFees.map((fee, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">{fee.name}</Typography>
            <Typography variant="body2" color="text.secondary">${fee.amount.toLocaleString("es-AR")}</Typography>
          </Box>
        ))}

        {/* Total */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Total
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ${grandTotal.toLocaleString("es-AR")}
          </Typography>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ---- CONFIRM BUTTON ---- */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          zIndex: 1050,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          disabled={sending}
          startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
          onClick={handleConfirmOrder}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
        >
          {sending ? "Enviando..." : "Pagar"}
        </Button>
      </Box>

      {/* ---- DIALOGS ---- */}

      {/* Phone dialog */}
      <Dialog open={phoneDialogOpen} onClose={() => setPhoneDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Teléfono</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            margin="dense"
            placeholder="Ej: 1155667788"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhoneDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setPhone(phoneInput);
              setPhoneDialogOpen(false);
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Instrucciones de entrega</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            margin="dense"
            placeholder="Ej: sin cebolla, timbre no funciona..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setNotes(notesInput);
              setNotesDialogOpen(false);
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Coupon dialog */}
      <Dialog open={couponDialogOpen} onClose={() => setCouponDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar cupón</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            margin="dense"
            placeholder="Código del cupón"
            slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
          />
          {couponError && (
            <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
              {couponError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCouponDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={couponLoading || !couponInput.trim()}
            onClick={handleValidateCoupon}
            startIcon={couponLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {couponLoading ? "Validando..." : "Aplicar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CVV dialog */}
      <Dialog open={cvvDialogOpen} onClose={() => setCvvDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Código de seguridad</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="password"
            value={cvvInput}
            onChange={(e) => setCvvInput(e.target.value.replace(/\D/g, "").slice(0, cvvLength))}
            margin="dense"
            placeholder={"•".repeat(cvvLength)}
            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: cvvLength } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCvvDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={cvvInput.length !== cvvLength}
            onClick={handleCvvConfirm}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
