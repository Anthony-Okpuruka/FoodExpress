import { Order } from './Order';
import {
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  PortionSize,
} from './types';

export interface HistoricalOrderItemSnapshot {
  orderItemId: string;
  menuItemId: string;
  name: string;
  portionSize: PortionSize;
  modifiers: string[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface HistoricalPaymentSnapshot {
  className: PaymentMethodType;
  transactionId: string;
  status: PaymentStatus;
  details: string;
}

export interface HistoricalOrderRecord {
  orderId: string;
  restaurantName: string;
  placedAt: string;
  status: OrderStatus;
  items: HistoricalOrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promoCode: string | null;
  total: number;
  payment: HistoricalPaymentSnapshot;
  driverName: string | null;
  deliveryAddress: string;
}

const STORAGE_KEY = 'foodexpress-order-history-v1';

function createSeedHistory(): HistoricalOrderRecord[] {
  return [
    {
      orderId: 'ORD-3904',
      restaurantName: 'Lagos Grill & Kitchen',
      placedAt: '2026-11-20 19:42',
      status: OrderStatus.Delivered,
      items: [
        {
          orderItemId: 'OI-81A2',
          menuItemId: 'MENU-101',
          name: 'Jollof Rice Combo',
          portionSize: PortionSize.Large,
          modifiers: ['Extra Protein', 'Extra Sauce'],
          quantity: 1,
          unitPrice: 7300,
          subtotal: 7300,
        },
        {
          orderItemId: 'OI-81B4',
          menuItemId: 'MENU-104',
          name: 'Chapman Drink',
          portionSize: PortionSize.Regular,
          modifiers: [],
          quantity: 2,
          unitPrice: 1500,
          subtotal: 3000,
        },
      ],
      subtotal: 10300,
      deliveryFee: 1200,
      discount: 1030,
      promoCode: 'EXPRESS10',
      total: 10470,
      payment: {
        className: PaymentMethodType.MobileMoney,
        transactionId: 'TXN-M94K21',
        status: PaymentStatus.Settled,
        details: 'MTN MoMo (+234 803 456 7890 · USSD-448210)',
      },
      driverName: 'Chinedu Okafor',
      deliveryAddress: '14 Bourdillon Road, Ikoyi, Lagos',
    },
    {
      orderId: 'ORD-3712',
      restaurantName: 'Lagos Grill & Kitchen',
      placedAt: '2026-11-18 13:15',
      status: OrderStatus.Delivered,
      items: [
        {
          orderItemId: 'OI-64C9',
          menuItemId: 'MENU-105',
          name: 'Peppered Suya Skewers',
          portionSize: PortionSize.Regular,
          modifiers: ['Extra Sauce'],
          quantity: 2,
          unitPrice: 4500,
          subtotal: 9000,
        },
        {
          orderItemId: 'OI-64D1',
          menuItemId: 'MENU-103',
          name: 'Spicy Beef Shawarma',
          portionSize: PortionSize.Regular,
          modifiers: ['No Onions'],
          quantity: 1,
          unitPrice: 3200,
          subtotal: 3200,
        },
      ],
      subtotal: 12200,
      deliveryFee: 1200,
      discount: 0,
      promoCode: null,
      total: 13400,
      payment: {
        className: PaymentMethodType.CreditCard,
        transactionId: 'TXN-C71P08',
        status: PaymentStatus.Settled,
        details: 'Visa **** 8842 · 3DS_VERIFIED',
      },
      driverName: 'Tunde Adebayo',
      deliveryAddress: 'Plot 8 Admiralty Way, Lekki Phase 1, Lagos',
    },
    {
      orderId: 'ORD-3588',
      restaurantName: 'Lagos Grill & Kitchen',
      placedAt: '2026-11-14 20:08',
      status: OrderStatus.Refunded,
      items: [
        {
          orderItemId: 'OI-51F0',
          menuItemId: 'MENU-102',
          name: 'Grilled Chicken Platter',
          portionSize: PortionSize.Large,
          modifiers: ['Extra Protein'],
          quantity: 1,
          unitPrice: 9300,
          subtotal: 9300,
        },
      ],
      subtotal: 9300,
      deliveryFee: 1200,
      discount: 0,
      promoCode: null,
      total: 10500,
      payment: {
        className: PaymentMethodType.PlatformWallet,
        transactionId: 'TXN-W30Q55',
        status: PaymentStatus.Refunded,
        details: 'FoodExpress Wallet (WLT-NG-9042) — Refunded on Out-of-Stock',
      },
      driverName: null,
      deliveryAddress: '22 Akin Adesola St, Victoria Island, Lagos',
    },
  ];
}

function readStorage(): HistoricalOrderRecord[] {
  if (typeof window === 'undefined') return createSeedHistory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedHistory();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createSeedHistory();
  } catch {
    return createSeedHistory();
  }
}

function writeStorage(records: HistoricalOrderRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors in sandboxed iframes
  }
}

function formatNowTimestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export class OrderHistoryRepository {
  public static async fetchAll(): Promise<HistoricalOrderRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 140));
    return readStorage();
  }

  public static upsertFromOrder(order: Order): HistoricalOrderRecord {
    const gwSnapshot = order.paymentGateway?.inspectAttributes();
    const subAttrs = gwSnapshot?.subclassAttributes ?? {};
    let paymentDetails = 'Authorized transaction';

    if (gwSnapshot?.className === PaymentMethodType.CreditCard) {
      paymentDetails = `${subAttrs.cardNumberMasked ?? 'Card'} · ${subAttrs.threeDSecureStatus ?? '3DS_VERIFIED'}`;
    } else if (gwSnapshot?.className === PaymentMethodType.MobileMoney) {
      paymentDetails = `${subAttrs.networkProvider ?? 'Mobile Money'} (${subAttrs.msisdn ?? ''})`;
    } else if (gwSnapshot?.className === PaymentMethodType.PlatformWallet) {
      paymentDetails = `FoodExpress Wallet (${subAttrs.walletId ?? 'WLT-NG-9042'})`;
    }

    const existing = readStorage();
    const prevRecord = existing.find((r) => r.orderId === order.orderId);

    const record: HistoricalOrderRecord = {
      orderId: order.orderId,
      restaurantName: order.restaurant.name,
      placedAt: prevRecord?.placedAt ?? formatNowTimestamp(),
      status: order.status,
      items: order.getItems().map((item) => ({
        orderItemId: item.orderItemId,
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        portionSize: item.portionSize,
        modifiers: item.modifiers.map((m) => m.label),
        quantity: item.quantity,
        unitPrice: item.calculateUnitPrice(),
        subtotal: item.calculateSubtotal(),
      })),
      subtotal: order.getSubtotal(),
      deliveryFee: order.getDeliveryFee(),
      discount: order.getDiscount(),
      promoCode: order.promoCode,
      total: order.getTotal(),
      payment: {
        className: gwSnapshot?.className ?? PaymentMethodType.CreditCard,
        transactionId: gwSnapshot?.baseAttributes.transactionId ?? 'TXN-LOCAL',
        status: gwSnapshot?.baseAttributes.status ?? PaymentStatus.PreAuthorized,
        details: paymentDetails,
      },
      driverName: order.assignedDriver?.name ?? null,
      deliveryAddress: '14 Bourdillon Road, Ikoyi, Lagos',
    };

    const next = [record, ...existing.filter((r) => r.orderId !== order.orderId)];
    writeStorage(next);
    return record;
  }

  public static resetToSeed(): HistoricalOrderRecord[] {
    const seed = createSeedHistory();
    writeStorage(seed);
    return seed;
  }
}
