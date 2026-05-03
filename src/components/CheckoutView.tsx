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
import QrCodeIcon from "@mui/icons-material/QrCode2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddressSelect from "@/components/AddressSelect";
import PaymentCardForm, { type PaymentCardResult } from "@/components/PaymentCardForm";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { getApplicableDiscounts, totalDiscounts, type AppliedDiscount } from "@/lib/discounts";
import { getApplicableFees, totalFees, type AppliedFee } from "@/lib/fees";
import { getEntityScheduleStatus, createOrder, type UserAddress, type GroupEntity, type ScheduleData, type ScheduleItem } from "@/lib/api";

interface CheckoutViewProps {
  entity: GroupEntity;
  idgroup: number;
  onBack: () => void;
}

type CheckoutStep = "address" | "summary" | "card";

function getPaymentIcon(name: string) {
  const n = name.toUpperCase();
  if (n.includes("EFECTIVO") || n.includes("CASH")) return <PaymentsIcon sx={{ fontSize: 32, color: "white" }} />;
  if (n.includes("DÉBITO") || n.includes("DEBITO") || n.includes("CRÉDITO") || n.includes("CREDITO") || n.includes("TARJETA") || n.includes("CARD")) return <CreditCardIcon sx={{ fontSize: 32, color: "white" }} />;
  if (n.includes("MERCADO") || n.includes("WALLET") || n.includes("BILLETERA")) return <AccountBalanceWalletIcon sx={{ fontSize: 32, color: "white" }} />;
  if (n.includes("QR") || n.includes("TRANSFER")) return <QrCodeIcon sx={{ fontSize: 32, color: "white" }} />;
  return <PaymentsIcon sx={{ fontSize: 32, color: "white" }} />;
}

function getPaymentColor(name: string, index: number): string {
  const n = name.toUpperCase();
  if (n.includes("EFECTIVO") || n.includes("CASH")) return "#2e7d32";
  if (n.includes("DÉBITO") || n.includes("DEBITO")) return "#1565c0";
  if (n.includes("CRÉDITO") || n.includes("CREDITO")) return "#283593";
  if (n.includes("MERCADO")) return "#009ee3";
  if (n.includes("QR") || n.includes("TRANSFER")) return "#6a1b9a";
  const colors = ["#37474f", "#455a64", "#546e7a", "#607d8b"];
  return colors[index % colors.length];
}

