import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  History,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Star,
  Tag,
  Trash2,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';
import { OrderHistoryPanel } from './OrderHistoryPanel';
import { MenuItem, Restaurant } from '../domain/Menu';
import {
  AVAILABLE_MODIFIERS,
  Order,
  PORTION_SURCHARGE,
} from '../domain/Order';
import { formatNaira } from '../domain/seedData';
import {
  MobileNetwork,
  ModifierOption,
  OrderStatus,
  PaymentMethodType,
  PortionSize,
} from '../domain/types';

export interface PaymentCheckoutFormState {
  selectedMethod: PaymentMethodType;
  simulateDecline: boolean;
  // CreditCardPayment fields
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  // MobileMoneyPayment fields
  msisdn: string;
  networkProvider: MobileNetwork;
  ussdPromptSent: boolean;
  ussdApproved: boolean;
  // PlatformWalletPayment fields
  walletBalance: number;
}

interface CustomerViewProps {
  restaurant: Restaurant;
  order: Order;
  checkoutForm: PaymentCheckoutFormState;
  lastCheckoutError: string | null;
  onUpdateCheckoutForm: (patch: Partial<PaymentCheckoutFormState>) => void;
  onAddItemToOrder: (
    menuItem: MenuItem,
    portion: PortionSize,
    modifiers: ModifierOption[],
    quantity: number,
  ) => void;
  onUpdateItemQty: (orderItemId: string, delta: number) => void;
  onRemoveItem: (orderItemId: string) => void;
  onCancelAndDestroyItems: () => void;
  onApplyPromoCode: (code: string) => { valid: boolean; rate: number };
  onSendUssdPrompt: () => void;
  onApproveUssdPrompt: () => void;
  onTopUpWallet: (amount: number) => void;
  onAuthorizeAndPlaceOrder: () => void;
  onGoToKitchen: () => void;
  historyRefreshKey: number;
  onLogHistoryFetch: (count: number) => void;
}

