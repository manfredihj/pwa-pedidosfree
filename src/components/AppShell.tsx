"use client";

import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import AppHeader from "@/components/AppHeader";
import BottomNav, { type TabValue } from "@/components/BottomNav";
import MenuView from "@/components/MenuView";
import CartView from "@/components/CartView";
import CheckoutView from "@/components/CheckoutView";
import PedidosView from "@/components/PedidosView";
import ProfileView from "@/components/ProfileView";
import FloatingCartBar from "@/components/FloatingCartBar";
import type { Tenant } from "@/lib/tenant";
import type { Section, GroupEntity } from "@/lib/api";

interface AppShellProps {
  tenant: Tenant;
  sections: Section[];
  entity: GroupEntity;
}

export default function AppShell({ tenant, sections, entity }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("menu");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const handleCartClick = useCallback(() => {
    setShowCart(true);
  }, []);

  const handleCartBack = useCallback(() => {
    setShowCart(false);
  }, []);

  const handleRequireLogin = useCallback(() => {
    setShowCart(false);
    setActiveTab("perfil");
  }, []);

  const handleCheckout = useCallback(() => {
    setShowCart(false);
    setShowCheckout(true);
  }, []);

  const handleCheckoutBack = useCallback(() => {
    setShowCheckout(false);
  }, []);

  return (
    <>
      <AppHeader tenant={tenant} onCartClick={handleCartClick} />
      <Box component="main" sx={{ flex: 1, pb: 8 }}>
        {showCheckout ? (
          <CheckoutView entityDeliveryZones={entity.entitydeliveryzones || []} onBack={handleCheckoutBack} />
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
      {!showCheckout && !showCart && <BottomNav value={activeTab} onChange={setActiveTab} />}
    </>
  );
}
