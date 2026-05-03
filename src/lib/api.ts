import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://staging.pedidosfree.com/api/v4",
  timeout: 10000,
});

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Tenant ---

export interface TenantData {
  idgroup: number;
  slug: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
}

export async function getTenantBySlug(slug: string): Promise<TenantData> {
  const { data } = await api.get<ApiResponse<TenantData>>(`/tenants/${slug}`);
  return data.data;
}

// --- Group ---

export interface EntityDeliveryZone {
  identitydeliveryzone: number;
  description: string;
  polygondrawarray: string; // "lat,lng;lat,lng;..."
  shippingcost: number;
  status: string;
  [key: string]: unknown;
}

export interface EntityDiscount {
  identitydiscount: number;
  description: string;
  percentage: number;
  amountmin: number | null;
  markpromoas: "EXCLUSIVE" | "NO_EXCLUSIVE";
  discounttype: { code: "PERC_CART" | "PERMANENT_CART" | "PERC_ITEM"; [key: string]: unknown };
  conditionspayments: string | null; // "ALL" or "CASH;CARD;..." separated by ;
  conditionstypeorder: string | null; // "ALL" or "DELIVERY;TAKE-AWAY"
  conditionscustomers: string | null;
  conditionsitems: string | null; // "ALL" or product ids separated by ;
  conditionstime: string | null; // "ALL" or schedule ids separated by ;
  [key: string]: unknown;
}

export interface EntityFee {
  identityfee: number;
  name: string;
  description: string;
  feevalue: number;
  calculationtype: "percentage" | "fixed";
  amountmin: number | null;
  conditionspayments: string | null;
  conditionstypeorder: string | null;
  conditionscustomers: string | null;
  conditionstime: string | null;
  [key: string]: unknown;
}

export interface EntityContact {
  value: string;
  contacttype: {
    idcontacttype: number;
    name: string; // "TELEPHONE", "WHATSAPP", "EMAIL", etc.
  };
}

export interface GroupEntity {
  identity: number;
  name: string;
  street: string;
  streetnumber: string;
  latitude: string;
  longitude: string;
  amountmin: number;
  basepathimage: string;
  entityimages: { name: string; path: string; keyname: string }[];
  modemaintenance: boolean;
  maintenancemessage: string;
  entitydeliveryzones: EntityDeliveryZone[];
  entitycontacts: EntityContact[];
  entitydiscounts: EntityDiscount[];
  entityfees: EntityFee[];
  scheduledata: {
    status: { isopentoday: boolean; isopen: boolean; closefinished: boolean };
    message: string;
    messagesecondary: string;
    hour: string;
  };
  attributesbuilder: {
    typeofserviceorder: { name: string; active: boolean }[];
    typeofpayment: { name: string; subtype: string; active: boolean }[];
    configuration: { name: string; active: boolean }[];
  };
  entitypaymentconfigs?: {
    description: string;
    attributename: string;
    attributetypename: string;
    publickey: string;
    applicationfee: number;
    requestdocumentamountmin: number;
    [key: string]: unknown;
  }[];
}

export interface Group {
  idgroup: number;
  name: string;
  description: string;
  multipleentities: boolean;
  entities: GroupEntity[];
  groupimages: { name: string; path: string; keyname: string; category?: string }[];
  firebasetopic: string;
  timezone: string;
}

export async function getGroup(id: number): Promise<Group> {
  const { data } = await api.get<ApiResponse<Group>>(`/groups/${id}`);
  return data.data;
}

// --- Entity ---

export async function getEntity(id: number): Promise<GroupEntity> {
  const { data } = await api.get<ApiResponse<GroupEntity>>(`/entities/${id}`);
  return data.data;
}

// --- Sections (categories + products) ---

export interface ProductOption {
  idproductoptions: number;
  name: string;
  price: number;
  quantityoption: number;
  modifiedtotal: boolean;
  active: boolean;
}

export interface ProductOptionGroupType {
  idproductoptiongrouptype: number;
  type: "radio" | "checkbox" | "select";
  class: string;
  name: string;
}

export interface ProductOptionGroup {
  idproductoptiongroup: number;
  name: string;
  description: string;
  optional: boolean;
  quantity: number;
  minquantity: number;
  productoptions: ProductOption[];
  productoptiongrouptype: ProductOptionGroupType;
}

export interface ProductOptionGroupWrapper {
  productoptiongroup: ProductOptionGroup;
  ordersecuencial: number;
}

