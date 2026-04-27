"use client";

import { useRef, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ButtonBase from "@mui/material/ButtonBase";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { buildImageProductThumbnail, type Section, type Product, type GroupEntity } from "@/lib/api";
import ProductDetail, { type CartItem } from "@/components/ProductDetail";
import ServiceTypeTabs from "@/components/ServiceTypeTabs";
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

  const headerImage = entity.entityimages.find((img) => img.keyname === "Header-mobile");
  const logoImage = entity.entityimages.find((img) => img.keyname === "Logo");

  return (
    <>
      {/* Entity header image */}
      {headerImage && (
        <Box
          component="img"
          src={headerImage.path}
          alt={entity.name}
          sx={{ width: "100%", height: 180, objectFit: "cover" }}
        />
      )}

      {/* Logo + Entity name */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, pt: 2, pb: 1 }}>
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
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {entity.name}
        </Typography>
      </Box>

      {/* Service type tabs */}
      <ServiceTypeTabs availableServices={availableServices} />

      {/* Delivery info */}
      {serviceType === "DELIVERY" && entity.amountmin > 0 && (
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            Envío ${entity.amountmin.toLocaleString("es-AR")}
          </Typography>
        </Box>
      )}

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
                  onClick={() => setSelectedProduct(product)}
                  sx={{
                    display: "flex",
                    width: "100%",
                    textAlign: "left",
                    px: 2,
                    py: 1.5,
                    gap: 2,
                    alignItems: "flex-start",
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
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}