export function CustomerView({
  restaurant,
  order,
  checkoutForm,
  lastCheckoutError,
  onUpdateCheckoutForm,
  onAddItemToOrder,
  onUpdateItemQty,
  onRemoveItem,
  onCancelAndDestroyItems,
  onApplyPromoCode,
  onSendUssdPrompt,
  onApproveUssdPrompt,
  onTopUpWallet,
  onAuthorizeAndPlaceOrder,
  onGoToKitchen,
  historyRefreshKey,
  onLogHistoryFetch,
}: CustomerViewProps) {
  const [customerTab, setCustomerTab] = useState<'menu' | 'history'>('menu');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [modalPortion, setModalPortion] = useState<PortionSize>(PortionSize.Regular);
  const [modalModifiers, setModalModifiers] = useState<ModifierOption[]>([]);
  const [modalQty, setModalQty] = useState<number>(1);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [promoInput, setPromoInput] = useState<string>(order.promoCode ?? '');
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  const items = order.getItems();
  const menuItems = restaurant.getMenuItems();
  const subtotal = order.getSubtotal();
  const discount = order.getDiscount();
  const deliveryFee = order.getDeliveryFee();
  const total = order.getTotal();
  const isDraft = order.status === OrderStatus.Draft;

  const openCustomizeModal = (menuItem: MenuItem) => {
    setCustomizingItem(menuItem);
    setModalPortion(PortionSize.Regular);
    setModalModifiers([]);
    setModalQty(1);
  };

  const toggleModifier = (mod: ModifierOption) => {
    setModalModifiers((prev) =>
      prev.some((m) => m.id === mod.id)
        ? prev.filter((m) => m.id !== mod.id)
        : [...prev, mod],
    );
  };

  const handleConfirmAddItem = () => {
    if (!customizingItem) return;
    onAddItemToOrder(customizingItem, modalPortion, modalModifiers, modalQty);
    setCustomizingItem(null);
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onApplyPromoCode(promoInput);
    if (!promoInput.trim()) {
      setPromoFeedback(null);
      return;
    }
    if (res.valid) {
      setPromoFeedback({
        type: 'ok',
        text: `Promo ${promoInput.trim().toUpperCase()} applied (${Math.round(res.rate * 100)}% off).`,
      });
    } else {
      setPromoFeedback({
        type: 'err',
        text: 'Invalid code. Try EXPRESS10 for 10% off.',
      });
    }
  };

  const modalUnitPrice = customizingItem
    ? customizingItem.basePrice +
      PORTION_SURCHARGE[modalPortion] +
      modalModifiers.reduce((acc, m) => acc + m.priceDelta, 0)
    : 0;

  const walletInsufficient =
    checkoutForm.selectedMethod === PaymentMethodType.PlatformWallet &&
    total > checkoutForm.walletBalance;

  return (
    <div className="space-y-6">
      {/* Customer Sub-View Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Customer sections"
          className="inline-flex items-center gap-1 p-1 bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={customerTab === 'menu'}
            onClick={() => setCustomerTab('menu')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              customerTab === 'menu'
                ? 'bg-neutral-900 dark:bg-neutral-800 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Menu &amp; Checkout</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={customerTab === 'history'}
            onClick={() => setCustomerTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              customerTab === 'history'
                ? 'bg-neutral-900 dark:bg-neutral-800 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <History className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Order History</span>
          </button>
        </div>
      </div>

      {customerTab === 'history' ? (
        <OrderHistoryPanel
          refreshKey={historyRefreshKey}
          onLogFetch={onLogHistoryFetch}
          onBackToMenu={() => setCustomerTab('menu')}
        />
      ) : (
        <>
          {/* Restaurant Menu Showcase */}
          <section className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{restaurant.cuisine}</span>
              <span aria-hidden="true">·</span>
              <span>Victoria Island, Lagos</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-200 font-medium">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
              {restaurant.name}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {restaurant.address} · Fresh charcoal-grilled dishes prepared to order.
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500 dark:text-neutral-400">
            <div className="tabular-nums">{menuItems.length} Signature Dishes</div>
            <div className="text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
              Open for Express Dispatch
            </div>
          </div>
        </div>

        {/* 5-Item Minimalist Menu Grid (1st featured wide + 2x2 grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {menuItems.map((item, idx) => {
            const isFeatured = idx === 0;
            return (
              <article
                key={item.id}
                className={`border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 ${
                  isFeatured ? 'md:col-span-2 grid grid-cols-1 sm:grid-cols-12' : 'flex flex-col'
                }`}
              >
                <div
                  className={`relative bg-neutral-100 dark:bg-neutral-900 overflow-hidden ${
                    isFeatured ? 'sm:col-span-5 aspect-4/3 sm:aspect-auto sm:min-h-[210px]' : 'aspect-4/3'
                  }`}
                >
                  {failedImages[item.id] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 p-4 text-center">
                      <Utensils className="w-8 h-8 mb-2 text-neutral-400" strokeWidth={1.75} />
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div
                  className={`p-4 sm:p-5 flex flex-col justify-between gap-3 ${
                    isFeatured ? 'sm:col-span-7' : 'flex-1'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{item.category}</span>
                      <span className="tabular-nums">{item.prepTimeMins} mins</span>
                    </div>
                    <h3
                      className={`font-display font-bold text-neutral-900 dark:text-neutral-100 mt-1 ${
                        isFeatured ? 'text-xl' : 'text-lg'
                      }`}
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                    <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatNaira(item.basePrice)}
                    </span>

                    <button
                      type="button"
                      disabled={!isDraft}
                      onClick={() => openCustomizeModal(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>{isDraft ? 'Customize & Add' : 'Order Locked'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Active Order Basket & Polymorphic Payment Checkout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Order & OrderItem Composition */}
        <section className="xl:col-span-6 bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Your Order
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                {order.orderId} · {items.length} item{items.length === 1 ? '' : 's'}
              </p>
            </div>

            {isDraft && items.length > 0 && (
              <button
                type="button"
                onClick={onCancelAndDestroyItems}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Clear Basket</span>
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Your basket is empty.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                Select any dish from Lagos Grill &amp; Kitchen above to customize portions and modifiers.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((item) => (
                <div key={item.orderItemId} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {item.menuItem.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                        {item.orderItemId}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>{item.portionSize}</span>
                      {item.portionSize === PortionSize.Large && (
                        <span className="tabular-nums"> (+₦1,500)</span>
                      )}
                      {item.modifiers.length > 0 && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{item.modifiers.map((m) => m.label).join(', ')}</span>
                        </>
                      )}
                    </div>

                    {isDraft && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="inline-flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.menuItem.name}`}
                            onClick={() => onUpdateItemQty(item.orderItemId, -1)}
                            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.menuItem.name}`}
                            onClick={() => onUpdateItemQty(item.orderItemId, 1)}
                            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.orderItemId)}
                          className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatNaira(item.calculateSubtotal())}
                    </div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums mt-0.5">
                      {item.quantity} × {formatNaira(item.calculateUnitPrice())}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promo Code Input */}
          {items.length > 0 && (
            <form onSubmit={handlePromoSubmit} className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <label htmlFor="promo-code" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Promo Code (use <span className="text-orange-600 dark:text-orange-400 font-semibold">EXPRESS10</span> for 10% off)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                  <input
                    id="promo-code"
                    type="text"
                    disabled={!isDraft}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="EXPRESS10"
                    className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 rounded-lg focus:outline-none focus:border-emerald-600 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isDraft}
                  className="px-4 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-xs mt-1.5 ${
                    promoFeedback.type === 'ok'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {promoFeedback.text}
                </p>
              )}
            </form>
          )}

          {/* Totals Breakdown */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Express Delivery</span>
              <span className="tabular-nums">{formatNaira(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
                <span>Promo ({order.promoCode})</span>
                <span className="tabular-nums">-{formatNaira(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200 dark:border-neutral-800 text-base font-bold text-neutral-900 dark:text-neutral-100">
              <span>Total</span>
              <span className="text-lg tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatNaira(total)}
              </span>
            </div>
          </div>
        </section>

        {/* Right: Polymorphic PaymentGateway Checkout */}
        <section className="xl:col-span-6 bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Payment Checkout
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Select a gateway subclass to authorize
              </p>
            </div>

            {/* Payment Outcome Simulator Toggle */}
            <button
              type="button"
              disabled={!isDraft}
              onClick={() =>
                onUpdateCheckoutForm({ simulateDecline: !checkoutForm.simulateDecline })
              }
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 ${
                checkoutForm.simulateDecline
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span>
                {checkoutForm.simulateDecline
                  ? 'Simulate: Declined'
                  : 'Simulate: Approved'}
              </span>
            </button>
          </div>

          {!isDraft ? (
            <div className="py-6 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                  strokeWidth={1.75}
                />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Order {order.orderId} Submitted ({order.status})
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    Authorized via{' '}
                    <span className="font-semibold">
                      {order.paymentGateway?.getClassName()}
                    </span>
                    . Continue in the Restaurant Kitchen tab.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoToKitchen}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Open Restaurant Kitchen View</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {/* Subclass Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    type: PaymentMethodType.CreditCard,
                    label: 'Credit Card',
                    sub: 'CreditCardPayment',
                    icon: CreditCard,
                  },
                  {
                    type: PaymentMethodType.MobileMoney,
                    label: 'Mobile Money',
                    sub: 'MobileMoneyPayment',
                    icon: Smartphone,
                  },
                  {
                    type: PaymentMethodType.PlatformWallet,
                    label: 'Wallet',
                    sub: 'PlatformWalletPayment',
                    icon: Wallet,
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = checkoutForm.selectedMethod === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => onUpdateCheckoutForm({ selectedMethod: opt.type })}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 text-neutral-900 dark:text-neutral-100'
                          : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-1.5 ${
                          active
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate w-full mt-0.5">
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Concrete Subclass Specific Form */}
              {checkoutForm.selectedMethod === PaymentMethodType.CreditCard && (
                <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Card &amp; 3D Secure Hold
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Tokenized
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={checkoutForm.cardNumber}
                      onChange={(e) => onUpdateCheckoutForm({ cardNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs tabular-nums bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={checkoutForm.cardholderName}
                      onChange={(e) => onUpdateCheckoutForm({ cardholderName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={checkoutForm.expiry}
                        onChange={(e) => onUpdateCheckoutForm({ expiry: e.target.value })}
                        className="w-full px-3 py-2 text-xs tabular-nums bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={checkoutForm.cvv}
                        onChange={(e) => onUpdateCheckoutForm({ cvv: e.target.value })}
                        className="w-full px-3 py-2 text-xs tabular-nums bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {checkoutForm.selectedMethod === PaymentMethodType.MobileMoney && (
                <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      USSD Push Authorization
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Mobile Money
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Network Provider
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[MobileNetwork.MTN, MobileNetwork.Airtel, MobileNetwork.OPay].map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => onUpdateCheckoutForm({ networkProvider: net })}
                          className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            checkoutForm.networkProvider === net
                              ? 'bg-neutral-900 dark:bg-emerald-600 text-white border-neutral-900 dark:border-emerald-600'
                              : 'bg-white dark:bg-black text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Phone Number (MSISDN)
                    </label>
                    <input
                      type="text"
                      value={checkoutForm.msisdn}
                      onChange={(e) => onUpdateCheckoutForm({ msisdn: e.target.value })}
                      className="w-full px-3 py-2 text-xs tabular-nums bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    {!checkoutForm.ussdPromptSent ? (
                      <button
                        type="button"
                        onClick={onSendUssdPrompt}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
                      >
                        Send USSD Prompt
                      </button>
                    ) : !checkoutForm.ussdApproved ? (
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          USSD prompt active on handset...
                        </span>
                        <button
                          type="button"
                          onClick={onApproveUssdPrompt}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                        >
                          Approve USSD PIN
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                        USSD Prompt Approved
                      </span>
                    )}
                  </div>
                </div>
              )}

              {checkoutForm.selectedMethod === PaymentMethodType.PlatformWallet && (
                <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      FoodExpress Wallet
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Instant Settlement
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg">
                    <div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Available Balance
                      </div>
                      <div
                        className={`text-lg font-bold tabular-nums mt-0.5 ${
                          walletInsufficient
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {formatNaira(checkoutForm.walletBalance)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onTopUpWallet(15000)}
                      className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + Top Up ₦15,000
                    </button>
                  </div>

                  {walletInsufficient && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span>
                        Order total ({formatNaira(total)}) exceeds wallet balance. Top up wallet or switch method.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {lastCheckoutError && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
                  <AlertCircle
                    className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <span>{lastCheckoutError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={items.length === 0}
                onClick={onAuthorizeAndPlaceOrder}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Authorize Payment &amp; Place Order ({formatNaira(total)})
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                  {customizingItem.category}
                </div>
                <h3
                  id="customize-modal-title"
                  className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100"
                >
                  {customizingItem.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Choose portion size and optional add-ons
                </p>
              </div>
              <button
                type="button"
                aria-label="Close customization dialog"
                onClick={() => setCustomizingItem(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Portion Size */}
            <div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                Portion Size
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[PortionSize.Regular, PortionSize.Large].map((size) => {
                  const selected = modalPortion === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setModalPortion(size)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100'
                          : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{size}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                        {PORTION_SURCHARGE[size] === 0
                          ? 'Included'
                          : `+${formatNaira(PORTION_SURCHARGE[size])}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-on Modifiers */}
            <div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                Add-on Modifiers
              </div>
              <div className="space-y-2">
                {AVAILABLE_MODIFIERS.map((mod) => {
                  const checked = modalModifiers.some((m) => m.id === mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        checked
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-medium'
                          : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <span>{mod.label}</span>
                      <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                        {mod.priceDelta > 0 ? `+${formatNaira(mod.priceDelta)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Confirm */}
            <div className="flex items-center justify-between gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="inline-flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                  className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <Minus className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <span className="px-3 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {modalQty}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQty((q) => q + 1)}
                  className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddItem}
                className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                Add Item · {formatNaira(modalUnitPrice * modalQty)}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
