import { DispatchDriver } from './Dispatch';
import { MenuItem, Restaurant } from './Menu';
import { PaymentGateway } from './PaymentGateway';
import {
  DeliveryMilestone,
  ModifierOption,
  OrderStatus,
  PortionSize,
  StateTransition,
} from './types';

export const PORTION_SURCHARGE: Record<PortionSize, number> = {
  [PortionSize.Regular]: 0,
  [PortionSize.Large]: 1500,
};

export const AVAILABLE_MODIFIERS: ModifierOption[] = [
  { id: 'extra_protein', label: 'Extra Protein', priceDelta: 1000 },
  { id: 'extra_sauce', label: 'Extra Sauce', priceDelta: 300 },
  { id: 'no_onions', label: 'No Onions', priceDelta: 0 },
];

export const VALID_PROMO_CODES: Record<string, number> = {
  EXPRESS10: 0.1,
};

/**
 * Composed Child Entity: OrderItem (Solid Diamond ♦ Composition)
 * Bound tightly to parent Order; cannot exist independently outside an Order.
 */
export class OrderItem {
  public readonly orderItemId: string;
  public readonly parentOrderId: string;
  public readonly menuItem: MenuItem;
  public portionSize: PortionSize;
  public modifiers: ModifierOption[];
  public quantity: number;

  constructor(
    parentOrderId: string,
    menuItem: MenuItem,
    portionSize: PortionSize = PortionSize.Regular,
    modifiers: ModifierOption[] = [],
    quantity: number = 1,
    orderItemId?: string,
  ) {
    this.orderItemId =
      orderItemId ?? `OI-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    this.parentOrderId = parentOrderId;
    this.menuItem = menuItem;
    this.portionSize = portionSize;
    this.modifiers = modifiers;
    this.quantity = Math.max(1, quantity);
  }

  public calculateUnitPrice(): number {
    const portionDelta = PORTION_SURCHARGE[this.portionSize] ?? 0;
    const modifiersDelta = this.modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);
    return this.menuItem.basePrice + portionDelta + modifiersDelta;
  }

  public calculateSubtotal(): number {
    return this.calculateUnitPrice() * this.quantity;
  }
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Draft]: [OrderStatus.Placed, OrderStatus.Cancelled],
  [OrderStatus.Placed]: [OrderStatus.Accepted, OrderStatus.Refunded, OrderStatus.Cancelled],
  [OrderStatus.Accepted]: [OrderStatus.Preparing, OrderStatus.Refunded],
  [OrderStatus.Preparing]: [OrderStatus.Ready, OrderStatus.Refunded],
  [OrderStatus.Ready]: [OrderStatus.InTransit],
  [OrderStatus.InTransit]: [OrderStatus.Delivered],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Cancelled]: [],
  [OrderStatus.Refunded]: [],
};

/**
 * Aggregate Root Entity: Order
 * Composes OrderItem[] instances and orchestrates the finite state machine.
 */
export class Order {
  public readonly orderId: string;
  public readonly restaurant: Restaurant;
  private items: OrderItem[] = [];
  public promoCode: string | null = null;
  public readonly deliveryFee: number = 1200;
  public status: OrderStatus = OrderStatus.Draft;
  public paymentGateway: PaymentGateway | null = null;
  public assignedDriver: DispatchDriver | null = null;
  public stateHistory: StateTransition[] = [];
  public deliveryMilestones: DeliveryMilestone[];

  constructor(restaurant: Restaurant, orderId?: string) {
    this.orderId = orderId ?? `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    this.restaurant = restaurant;
    this.stateHistory = [
      {
        from: null,
        to: OrderStatus.Draft,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        note: 'Order instance initialized in Draft state',
      },
    ];
    this.deliveryMilestones = [
      {
        id: 'ms-kitchen',
        label: 'Pickup at Restaurant',
        location: 'Lagos Grill & Kitchen, Victoria Island',
        completed: false,
        timestamp: null,
      },
      {
        id: 'ms-bridge',
        label: 'En Route via Lekki-Ikoyi Corridor',
        location: 'Admiralty Way Junction',
        completed: false,
        timestamp: null,
      },
      {
        id: 'ms-dropoff',
        label: 'Customer Drop-off',
        location: '14 Bourdillon Road, Ikoyi, Lagos',
        completed: false,
        timestamp: null,
      },
    ];
  }

  public getItems(): ReadonlyArray<OrderItem> {
    return this.items;
  }

  public addItem(
    menuItem: MenuItem,
    portionSize: PortionSize,
    modifiers: ModifierOption[],
    quantity: number = 1,
  ): OrderItem {
    const newItem = new OrderItem(this.orderId, menuItem, portionSize, modifiers, quantity);
    this.items.push(newItem);
    return newItem;
  }

  public updateItemQuantity(orderItemId: string, delta: number): void {
    const idx = this.items.findIndex((i) => i.orderItemId === orderItemId);
    if (idx === -1) return;
    const nextQty = this.items[idx].quantity + delta;
    if (nextQty <= 0) {
      this.items.splice(idx, 1);
    } else {
      this.items[idx].quantity = nextQty;
    }
  }

  public removeItem(orderItemId: string): void {
    this.items = this.items.filter((i) => i.orderItemId !== orderItemId);
  }

  /**
   * Demonstrates UML Composition:
   * Destroying/cancelling the Order clears all composed OrderItem children,
   * while Restaurant's aggregated MenuItem instances remain completely intact.
   */
  public destroyAllComposedItems(): number {
    const count = this.items.length;
    this.items = [];
    this.promoCode = null;
    return count;
  }

  public applyPromoCode(code: string): { valid: boolean; rate: number } {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      this.promoCode = null;
      return { valid: true, rate: 0 };
    }
    const rate = VALID_PROMO_CODES[normalized];
    if (rate !== undefined) {
      this.promoCode = normalized;
      return { valid: true, rate };
    }
    return { valid: false, rate: 0 };
  }

  public getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.calculateSubtotal(), 0);
  }

  public getDiscount(): number {
    if (!this.promoCode) return 0;
    const rate = VALID_PROMO_CODES[this.promoCode] ?? 0;
    return Math.round(this.getSubtotal() * rate);
  }

  public getDeliveryFee(): number {
    return this.items.length > 0 ? this.deliveryFee : 0;
  }

  public getTotal(): number {
    if (this.items.length === 0) return 0;
    return Math.max(0, this.getSubtotal() - this.getDiscount() + this.getDeliveryFee());
  }

  public canTransitionTo(next: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[this.status]?.includes(next) ?? false;
  }

  public transitionTo(next: OrderStatus, note: string): boolean {
    if (!this.canTransitionTo(next)) return false;
    const prev = this.status;
    this.status = next;
    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
    this.stateHistory.push({
      from: prev,
      to: next,
      timestamp: now,
      note,
    });

    if (next === OrderStatus.InTransit) {
      this.deliveryMilestones[0].completed = true;
      this.deliveryMilestones[0].timestamp = now;
      this.deliveryMilestones[1].completed = true;
      this.deliveryMilestones[1].timestamp = now;
    } else if (next === OrderStatus.Delivered) {
      this.deliveryMilestones.forEach((m) => {
        if (!m.completed) {
          m.completed = true;
          m.timestamp = now;
        }
      });
    }

    return true;
  }
}
