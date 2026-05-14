"use client";

import { useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import EntityList from "@/components/EntityList";
import FirebaseMessaging from "@/components/FirebaseMessaging";
import NotificationsBanner from "@/components/NotificationsBanner";
import InstallBanner from "@/components/InstallBanner";
import PwaInstallTracker from "@/components/PwaInstallTracker";
import { useCart } from "@/lib/CartContext";
import { getEntitySections } from "@/lib/api";
import type { Tenant } from "@/lib/tenant";
import type { Section, GroupEntity } from "@/lib/api";

interface MultiEntityShellProps {
  tenant: Tenant;
}

export default function MultiEntityShell({ tenant }: MultiEntityShellProps) {
  const [selectedEntity, setSelectedEntity] = useState<GroupEntity | null>(null);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { itemCount, clearCart } = useCart();

  const goBackToList = useCallback(() => {
    clearCart();
    setSelectedEntity(null);
    setSections(null);
  }, [clearCart]);

  const handleSelectEntity = useCallback(async (entity: GroupEntity) => {
    setLoading(true);
    try {
      const secs = await getEntitySections(entity.identity);
      setSelectedEntity(entity);
      setSections(secs);
      window.history.pushState({ screen: "entity" }, "");
    } catch {
      setSelectedEntity(null);
      setSections(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (itemCount > 0) {
      setShowConfirm(true);
    } else {
      setSelectedEntity(null);
      setSections(null);
    }
  }, [itemCount]);

  const handleConfirmBack = useCallback(() => {
    setShowConfirm(false);
    goBackToList();
  }, [goBackToList]);

  const handleCancelBack = useCallback(() => {
    setShowConfirm(false);
  }, []);

  // Listen for browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (selectedEntity) {
        if (itemCount > 0) {
          setShowConfirm(true);
          // Re-push so the user stays on the entity screen while the dialog is open
          window.history.pushState({ screen: "entity" }, "");
        } else {
          setSelectedEntity(null);
          setSections(null);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedEntity, itemCount]);

  if (selectedEntity && sections) {
    return (
      <>
        <AppShell
          tenant={tenant}
          sections={sections}
          entity={selectedEntity}
          onBack={handleBack}
        />
        <Dialog open={showConfirm} onClose={handleCancelBack}>
          <DialogTitle>Cambiar de sucursal</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tenés productos en el carrito. Si volvés a la lista de sucursales se va a vaciar el carrito.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelBack}>Cancelar</Button>
            <Button onClick={handleConfirmBack} color="error">Vaciar y volver</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <FirebaseMessaging
      topics={[tenant.group.firebasetopic].filter(Boolean)}
      idgroup={tenant.group.idgroup}
      tenantIcon={tenant.group.groupimages.find((img) => img.keyname === "icon_192_x_192_pwa")?.path}
    >
      <AppHeader tenant={tenant} />
      <Box component="main" sx={{ flex: 1, pb: 8 }}>
        <NotificationsBanner />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <EntityList entities={tenant.group.entities} groupImages={tenant.group.groupimages} onSelect={handleSelectEntity} />
        )}
      </Box>
      <InstallBanner slug={tenant.slug} />
      <PwaInstallTracker slug={tenant.slug} />
    </FirebaseMessaging>
  );
}
