"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ButtonBase from "@mui/material/ButtonBase";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { buildImageProductThumbnail, getEntitySchedulesWeek, getEntityScheduleStatus, type Section, type Product, type GroupEntity, type ScheduleWeekItem, type ScheduleData } from "@/lib/api";
import ProductDetail, { type CartItem } from "@/components/ProductDetail";
import ServiceTypeTabs from "@/components/ServiceTypeTabs";
import NotificationsBanner from "@/components/NotificationsBanner";
import { useCart } from "@/lib/CartContext";

interface MenuViewProps {
  sections: Section[];
  basepathimage: string;
  entity: GroupEntity;
}

export default function MenuView({ sections, basepathimage, entity }: MenuViewProps) {
  const availableServices = entity.attributesbuilder.typeofserviceorder.filter((s) => s.active);

  const [activeSection, setActiveSection] = useState(sections[0]?.idproductsection ?? 0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const { addOrderDetail, serviceType } = useCart();

  const scrollToSection = useCallback((id: number) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAddToCart = useCallback((item: CartItem) => {
    addOrderDetail(item.product, item.quantity, item.notes, item.orderdetailgroups);
  }, [addOrderDetail]);

  const openProductDetail = useCallback((product: Product) => {
    window.history.pushState({ screen: "product" }, "");
    setSelectedProduct(product);
  }, []);

  const closeProductDetail = useCallback(() => {
    // Replace the "product" history entry instead of going back,
    // so it doesn't trigger popstate handlers up the tree
    setSelectedProduct(null);
    window.history.replaceState(null, "");
  }, []);

  // Close product detail on browser back
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (selectedProduct) {
        e.stopImmediatePropagation();
        setSelectedProduct(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedProduct]);

  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<ScheduleWeekItem[] | null>(null);

  useEffect(() => {
    getEntityScheduleStatus(entity.identity)
      .then(setScheduleData)
      .catch(() => {});
  }, [entity.identity]);

  const isOpen = scheduleData?.status.isopen ?? entity.scheduledata.status.isopen;
  const hasSchedules = scheduleData
    ? Object.values(scheduleData.schedules).some((s) => s.length > 0)
    : false;
  const isOnDemand = scheduleData?.ondemand === true;
  const canOrder = (isOpen || hasSchedules) && !isOnDemand;

  const headerImage = entity.entityimages.find((img) => img.keyname === "header_mobile");
  const logoImage = entity.entityimages.find((img) => img.keyname === "Logo");

  const infoMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const g = (window as any).google;
    if (!g) return;
    const timer = setTimeout(() => {
      if (!infoMapRef.current) return;
      const lat = parseFloat(entity.latitude);
      const lng = parseFloat(entity.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const center = { lat, lng };
      const map = new g.maps.Map(infoMapRef.current, {
        center,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: "none",
        draggable: false,
      });
      new g.maps.Marker({ position: center, map });
    }, 300);
    return () => clearTimeout(timer);
  }, [infoOpen, entity.latitude, entity.longitude]);

  const handleOpenInfo = () => {
    setInfoOpen(true);
    if (!weekSchedule) {
      getEntitySchedulesWeek(entity.identity)
        .then(setWeekSchedule)
        .catch(() => setWeekSchedule([]));
    }
  };

  return (
    <>
      {/* Entity header image */}
      {headerImage && (
        <Box sx={{ position: "relative", height: 140 }}>
          <Box
            component="img"
            src={headerImage.path}
            alt={entity.name}
            sx={{ width: "100%", height: 140, objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.35)",
            }}
          />
        </Box>
      )}

      {/* Entity info card */}
      <Box
        sx={{
          mx: 2,
          mt: headerImage ? -3 : 2,
          mb: 1,
          px: 2,
          pt: 2,
          pb: 1.5,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo + Entity name + info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          {logoImage && (
            <Box
              component="img"
              src={logoImage.path}
              alt={entity.name}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                objectFit: "cover",
                boxShadow: 1,
              }}
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {entity.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {entity.street} {entity.streetnumber}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleOpenInfo} color="primary">
            <InfoOutlinedIcon />
          </IconButton>
        </Box>

        {/* Service type tabs */}
        <ServiceTypeTabs availableServices={availableServices} />

        {/* Delivery info */}
        {serviceType === "DELIVERY" && (() => {
          const zones = entity.entitydeliveryzones?.filter((z) => z.status === "ACTIVE") || [];
          if (zones.length === 0) return null;
          const costs = zones.map((z) => z.shippingcost ?? 0);
          const min = Math.min(...costs);
          const max = Math.max(...costs);
          const allSame = min === max;
          const label = min === 0
            ? (allSame ? "Envío gratis" : "Envío desde gratis")
            : (allSame
              ? `Envío $${min.toLocaleString("es-AR")}`
              : `Envío desde $${min.toLocaleString("es-AR")}`);
          return (
            <Box sx={{ pt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          );
        })()}
      </Box>

      {/* Schedule status banner */}
      {!isOpen && scheduleData && (
        <Alert
          severity={canOrder ? "info" : "error"}
          sx={{ mx: 2, mt: 1, borderRadius: 2 }}
        >
          <Typography component="span" variant="body2" sx={{ fontWeight: 600, display: "block" }}>
            {scheduleData.message || "Local cerrado"}
          </Typography>
          {scheduleData.messagesecondary && (
            <Typography component="span" variant="body2" sx={{ display: "block" }}>
              {scheduleData.messagesecondary}
            </Typography>
          )}
        </Alert>
      )}

      {/* Notifications banner */}
      <NotificationsBanner />

      {/* Discounts banner */}
      {(entity.entitydiscounts?.length ?? 0) > 0 && (
        <Card
          onClick={() => setDiscountsOpen(true)}
          sx={{
            mx: 2,
            mt: 1,
            px: 2,
            py: 1.5,
            bgcolor: "error.main",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            borderRadius: 2,
          }}
          elevation={2}
        >
          <LocalOfferIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
            {entity.entitydiscounts![0].description}
          </Typography>
          {entity.entitydiscounts!.length > 1 && (
            <Typography variant="caption" sx={{ opacity: 0.85, textDecoration: "underline" }}>
              +{entity.entitydiscounts!.length - 1} más
            </Typography>
          )}
        </Card>
      )}

      {/* Discounts modal */}
      <Dialog open={discountsOpen} onClose={() => setDiscountsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ bgcolor: "error.main", color: "error.contrastText", display: "flex", justifyContent: "space-between", alignItems: "center", pr: 1, fontWeight: 700 }}>
          Descuentos
          <IconButton onClick={() => setDiscountsOpen(false)} size="small" sx={{ color: "error.contrastText" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {entity.entitydiscounts?.map((d) => (
            <Card key={d.identitydiscount} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {d.description}
              </Typography>
              {d.markpromoas === "NO_EXCLUSIVE" && (
                <Typography variant="body2" color="text.secondary">
                  Acumulable con otras promociones.
                </Typography>
              )}
              {d.markpromoas === "EXCLUSIVE" && (
                <Typography variant="body2" color="text.secondary">
                  No acumulable con otras promociones.
                </Typography>
              )}
              {d.amountmin != null && d.amountmin > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Monto mínimo: ${d.amountmin.toLocaleString("es-AR")}
                </Typography>
              )}
              {d.enddate && (
                <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5, textAlign: "right" }}>
                  Finaliza: {new Date(d.enddate).toLocaleDateString("es-AR")}
                </Typography>
              )}
            </Card>
          ))}
        </DialogContent>
      </Dialog>

      {/* Category chips */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          px: 2,
          py: 1.5,
          overflowX: "auto",
          position: "sticky",
          top: 64,
          zIndex: 10,
          bgcolor: "background.paper",
        }}
      >
        {sections.map((section) => (
          <Chip
            key={section.idproductsection}
            label={section.description}
            clickable
            variant={activeSection === section.idproductsection ? "filled" : "outlined"}
            color="primary"
            sx={{ flexShrink: 0 }}
            onClick={() => scrollToSection(section.idproductsection)}
          />
        ))}
      </Box>

      {/* Products by section */}
      {sections.map((section) => (
        <Box
          key={section.idproductsection}
          ref={(el: HTMLElement | null) => {
            sectionRefs.current[section.idproductsection] = el;
          }}
          sx={{ mb: 3, scrollMarginTop: "120px" }}
        >
          {section.pathfullimage && (
            <Box
              component="img"
              src={section.pathfullimage}
              alt={section.description}
              sx={{
                width: "100%",
                height: 160,
                objectFit: "cover",
              }}
            />
          )}
          <Typography
            variant="subtitle1"
            sx={{ px: 2, pt: 2, pb: 1, fontWeight: 800, fontSize: "1.1rem" }}
          >
            {section.description}
          </Typography>
          <Divider />
          {section.sectionproducts.map((product) => {
            const imageUrl = product.imageid
              ? buildImageProductThumbnail(basepathimage, product.imageid)
              : null;

            return (
              <Box key={product.idproduct}>
                <ButtonBase
                  disabled={!canOrder}
                  onClick={() => openProductDetail(product)}
                  sx={{
                    display: "flex",
                    width: "100%",
                    textAlign: "left",
                    px: 2,
                    py: 1.5,
                    gap: 2,
                    alignItems: "flex-start",
                    opacity: canOrder ? 1 : 0.5,
                  }}
                >
                  {/* Text content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        mb: 0.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {product.name}
                    </Typography>
                    {product.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.description}
                      </Typography>
                    )}
                    {product.price > 0 && (
                      <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                        $ {product.price.toLocaleString("es-AR")}
                      </Typography>
                    )}
                  </Box>

                  {/* Product image */}
                  {imageUrl && (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={product.name}
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 2,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </ButtonBase>
                <Divider sx={{ mx: 2 }} />
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          basepathimage={basepathimage}
          onClose={closeProductDetail}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Entity info modal */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 1, fontWeight: 700 }}>
          {entity.name}
          <IconButton onClick={() => setInfoOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Address */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {entity.street} {entity.streetnumber}
          </Typography>

          {/* Map */}
          <Box
            ref={infoMapRef}
            sx={{
              width: "100%",
              height: 160,
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
            }}
          />

          {/* Contacts */}
          {entity.entitycontacts?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Contacto
              </Typography>
              {entity.entitycontacts.map((c, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
                  {c.contacttype.name === "TELEPHONE" ? "Tel: " : ""}{c.value}
                </Typography>
              ))}
            </Box>
          )}

          {/* Schedules */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 18 }} /> Horarios de atención
          </Typography>
          {weekSchedule ? (
            weekSchedule.length > 0 ? (
              weekSchedule.map((s, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                  <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {s.name_of_day.toLowerCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.start_time_format} - {s.end_time_format}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                Sin horarios disponibles
              </Typography>
            )
          ) : (
            <Typography variant="caption" color="text.secondary">
              Cargando horarios...
            </Typography>
          )}

          {/* Schedule status message */}
          {entity.scheduledata?.message && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {entity.scheduledata.message}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