export default function CheckoutView({ entity, idgroup, onBack }: CheckoutViewProps) {
  const { items, total, serviceType, clearCart } = useCart();
  const { user, getValidToken } = useAuth();
  const isDelivery = serviceType === "DELIVERY";

  // Steps
  const [step, setStep] = useState<CheckoutStep>(isDelivery ? "address" : "summary");

  // Address & delivery zone
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [shippingCost, setShippingCost] = useState(0);

  // Phone (take-away)
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  // Payment type
  const activePaymentTypes = entity.attributesbuilder.typeofpayment.filter((p) => p.active);
  const [paymentType, setPaymentType] = useState(activePaymentTypes[0]?.name || "");

  // Card payment (MercadoPago)
  const [cardInfo, setCardInfo] = useState<PaymentCardResult | null>(null);

  // Notes
  const [notes, setNotes] = useState("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  // Schedule
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  // Sending state
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Calculate discounts
  const subtotal = total;
  const appliedDiscounts: AppliedDiscount[] = items.length > 0
    ? getApplicableDiscounts(entity.entitydiscounts || [], subtotal, items, serviceType, paymentType, selectedScheduleId)
    : [];
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
    setPhone(address.phone || user?.phone || "");
    setStep("summary");
  }, [user?.phone]);

  const handleConfirmOrder = useCallback(async () => {
    if (!user) return;
    setError(null);
    setSending(true);

    try {
      const token = await getValidToken();
      if (!token) {
        setError("Tu sesión expiró. Por favor volvé a iniciar sesión.");
        setSending(false);
        return;
      }

      await createOrder(
        {
          identity: entity.identity,
          iduser: user.id,
          deliverytype: serviceType,
          paymenttype: paymentType,
          identityschedule: selectedScheduleId || 0,
          note: notes,
          shippingcost: deliveryCost,
          iduseraddress: isDelivery ? selectedAddress?.iduseraddress : undefined,
          phone: !isDelivery ? phone : undefined,
          orderdetails: items.map((item) => ({
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
          })),
          orderdiscounts: appliedDiscounts.map((d) => ({
            identitydiscount: d.identitydiscount,
            iduserdiscountcoupon: d.iduserdiscountcoupon,
            description: d.description,
            amount: d.amount,
          })),
          orderfees: appliedFees.map((f) => ({
            identityfee: f.identityfee,
            name: f.name,
            description: f.description,
            amount: f.amount,
          })),
          couponcode: couponCode || undefined,
        },
        token,
      );

      clearCart();
      onBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar el pedido";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [user, getValidToken, entity.identity, serviceType, paymentType, selectedScheduleId, notes, deliveryCost, isDelivery, selectedAddress, phone, items, appliedDiscounts, appliedFees, couponCode, clearCart, onBack]);

  // Check if selected payment requires card
  // Find MercadoPago card config
  const mpConfig = (entity.entitypaymentconfigs || []).find(
    (c) => c.attributename === "PAYMENT-CREDIT-CARD-MP"
  );
  const mpPublicKey = mpConfig?.publickey;

  const isCardPayment = paymentType === "PAYMENT-CREDIT-CARD-MP";

  const handlePaymentTypeSelect = useCallback((name: string) => {
    setPaymentType(name);
    if (name === "PAYMENT-CREDIT-CARD-MP" && mpPublicKey && !cardInfo) {
      setStep("card");
    }
  }, [mpPublicKey, cardInfo]);

  const handleCardSuccess = useCallback((result: PaymentCardResult) => {
    setCardInfo(result);
    setStep("summary");
  }, []);

  // Step: select address (delivery only)
  if (step === "address" && isDelivery) {
    return (
      <AddressSelect
        entityDeliveryZones={entity.entitydeliveryzones || []}
        onSelect={(address, zoneId) => {
          const zone = (entity.entitydeliveryzones || []).find(
            (z) => z.identitydeliveryzone === zoneId
          );
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
      <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          ¿Cómo querés pagar?
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            pb: 1,
            mx: -2,
            px: 2,
            scrollSnapType: "x mandatory",
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
                  bgcolor: getPaymentColor(pt.name, idx),
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
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textTransform: "capitalize",
                      fontSize: "0.75rem",
                    }}
                  >
                    {pt.name}
                  </Typography>
                  {isSelected && isCardPayment && cardInfo && (
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", fontSize: "0.65rem" }}>
                      Tarjeta agregada
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Add card button (PedidosYa style) */}
        {isCardPayment && (
          <Box
            onClick={() => mpPublicKey && setStep("card")}
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 3,
              bgcolor: "#e3f2fd",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
            }}
          >
            <CreditCardIcon sx={{ fontSize: 36, color: "error.main" }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {cardInfo ? "Cambiar tarjeta" : "Agregar tarjeta"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Débito o crédito
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "text.secondary" }} />
          </Box>
        )}
      </Box>

      <Divider sx={{ mt: 1 }} />

      {/* ---- COUPON ---- */}
      <Box
        onClick={() => {
          setCouponInput(couponCode);
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
            {couponCode ? `Cupón: ${couponCode}` : "¿Tenés un cupón?"}
          </Typography>
        </Box>
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          {couponCode ? "Cambiar" : "Agregar"}
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
            onChange={(e) => setCouponInput(e.target.value)}
            margin="dense"
            placeholder="Código del cupón"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCouponDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setCouponCode(couponInput);
              setCouponDialogOpen(false);
            }}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
