import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Receipt,
  Search,
  Smartphone,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  HistoricalOrderRecord,
  OrderHistoryRepository,
} from '../domain/orderHistoryRepository';
import { formatNaira } from '../domain/seedData';
import { OrderStatus, PaymentMethodType } from '../domain/types';
import { getStatusBadgeClasses } from './OrderStepper';

interface OrderHistoryPanelProps {
  refreshKey: number;
  onLogFetch?: (count: number) => void;
  onBackToMenu: () => void;
}

type HistoryFilter = 'all' | 'delivered' | 'refunded' | 'active';

function getPaymentIcon(method: PaymentMethodType) {
  switch (method) {
    case PaymentMethodType.CreditCard:
      return CreditCard;
    case PaymentMethodType.MobileMoney:
      return Smartphone;
    case PaymentMethodType.PlatformWallet:
      return Wallet;
  }
}

export function OrderHistoryPanel({
  refreshKey,
  onLogFetch,
  onBackToMenu,
}: OrderHistoryPanelProps) {
  const [records, setRecords] = useState<HistoricalOrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    OrderHistoryRepository.fetchAll().then((data) => {
      if (!active) return;
      setRecords(data);
      setLoading(false);
      setSelectedOrderId((prev) =>
        prev && data.some((d) => d.orderId === prev)
          ? prev
          : data[0]?.orderId ?? null,
      );
      onLogFetch?.(data.length);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((rec) => {
      if (filter === 'delivered' && rec.status !== OrderStatus.Delivered) return false;
      if (
        filter === 'refunded' &&
        rec.status !== OrderStatus.Refunded &&
        rec.status !== OrderStatus.Cancelled
      ) {
        return false;
      }
      if (
        filter === 'active' &&
        (rec.status === OrderStatus.Delivered ||
          rec.status === OrderStatus.Refunded ||
          rec.status === OrderStatus.Cancelled)
      ) {
        return false;
      }

      if (!q) return true;
      return (
        rec.orderId.toLowerCase().includes(q) ||
        rec.payment.transactionId.toLowerCase().includes(q) ||
        rec.items.some((item) => item.name.toLowerCase().includes(q))
      );
    });
  }, [records, filter, searchQuery]);

  const selectedOrder =
    filteredRecords.find((r) => r.orderId === selectedOrderId) ??
    filteredRecords[0] ??
    null;

  return (
    <section className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Order History
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Past orders and payment transactions retrieved from local storage.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'refunded', label: 'Refunded' },
              { id: 'active', label: 'Active' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/70 dark:border-neutral-700'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="mt-4 relative">
        <Search
          className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order ID (e.g. ORD-3904), dish name, or TXN ID..."
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 rounded-lg focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Body: Loading / Empty / Master-Detail */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse border border-neutral-200 dark:border-neutral-800"
              />
            ))}
          </div>
          <div className="lg:col-span-7 h-72 rounded-xl bg-neutral-100 dark:bg-neutral-900 animate-pulse border border-neutral-200 dark:border-neutral-800" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400">
            <Receipt className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="max-w-sm mx-auto">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No matching orders found
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Try clearing your search filter or place a new order from the menu.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToMenu}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Order List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredRecords.map((rec) => {
              const isSelected = selectedOrder?.orderId === rec.orderId;
              const PayIcon = getPaymentIcon(rec.payment.className);
              const itemCount = rec.items.reduce((sum, i) => sum + i.quantity, 0);

              return (
                <button
                  key={rec.orderId}
                  type="button"
                  onClick={() => setSelectedOrderId(rec.orderId)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600'
                      : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {rec.orderId}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${getStatusBadgeClasses(
                        rec.status,
                      )}`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    <span>{rec.placedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {itemCount} item{itemCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <PayIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{rec.payment.className}</span>
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatNaira(rec.total)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Transaction & Order Detail View */}
          {selectedOrder && (
            <div className="lg:col-span-7 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-neutral-50/50 dark:bg-neutral-950 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {selectedOrder.restaurantName} · {selectedOrder.placedAt}
                  </div>
                  <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 tabular-nums">
                    {selectedOrder.orderId}
                  </h2>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusBadgeClasses(
                    selectedOrder.status,
                  )}`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              {/* Composed Items Snapshot */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
                  Order Items
                </h3>
                <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-[#0B0B0C]">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.orderItemId}
                      className="p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.quantity}× {item.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {item.portionSize}
                          {item.modifiers.length > 0 && ` · ${item.modifiers.join(', ')}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatNaira(item.subtotal)}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                          {formatNaira(item.unitPrice)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Transaction Metadata */}
              <div className="p-4 rounded-lg bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Transaction Record
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {selectedOrder.payment.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Gateway Subclass:</span>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {selectedOrder.payment.className}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Transaction ID:</span>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 tabular-nums">
                      {selectedOrder.payment.transactionId}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-400 pt-1">
                  {selectedOrder.payment.details}
                </div>
              </div>

              {/* Delivery & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Delivery Destination
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {selectedOrder.deliveryAddress}
                      </div>
                    </div>
                  </div>
                  {selectedOrder.driverName && (
                    <div className="flex items-center gap-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
                      <span>Courier: {selectedOrder.driverName}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatNaira(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Delivery Fee</span>
                    <span className="tabular-nums">{formatNaira(selectedOrder.deliveryFee)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
                      <span>Discount ({selectedOrder.promoCode})</span>
                      <span className="tabular-nums">-{formatNaira(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    <span>Total Paid</span>
                    <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatNaira(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
