"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import axios from "axios";
import {
  buildImageProduct,
  type Product,
  type ProductOptionGroup,
  type ProductOptionGroupWrapper,
  type ApiResponse,
} from "@/lib/api";
import {
  calculateTotal,
  type OrderDetailGroup,
  type OrderDetailProductOption,
} from "@/lib/cart";

interface ProductDetailProps {
  product: Product;
  basepathimage: string;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
  orderdetailgroups: OrderDetailGroup[];
  totaldetail: number;
}

export default function ProductDetail({
  product,
  basepathimage,
  onClose,
  onAddToCart,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [groups, setGroups] = useState<ProductOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsdetail, setGroupsdetail] = useState<OrderDetailGroup[]>([]);
  const [selections, setSelections] = useState<Record<number, string | string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Set<number>>(new Set());
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("Debe completar la selección");
  // select type: track quantity per option per group { [groupId]: { [optionId]: qty } }
  const [selectQuantities, setSelectQuantities] = useState<Record<number, Record<number, number>>>({});
  // track which select groups are collapsed
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  // refs for scrolling to groups on validation error
  const groupRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const totaldetail = calculateTotal(product.price, quantity, groupsdetail);

  // Fetch option groups from API
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://staging.pedidosfree.com/api/v4";
    axios
      .get<ApiResponse<ProductOptionGroupWrapper[]>>(
        `${apiUrl}/products/${product.idproduct}/productoptiongroups`
      )
      .then(({ data }) => {
        const parsed = data.data.map((w) => w.productoptiongroup);
        setGroups(parsed);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [product.idproduct]);

  // Handle radio selection
  const handleRadioChange = useCallback(
    (group: ProductOptionGroup, optionId: string) => {
      setSelections((prev) => ({ ...prev, [group.idproductoptiongroup]: optionId }));
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(group.idproductoptiongroup);
        return next;
      });

      const option = group.productoptions.find(
        (o) => o.idproductoptions === Number(optionId)
      );
      if (!option) return;

      const detailOption: OrderDetailProductOption = {
        idproductoption: option.idproductoptions,
        nameoption: option.name,
        price: option.price,
        quantity: option.quantityoption,
        modifiedtotal: option.modifiedtotal,
      };

      setGroupsdetail((prev) => {
        const filtered = prev.filter(
          (g) => g.idproductoptiongroup !== group.idproductoptiongroup
        );
        return [
          ...filtered,
          {
            idproductoptiongroup: group.idproductoptiongroup,
            nameproductoptiongroup: group.name,
            orderdetailproductoptions: [detailOption],
          },
        ];
      });
    },
    []
  );

  // Handle checkbox selection
  const handleCheckboxChange = useCallback(
    (group: ProductOptionGroup, optionId: number, checked: boolean) => {
      setSelections((prev) => {
        const current = (prev[group.idproductoptiongroup] as string[]) || [];
        const idStr = String(optionId);
        const updated = checked
          ? [...current, idStr]
          : current.filter((id) => id !== idStr);
        return { ...prev, [group.idproductoptiongroup]: updated };
      });

      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(group.idproductoptiongroup);
        return next;
      });

      // Rebuild detail for this group
      setSelections((prev) => {
        const currentIds = (prev[group.idproductoptiongroup] as string[]) || [];
        const selectedOptions = group.productoptions.filter((o) =>
          currentIds.includes(String(o.idproductoptions))
        );

        const detailOptions: OrderDetailProductOption[] = selectedOptions.map((o) => ({
          idproductoption: o.idproductoptions,
          nameoption: o.name,
          price: o.price,
          quantity: o.quantityoption,
          modifiedtotal: o.modifiedtotal,
        }));

        setGroupsdetail((prevDetail) => {
          const filtered = prevDetail.filter(
            (g) => g.idproductoptiongroup !== group.idproductoptiongroup
          );
          if (detailOptions.length > 0) {
            return [
              ...filtered,
              {
                idproductoptiongroup: group.idproductoptiongroup,
                nameproductoptiongroup: group.name,
                orderdetailproductoptions: detailOptions,
              },
            ];
          }
          return filtered;
        });

        return prev;
      });
    },
    []
  );

  // Helper: get total selected quantity for a select group
  const getSelectGroupTotal = useCallback(
    (groupId: number) => {
      const groupQtys = selectQuantities[groupId] || {};
      return Object.values(groupQtys).reduce((sum, q) => sum + q, 0);
    },
    [selectQuantities]
  );

  // Helper: sync select quantities to groupsdetail
  const syncSelectGroupDetail = useCallback(
    (group: ProductOptionGroup, newQuantities: Record<number, number>) => {
      const detailOptions: OrderDetailProductOption[] = [];
      for (const option of group.productoptions) {
        const qty = newQuantities[option.idproductoptions] || 0;
        if (qty > 0) {
          detailOptions.push({
            idproductoption: option.idproductoptions,
            nameoption: option.name,
            price: option.price,
            quantity: qty,
            modifiedtotal: option.modifiedtotal,
          });
        }
      }

      setGroupsdetail((prev) => {
        const filtered = prev.filter(
          (g) => g.idproductoptiongroup !== group.idproductoptiongroup
        );
        if (detailOptions.length > 0) {
          return [
            ...filtered,
            {
              idproductoptiongroup: group.idproductoptiongroup,
              nameproductoptiongroup: group.name,
              orderdetailproductoptions: detailOptions,
            },
          ];
        }
        return filtered;
      });

      // Clear validation error if min is met
      const total = Object.values(newQuantities).reduce((s, q) => s + q, 0);
      if (total >= group.minquantity) {
        setValidationErrors((prev) => {
          const next = new Set(prev);
          next.delete(group.idproductoptiongroup);
          return next;
        });
      }
    },
    []
  );

  // Plus quantity for select option
  const handleSelectPlus = useCallback(
    (group: ProductOptionGroup, optionId: number) => {
      setSelectQuantities((prev) => {
        const groupQtys = { ...(prev[group.idproductoptiongroup] || {}) };
        const currentTotal = Object.values(groupQtys).reduce((s, q) => s + q, 0);
        if (currentTotal >= group.quantity) return prev; // max reached
        groupQtys[optionId] = (groupQtys[optionId] || 0) + 1;
        const newState = { ...prev, [group.idproductoptiongroup]: groupQtys };
        syncSelectGroupDetail(group, groupQtys);
        return newState;
      });
    },
    [syncSelectGroupDetail]
  );

  // Minus quantity for select option
  const handleSelectMinus = useCallback(
    (group: ProductOptionGroup, optionId: number) => {
      setSelectQuantities((prev) => {
        const groupQtys = { ...(prev[group.idproductoptiongroup] || {}) };
        if (!groupQtys[optionId] || groupQtys[optionId] <= 0) return prev;
        groupQtys[optionId] = groupQtys[optionId] - 1;
        if (groupQtys[optionId] === 0) delete groupQtys[optionId];
        const newState = { ...prev, [group.idproductoptiongroup]: groupQtys };
        syncSelectGroupDetail(group, groupQtys);
        return newState;
      });
    },
    [syncSelectGroupDetail]
  );

  // Delete option (set to 0)
  const handleSelectDelete = useCallback(
    (group: ProductOptionGroup, optionId: number) => {
      setSelectQuantities((prev) => {
        const groupQtys = { ...(prev[group.idproductoptiongroup] || {}) };
        delete groupQtys[optionId];
        const newState = { ...prev, [group.idproductoptiongroup]: groupQtys };
        syncSelectGroupDetail(group, groupQtys);
        return newState;
      });
    },
    [syncSelectGroupDetail]
  );

  // Toggle collapse for select group
  const toggleGroupCollapse = useCallback((groupId: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const buildOptionDesc = (name: string, price: number) =>
    price > 0 ? `${name} ($${price.toLocaleString("es-AR")})` : name;

  const allGroupsSelected = (): Set<number> => {
    const errors = new Set<number>();
    let errorMessage = "Debe completar la selección";
    for (const group of groups) {
      if (!group.optional) {
        const groupType = group.productoptiongrouptype?.type || "radio";

        if (groupType === "select") {
          const total = getSelectGroupTotal(group.idproductoptiongroup);
          const shouldValidateMax = group.quantity === group.minquantity;

          if (total > group.quantity) {
            const diff = total - group.quantity;
            errorMessage = diff === 1
              ? `Sobra ${diff} unidad. Debe seleccionar ${group.quantity} unidades como máximo.`
              : `Sobran ${diff} unidades. Debe seleccionar ${group.quantity} unidades como máximo.`;
            errors.add(group.idproductoptiongroup);
          } else if (total < group.quantity && shouldValidateMax) {
            const diff = group.quantity - total;
            errorMessage = diff === 1
              ? `Falta seleccionar ${diff} unidad. Debe seleccionar ${group.quantity} unidades en total.`
              : `Faltan seleccionar ${diff} unidades. Debe seleccionar ${group.quantity} en total.`;
            errors.add(group.idproductoptiongroup);
          } else if (total < group.minquantity) {
            const diff = group.minquantity - total;
            errorMessage = diff === 1
              ? `Falta seleccionar ${diff} unidad. Debe seleccionar como mínimo ${group.minquantity} unidades en total.`
              : `Faltan seleccionar ${diff} unidades. Debe seleccionar como mínimo ${group.minquantity} en total.`;
            errors.add(group.idproductoptiongroup);
          }
        } else {
          const sel = selections[group.idproductoptiongroup];
          const hasSelection =
            sel !== undefined &&
            (typeof sel === "string" ? sel !== "" : sel.length > 0);
          if (!hasSelection) {
            errors.add(group.idproductoptiongroup);
          }
        }
      }
    }
    setValidationErrors(errors);
    setToastMessage(errorMessage);
    return errors;
  };

  const handleAddToOrder = () => {
    const errors = allGroupsSelected();
    if (errors.size > 0) {
      setToastOpen(true);
      // Scroll to first group with error
      for (const group of groups) {
        if (errors.has(group.idproductoptiongroup)) {
          const el = groupRefs.current[group.idproductoptiongroup];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          break;
        }
      }
      return;
    }
    onAddToCart({
      product,
      quantity,
      notes,
      orderdetailgroups: groupsdetail,
      totaldetail,
    });
    onClose();
  };

  const imageUrl = product.imageid
    ? buildImageProduct(basepathimage, product.imageid)
    : null;

  return (
    <Dialog open fullScreen>
      {/* Header */}
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            {product.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: "auto", pb: 10 }}>
        {/* Product image */}
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt={product.name}
            sx={{ width: "100%", maxHeight: 300, objectFit: "cover" }}
          />
        )}

        {/* Name + Price */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {product.name}
          </Typography>
          <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 700 }}>
            ${product.price.toLocaleString("es-AR")}
          </Typography>
        </Box>

        {/* Description */}
        {product.description && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {product.description}
            </Typography>
          </Box>
        )}

        {/* Quantity */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Cantidad
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="body1" sx={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
              {quantity}
            </Typography>
            <IconButton
              color="primary"
              size="small"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Notes */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Aclaraciones
            </Typography>
            {notes && (
              <Typography variant="body2" color="text.secondary">
                {notes}
              </Typography>
            )}
          </Box>
          <IconButton color="primary" onClick={() => { setNotesDraft(notes); setNotesDialogOpen(true); }}>
            <AddIcon />
          </IconButton>
        </Box>

        {/* Option groups */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          groups.map((group) => {
            const groupType = group.productoptiongrouptype?.type || "radio";

            return (
              <Box
                key={group.idproductoptiongroup}
                ref={(el: HTMLDivElement | null) => { groupRefs.current[group.idproductoptiongroup] = el; }}
                sx={{
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                {groupType === "select" ? (
                  // ── SELECT type: quantity-based picker ──
                  (() => {
                    const totalSelected = getSelectGroupTotal(group.idproductoptiongroup);
                    const remaining = group.quantity - totalSelected;
                    const isCollapsed = collapsedGroups.has(group.idproductoptiongroup);
                    const groupQtys = selectQuantities[group.idproductoptiongroup] || {};

                    return (
                      <>
                        {/* Header */}
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                          }}
                          onClick={() => toggleGroupCollapse(group.idproductoptiongroup)}
                        >
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {group.name}
                              </Typography>
                              {!group.optional && (() => {
                                const isCompleted = totalSelected >= group.minquantity && totalSelected > 0;
                                return (
                                  <Chip
                                    label={isCompleted ? "Completado" : "Requerido"}
                                    size="small"
                                    sx={{
                                      fontSize: "0.7rem",
                                      height: 24,
                                      bgcolor: isCompleted ? "success.main" : "error.main",
                                      color: "white",
                                      fontWeight: 600,
                                    }}
                                  />
                                );
                              })()}
                            </Box>
                            {totalSelected === 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                Elige {group.quantity} opciones
                              </Typography>
                            ) : remaining > 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                Te {remaining === 1 ? "falta" : "faltan"} {remaining} para completar
                              </Typography>
                            ) : null}
                          </Box>
                          {isCollapsed ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
                        </Box>

                        {/* Options list */}
                        <Collapse in={!isCollapsed}>
                          {group.productoptions
                            .filter((o) => o.active)
                            .map((option) => {
                              const qty = groupQtys[option.idproductoptions] || 0;
                              return (
                                <Box
                                  key={option.idproductoptions}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    borderTop: 1,
                                    borderColor: "divider",
                                  }}
                                >
                                  <Typography variant="body2" sx={{ flex: 1 }}>
                                    {buildOptionDesc(option.name, option.price)}
                                  </Typography>

                                  {qty > 0 ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleSelectDelete(group, option.idproductoptions)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleSelectMinus(group, option.idproductoptions)}
                                      >
                                        <RemoveIcon fontSize="small" />
                                      </IconButton>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          minWidth: 24,
                                          textAlign: "center",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {qty}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleSelectPlus(group, option.idproductoptions)}
                                        disabled={totalSelected >= group.quantity}
                                      >
                                        <AddIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleSelectPlus(group, option.idproductoptions)}
                                      disabled={totalSelected >= group.quantity}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              );
                            })}
                        </Collapse>
                      </>
                    );
                  })()
                ) : (
                  // ── RADIO / CHECKBOX types ──
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <FormControl component="fieldset" fullWidth>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {group.name}
                        </Typography>
                        {!group.optional && (() => {
                          const sel = selections[group.idproductoptiongroup];
                          const isCompleted = sel !== undefined &&
                            (typeof sel === "string" ? sel !== "" : sel.length > 0);
                          return (
                            <Chip
                              label={isCompleted ? "Completado" : "Requerido"}
                              size="small"
                              sx={{
                                fontSize: "0.7rem",
                                height: 24,
                                bgcolor: isCompleted ? "success.main" : "error.main",
                                color: "white",
                                fontWeight: 600,
                              }}
                            />
                          );
                        })()}
                      </Box>

                      {groupType === "radio" && (
                        <RadioGroup
                          value={(selections[group.idproductoptiongroup] as string) || ""}
                          onChange={(e) => handleRadioChange(group, e.target.value)}
                        >
                          {group.productoptions
                            .filter((o) => o.active)
                            .map((option) => (
                              <FormControlLabel
                                key={option.idproductoptions}
                                value={String(option.idproductoptions)}
                                control={<Radio size="small" />}
                                label={buildOptionDesc(option.name, option.price)}
                              />
                            ))}
                        </RadioGroup>
                      )}

                      {groupType === "checkbox" && (
                        <FormGroup>
                          {group.productoptions
                            .filter((o) => o.active)
                            .map((option) => {
                              const currentSel =
                                (selections[group.idproductoptiongroup] as string[]) || [];
                              return (
                                <FormControlLabel
                                  key={option.idproductoptions}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={currentSel.includes(String(option.idproductoptions))}
                                      onChange={(e) =>
                                        handleCheckboxChange(group, option.idproductoptions, e.target.checked)
                                      }
                                    />
                                  }
                                  label={buildOptionDesc(option.name, option.price)}
                                />
                              );
                            })}
                        </FormGroup>
                      )}
                    </FormControl>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Footer: Add to order button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          zIndex: 1200,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          startIcon={<AddShoppingCartIcon />}
          onClick={handleAddToOrder}
          sx={{ borderRadius: 6, fontWeight: 700, py: 1.5 }}
        >
          Agregar al pedido ${totaldetail.toLocaleString("es-AR")}
        </Button>
      </Box>

      {/* Notes dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Aclaraciones</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              setNotes(notesDraft);
              setNotesDialogOpen(false);
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setToastOpen(false)}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
