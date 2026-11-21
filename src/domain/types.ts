export enum OrderStatus {
  Draft = 'Draft',
  Placed = 'Placed',
  Accepted = 'Accepted',
  Preparing = 'Preparing',
  Ready = 'Ready',
  InTransit = 'InTransit',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Refunded = 'Refunded',
}

export enum PortionSize {
  Regular = 'Regular',
  Large = 'Large',
}

export enum PaymentMethodType {
  CreditCard = 'CreditCardPayment',
  MobileMoney = 'MobileMoneyPayment',
  PlatformWallet = 'PlatformWalletPayment',
}

export enum MobileNetwork {
  MTN = 'MTN MoMo',
  Airtel = 'Airtel Money',
  OPay = 'OPay',
}

export enum PaymentStatus {
  Idle = 'IDLE',
  PreAuthorized = 'PRE_AUTHORIZED',
  Settled = 'SETTLED',
  Declined = 'DECLINED',
  Refunded = 'REFUNDED',
}

export enum DriverStatus {
  Available = 'AVAILABLE',
  Assigned = 'ASSIGNED',
  InTransit = 'IN_TRANSIT',
  Busy = 'BUSY',
}

export type RoleView = 'customer' | 'kitchen' | 'driver';

export interface ModifierOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface MethodLogEntry {
  id: string;
  timestamp: string;
  instanceName: string;
  className: string;
  methodSignature: string;
  returnValue: string;
  outcome: 'success' | 'error' | 'info';
}

export interface StateTransition {
  from: OrderStatus | null;
  to: OrderStatus;
  timestamp: string;
  note: string;
}

export interface DeliveryMilestone {
  id: string;
  label: string;
  location: string;
  completed: boolean;
  timestamp: string | null;
}