export async function getProductOptionGroups(productId: number): Promise<ProductOptionGroupWrapper[]> {
  const { data } = await api.get<ApiResponse<ProductOptionGroupWrapper[]>>(
    `/products/${productId}/productoptiongroups`
  );
  return data.data;
}

export interface Product {
  idproduct: number;
  name: string;
  description: string;
  imageid: string | null;
  price: number;
  ordersecuencial: string;
  active: boolean;
  status: string;
  productoptiongroups: ProductOptionGroup[];
}

export interface Section {
  idproductsection: number;
  description: string;
  pathfullimage: string | null;
  ordersecuencial: number;
  status: string;
  sectionproducts: Product[];
}

export async function getEntitySections(entityId: number): Promise<Section[]> {
  const { data } = await api.get<ApiResponse<Section[]>>(`/entities/${entityId}/sections`);
  return data.data;
}

// --- Auth ---

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  phone?: string;
  [key: string]: unknown;
}

export interface AuthData {
  user: User;
  auth: AuthTokens;
}

export async function authLogin(
  username: string,
  password: string,
  idgroup?: number,
): Promise<ApiResponse<AuthData>> {
  const params = new URLSearchParams({ username, password });
  if (idgroup) params.append("idgroup", String(idgroup));
  const { data } = await api.post<ApiResponse<AuthData>>("/auth/login", params);
  return data;
}

export async function authRegister(
  name: string,
  lastname: string,
  email: string,
  password: string,
  idgroup?: number,
): Promise<ApiResponse<AuthData>> {
  const params = new URLSearchParams({ name, lastname, email, password });
  if (idgroup) params.append("idgroup", String(idgroup));
  const { data } = await api.post<ApiResponse<AuthData>>("/auth/register", params);
  return data;
}

export async function authRefresh(refreshToken: string): Promise<ApiResponse<AuthData>> {
  const params = new URLSearchParams({ refresh_token: refreshToken });
  const { data } = await api.post<ApiResponse<AuthData>>("/auth/refresh", params);
  return data;
}

export async function authRecoveryPassword(
  email: string,
  idgroup?: number,
): Promise<ApiResponse<unknown>> {
  const params = new URLSearchParams({ email });
  if (idgroup) params.append("idgroup", String(idgroup));
  const { data } = await api.post<ApiResponse<unknown>>("/auth/recovery-password", params);
  return data;
}

// --- Orders ---

export interface OrderDetailOption {
  nameoption: string;
  quantity: number;
  price: number;
}

export interface OrderDetailGroup {
  nameproductoptiongroup: string;
  orderdetailproductoptions: OrderDetailOption[];
}

export interface OrderItem {
  idorderdetail: number;
  nameproduct: string;
  quantity: number;
  price: number;
  totaloption: number;
  note: string;
  orderdetailgroups: OrderDetailGroup[];
  [key: string]: unknown;
}

export interface OrderDiscount {
  description: string;
  amount: number;
}

export interface OrderFee {
  name: string;
  amount: number;
}

export interface Order {
  idorder: number;
  register_date_format: string;
  register_time_format: string;
  status_detail: string;
  total: number;
  totalcalculated: number;
  subtotalcalculated: number;
  shippingcost: number;
  delivery_type_description: string;
  delivery_description: string;
  payment_type_string: string;
  client_or_address: string;
  entityname: string;
  note: string;
  reasoncancel: string;
  orderdetails: OrderItem[];
  orderdiscounts: OrderDiscount[];
  orderfees: OrderFee[];
  [key: string]: unknown;
}

