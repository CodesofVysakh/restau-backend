export enum OrderStatus {
  RECEIVED  = 'RECEIVED',
  PREPARING = 'PREPARING',
  READY     = 'READY',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID    = 'PAID',
  FAILED  = 'FAILED',
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.RECEIVED]:  [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]:     [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free';

export interface Category { id: string; name: string; slug: string; displayOrder: number; }

export interface CustomizationOption { id: string; groupId: string; label: string; priceDelta: number; }
export interface CustomizationGroup  { id: string; menuItemId: string; name: string; required: boolean; maxSelections: number; options: CustomizationOption[]; }

export interface MenuItem {
  id: string; categoryId: string; category?: Category;
  name: string; description: string; imageUrl: string;
  basePrice: number; prepTimeMins: number; stockQuantity: number;
  isAvailable: boolean; dietaryTags: DietaryTag[];
  customizationGroups?: CustomizationGroup[];
  updatedAt: string; createdAt: string;
}

export interface CartItemCustomization { optionId: string; label: string; priceDelta: number; }
export interface CartItem {
  id: string; menuItemId: string; name: string; imageUrl: string;
  basePrice: number; quantity: number; customizations: CartItemCustomization[];
  specialInstructions?: string; itemTotal: number;
}
export interface PriceDriftItem { menuItemId: string; name: string; cartPrice: number; currentPrice: number; }
export interface Cart {
  sessionId: string; tableNumber: string; items: CartItem[];
  subtotal: number; tax: number; total: number; itemCount: number;
  priceDrift?: PriceDriftItem[];
}

export interface OrderItemCustomizationDetail { id: string; optionId: string; label: string; priceDelta: number; }
export interface OrderItemDetail {
  id: string; menuItemId: string; name: string; imageUrl: string;
  quantity: number; unitPrice: number; specialInstructions?: string;
  customizations: OrderItemCustomizationDetail[]; itemTotal: number;
}
export interface OrderStatusHistoryEntry { id: string; status: OrderStatus; changedAt: string; }
export interface Order {
  id: string; tableNumber: string; sessionId: string; status: OrderStatus;
  subtotal: number; tax: number; total: number;
  paymentStatus: PaymentStatus; paymentId?: string;
  items: OrderItemDetail[]; statusHistory: OrderStatusHistoryEntry[];
  placedAt: string; updatedAt: string;
}

export interface PaymentRequest  { cardLastFour: string; amount: number; }
export interface PaymentResult   { paymentId: string; status: 'success' | 'failure'; processedAt: string; failureReason?: string; }
export interface WsOrderStatusPayload { orderId: string; status: OrderStatus; tableNumber: string; timestamp: string; }
