"use client";

import { useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import AppHeader from "@/components/AppHeader";
import BottomNav, { type TabValue } from "@/components/BottomNav";
import MenuView from "@/components/MenuView";
import CartView from "@/components/CartView";
import CheckoutView from "@/components/CheckoutView";
import PedidosView from "@/components/PedidosView";
import ProfileView from "@/components/ProfileView";
import FloatingCartBar from "@/components/FloatingCartBar";
import FirebaseMessaging from "@/components/FirebaseMessaging";
import PwaInstallTracker from "@/components/PwaInstallTracker";
import { useAuth } from "@/lib/AuthContext";
import type { Tenant } from "@/lib/tenant";
import type { Section, GroupEntity } from "@/lib/api";

interface AppShellProps {
  tenant: Tenant;
  sections: Section[];
  entity: GroupEntity;
}

export default function AppShell({ tenant, sections, entity }: AppShellProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>("menu");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Push browser history state when navigating to sub-screens
  const pushHistory = useCallback((screen: string) => {
    window.history.pushState({ screen }, "");
  }, []);

  const handleCartClick = useCallback(() => {
    pushHistory("cart");
    setShowCart(true);
  }, [pushHistory]);

  const handleCartBack = useCallback(() => {
    setShowCart(false);
  }, []);

  const handleRequireLogin = useCallback(() => {
    setShowCart(false);
    setPendingCheckout(true);
    setActiveTab("perfil");
  }, []);

  const handleCheckout = useCallback(() => {
    pushHistory("checkout");
    setShowCart(false);
    setShowCheckout(true);
  }, [pushHistory]);

  const handleCheckoutBack = useCallback(() => {
    setShowCheckout(false);
  }, []);

  const handleGoToPedidos = useCallback(() => {
    setShowCheckout(false);
    setActiveTab("pedidos");
  }, []);

  const handleTabChange = useCallback((tab: TabValue) => {
    if (tab !== "menu") {
      pushHistory(tab);
    }
    setActiveTab(tab);
  }, [pushHistory]);

  // After login, redirect to checkout if pending
  useEffect(() => {
    if (isAuthenticated && pendingCheckout) {
      setPendingCheckout(false);
      pushHistory("checkout");
      setShowCheckout(true);
      setActiveTab("menu");
    }
  }, [isAuthenticated, pendingCheckout, pushHistory]);

  // Listen for browser back button (Android back)
  useEffect(() => {
    const handlePopState = () => {
      if (showCheckout) {
        setShowCheckout(false);
      } else if (showCart) {
        setShowCart(false);
      } else if (activeTab !== "menu") {
        setActiveTab("menu");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showCheckout, showCart, activeTab]);

  return (
    <>
      <AppHeader tenant={tenant} onCartClick={handleCartClick} />
      <Box component="main" sx={{ flex: 1, pb: 8 }}>
        {showCheckout ? (
          <CheckoutView entity={entity} idgroup={tenant.group.idgroup} onBack={handleCheckoutBack} onGoToPedidos={handleGoToPedidos} />
        ) : showCart ? (
          <CartView
            entityId={entity.identity}
            availableServices={entity.attributesbuilder.typeofserviceorder.filter((s) => s.active)}
            entityDiscounts={entity.entitydiscounts || []}
            onBack={handleCartBack}
            onRequireLogin={handleRequireLogin}
            onCheckout={handleCheckout}
          />
        ) : (
          <>
            {activeTab === "menu" && (
              <MenuView sections={sections} basepathimage={entity.basepathimage} entity={entity} />
            )}
            {activeTab === "pedidos" && (
              <PedidosView idgroup={tenant.group.idgroup} />
            )}
            {activeTab === "perfil" && (
              <ProfileView idgroup={tenant.group.idgroup} />
            )}
          </>
        )}
      </Box>
      {!showCheckout && !showCart && activeTab === "menu" && (
        <FloatingCartBar onClick={handleCartClick} />
      )}
      {!showCheckout && !showCart && <BottomNav value={activeTab} onChange={handleTabChange} />}
      <FirebaseMessaging topics={[tenant.group.firebasetopic, entity.firebasetopic].filter(Boolean)} />
      <PwaInstallTracker slug={tenant.slug} />
    </>
  );
}