export async function getUserOrders(
  iduser: number,
  idgroup: number,
  token: string,
  start = 0,
  limit = 20,
): Promise<Order[]> {
  const params = new URLSearchParams({
    iduser: String(iduser),
    idgroup: String(idgroup),
    start: String(start),
    limit: String(limit),
  });
  const { data } = await api.post<ApiResponse<Order[]>>("/users/orders", params, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
}

export async function getOrderDetails(
  idorder: number,
  token: string,
): Promise<OrderItem[]> {
  const { data } = await api.get<ApiResponse<OrderItem[]>>(`/orders/${idorder}/details`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
}

// --- Schedules ---

export interface ScheduleItem {
  identityschedule: number;
  description: string;
  asap: number;
}

export interface ScheduleData {
  status: { isopentoday: boolean; isopen: boolean; closefinished: boolean };
  schedules: Record<string, ScheduleItem[]>;
  message: string;
  messagesecondary: string;
}

export async function getEntityScheduleStatus(entityId: number): Promise<ScheduleData> {
  const { data } = await api.get<ApiResponse<ScheduleData>>(`/entities/${entityId}/schedulesstatus`);
  return data.data;
}

export interface ScheduleWeekItem {
  end_time_format: string;
  start_time_format: string;
  name_of_day: string;
  identityschedule: number;
  dayofweek: number;
  finishnextday: boolean;
  ordersecuencial: number;
}

export async function getEntitySchedulesWeek(entityId: number): Promise<ScheduleWeekItem[]> {
  const { data } = await api.get<ApiResponse<ScheduleWeekItem[]>>(`/entities/${entityId}/schedulesweek`);
  return data.data;
}

// --- Addresses ---

export interface UserAddress {
  iduseraddress: number;
  street: string;
  streetnumber: string;
  streetdpto: string;
  streetbetween: string;
  phone: string;
  note: string;
  latitude: string;
  longitude: string;
  fullname: string;
  areaname: string;
  placeid: string;
  active: boolean;
}

export async function getUserAddresses(userId: number, token: string): Promise<UserAddress[]> {
  const { data } = await api.get<ApiResponse<UserAddress[]>>(`/users/${userId}/address`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
}

export async function createUserAddress(
  fields: {
    userid: number;
    street: string;
    streetnumber?: string;
    streetdpto?: string;
    streetbetween?: string;
    phone?: string;
    note?: string;
    latitude?: string;
    longitude?: string;
    fullname?: string;
    areaname?: string;
    placeid?: string;
  },
  token: string,
): Promise<ApiResponse<UserAddress>> {
  const params = new URLSearchParams();
  params.append("userid", String(fields.userid));
  params.append("street", fields.street);
  if (fields.streetnumber) params.append("streetnumber", fields.streetnumber);
  if (fields.streetdpto) params.append("streetdpto", fields.streetdpto);
  if (fields.streetbetween) params.append("streetbetween", fields.streetbetween);
  if (fields.phone) params.append("phone", fields.phone);
  if (fields.note) params.append("note", fields.note);
  if (fields.latitude) params.append("latitude", fields.latitude);
  if (fields.longitude) params.append("longitude", fields.longitude);
  if (fields.fullname) params.append("fullname", fields.fullname);
  if (fields.areaname) params.append("areaname", fields.areaname);
  if (fields.placeid) params.append("placeid", fields.placeid);
  const { data } = await api.post<ApiResponse<UserAddress>>("/users/address", params, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function deactivateUserAddress(
  userId: number,
  addressId: number,
  token: string,
): Promise<ApiResponse<unknown>> {
  const { data } = await api.put<ApiResponse<unknown>>(
    `/users/${userId}/address/${addressId}/inactive`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

// --- Create Order ---

export interface CreateOrderPayload {
  identity: number;
  iduser: number;
  deliverytype: string; // "DELIVERY" | "TAKE-AWAY"
  paymenttype: string;
  identityschedule: number;
  note: string;
  shippingcost: number;
  iduseraddress?: number;
  phone?: string;
  orderdetails: {
    idproduct: number;
    nameproduct: string;
    quantity: number;
    price: number;
    totaloption: number;
    note: string;
    orderdetailgroups: {
      idproductoptiongroup: number;
      nameproductoptiongroup: string;
      orderdetailproductoptions: {
        idproductoption: number;
        nameoption: string;
        price: number;
        quantity: number;
      }[];
    }[];
  }[];
  orderdiscounts: {
    identitydiscount: number;
    iduserdiscountcoupon: number | null;
    description: string;
    amount: number;
  }[];
  orderfees: {
    identityfee: number;
    name: string;
    description: string;
    amount: number;
  }[];
  couponcode?: string;
}

export async function createOrder(
  payload: CreateOrderPayload,
  token: string,
): Promise<ApiResponse<Order>> {
  const { data } = await api.post<ApiResponse<Order>>("/orders", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return data;
}

// --- Image helpers ---

export function buildImageProduct(basepathimage: string, imageid: string): string {
  return `${basepathimage}/products/${imageid}`;
}

export function buildImageProductThumbnail(basepathimage: string, imageid: string): string {
  return `${basepathimage}/products/thumbnail/${imageid}`;
}

export default api;
