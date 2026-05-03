"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

export interface PaymentCardResult {
  tokenId: string;
  paymentMethodId: string;
  paymentTypeId: string;
  isNew: boolean;
}

interface PaymentCardFormProps {
  publicKey: string;
  onSuccess: (result: PaymentCardResult) => void;
  onBack: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MercadoPagoV2 {
  getIdentificationTypes: () => Promise<{ id: string; name: string }[]>;
  getPaymentMethods: (opts: { bin: string }) => Promise<{ results: { id: string; payment_type_id: string; settings: { security_code: { length: number }; card_number: { length: number } }[] }[] }>;
  fields: {
    createCardToken: (data: Record<string, string>) => Promise<{ id: string }>;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function getCurrentYears(): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => String(currentYear + i));
}

function loadMercadoPagoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = window as unknown as Record<string, unknown>;
    if (win.MercadoPago) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar MercadoPago SDK"));
    document.head.appendChild(script);
  });
}

export default function PaymentCardForm({ publicKey, onSuccess, onBack }: PaymentCardFormProps) {
  const mpRef = useRef<MercadoPagoV2 | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  // Form fields
  const [cardNumber, setCardNumber] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");

  // State
  const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [securityCodeLength, setSecurityCodeLength] = useState(3);
  const [cardNumberLength, setCardNumberLength] = useState(16);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = getCurrentYears();

  // Init SDK v2
  useEffect(() => {
    loadMercadoPagoSDK()
      .then(() => {
        const win = window as unknown as Record<string, unknown>;
        const MP = win.MercadoPago as new (key: string, opts?: Record<string, string>) => MercadoPagoV2;
        const mp = new MP(publicKey, { locale: "es-AR" });
        mpRef.current = mp;
        setSdkReady(true);

        // Load doc types
        mp.getIdentificationTypes()
          .then((types) => {
            if (types.length > 0) {
              setDocTypes(types);
              setDocType(types[0].id);
            }
          })
          .catch(() => { /* no doc types for this country */ });
      })
      .catch((err) => setSdkError(err.message));
  }, [publicKey]);

  // Get payment method when 6+ digits entered
  const lastBinRef = useRef("");
  useEffect(() => {
    if (!sdkReady || !mpRef.current || cardNumber.length < 6) return;
    const bin = cardNumber.slice(0, 6);
    if (bin === lastBinRef.current) return;
    lastBinRef.current = bin;

    mpRef.current.getPaymentMethods({ bin })
      .then((res) => {
        if (res.results && res.results.length > 0) {
          const pm = res.results[0];
          setPaymentMethodId(pm.id);
          setPaymentTypeId(pm.payment_type_id);
          setSecurityCodeLength(pm.settings[0].security_code.length);
          setCardNumberLength(pm.settings[0].card_number.length);
        }
      })
      .catch(() => setError("La tarjeta ingresada es inválida."));
  }, [sdkReady, cardNumber]);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!cardNumber || cardNumber.length < 13) {
      setError("Ingresá el número de tarjeta.");
      return;
    }
    if (!expirationMonth) {
      setError("Seleccioná el mes de vencimiento.");
      return;
    }
    if (!expirationYear) {
      setError("Seleccioná el año de vencimiento.");
      return;
    }
    if (!cardholderName) {
      setError("Ingresá el nombre del titular.");
      return;
    }
    if (docTypes.length > 0 && !docNumber) {
      setError("Ingresá el número de documento.");
      return;
    }
    if (securityCodeLength > 0 && securityCode.length !== securityCodeLength) {
      setError(`El código de seguridad debe tener ${securityCodeLength} dígitos.`);
      return;
    }
    if (!mpRef.current || !paymentMethodId) {
      setError("Esperá a que se cargue la información de la tarjeta.");
      return;
    }

    setSubmitting(true);

    try {
      const tokenData: Record<string, string> = {
        cardNumber,
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
      };

      if (docTypes.length > 0) {
        tokenData.identificationType = docType;
        tokenData.identificationNumber = docNumber;
      }

      const result = await mpRef.current.fields.createCardToken(tokenData);

      onSuccess({
        tokenId: result.id,
        paymentMethodId,
        paymentTypeId,
        isNew: true,
      });
    } catch {
      setError("Revisá los datos de la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  }, [cardNumber, expirationMonth, expirationYear, cardholderName, securityCode, docType, docNumber, docTypes, securityCodeLength, paymentMethodId, paymentTypeId, onSuccess]);

  if (sdkError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{sdkError}</Alert>
        <Button onClick={onBack} sx={{ mt: 2 }}>Volver</Button>
      </Box>
    );
  }

  if (!sdkReady) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={onBack} edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Agregar tarjeta
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ px: 2, pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Card number */}
        <TextField
          label="Número de tarjeta"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, cardNumberLength))}
          fullWidth
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: cardNumberLength } }}
          placeholder="1234 5678 9012 3456"
        />

        {/* Expiration */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Mes</InputLabel>
            <Select value={expirationMonth} label="Mes" onChange={(e) => setExpirationMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Año</InputLabel>
            <Select value={expirationYear} label="Año" onChange={(e) => setExpirationYear(e.target.value)}>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Cardholder name */}
        <TextField
          label="Nombre del titular"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          fullWidth
          placeholder="JUAN PEREZ"
          slotProps={{ htmlInput: { style: { textTransform: "uppercase" } } }}
        />

        {/* Doc type + number */}
        {docTypes.length > 0 && (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <FormControl sx={{ minWidth: 100 }} size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={docType} label="Tipo" onChange={(e) => setDocType(e.target.value)}>
                {docTypes.map((dt) => (
                  <MenuItem key={dt.id} value={dt.id}>{dt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Número de documento"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ""))}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
          </Box>
        )}

        {/* Security code */}
        <TextField
          label="Código de seguridad"
          value={securityCode}
          onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, securityCodeLength))}
          fullWidth
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: securityCodeLength } }}
          placeholder="CVV"
        />

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : undefined}
          onClick={handleSubmit}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5, mt: 1 }}
        >
          {submitting ? "Procesando..." : "Agregar tarjeta"}
        </Button>
      </Box>
    </Box>
  );
}
