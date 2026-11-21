import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  PackageCheck,
  Receipt,
  XCircle,
} from 'lucide-react';
import { Order } from '../domain/Order';
import { formatNaira } from '../domain/seedData';
import { OrderStatus } from '../domain/types';
import { getStatusBadgeClasses } from './OrderStepper';

interface KitchenViewProps {
  order: Order;
  onAcceptOrder: () => void;
  onStartPreparing: () => void;
  onMarkReady: () => void;
  onDeclineAndRefund: () => void;
  onGoToCustomer: () => void;
  onGoToDriver: () => void;
}

export function KitchenView({
  order,
  onAcceptOrder,
  onStartPreparing,
  onMarkReady,
  onDeclineAndRefund,
  onGoToCustomer,
  onGoToDriver,
}: KitchenViewProps) {
  const items = order.getItems();
  const gatewaySnapshot = order.paymentGateway?.inspectAttributes();

  if (order.status === OrderStatus.Draft || order.status === OrderStatus.Cancelled) {
    return (
      <section className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center space-y-4 transition-colors">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
          <ChefHat className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">
            No Active Kitchen Tickets
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Orders arrive here once payment is authorized from the Customer View.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToCustomer}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
        >
          <span>Go to Customer View</span>
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </section>
    );
  }

  const canDecline =
    order.status === OrderStatus.Placed ||
    order.status === OrderStatus.Accepted ||
    order.status === OrderStatus.Preparing;

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Kitchen Display</span>
              <span aria-hidden="true">·</span>
              <span>{order.restaurant.name}</span>
            </div>
            <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 tabular-nums">
              Ticket {order.orderId}
            </h1>
          </div>

          <span
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusBadgeClasses(
              order.status,
            )}`}
          >
            {order.status}
          </span>
        </div>

        {/* Payment Settlement Status Banner */}
        {gatewaySnapshot && (
          <div className="mt-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Receipt
                className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5 shrink-0"
                strokeWidth={1.75}
              />
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Payment Method:{' '}
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {gatewaySnapshot.className}
                  </span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums mt-0.5">
                  {gatewaySnapshot.baseAttributes.transactionId} ·{' '}
                  {formatNaira(gatewaySnapshot.baseAttributes.amount)} ·{' '}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {gatewaySnapshot.baseAttributes.status}
                  </span>
                </div>
              </div>
            </div>

            {order.status === OrderStatus.Placed && (
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Accepting settles pre-authorized funds
              </span>
            )}
          </div>
        )}

        {/* Prep Queue Table */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Prep Queue ({items.length})
          </h2>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  <th className="py-2.5 px-4">Item ID</th>
                  <th className="py-2.5 px-4">Dish &amp; Modifiers</th>
                  <th className="py-2.5 px-4">Portion</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Prep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                {items.map((item) => (
                  <tr
                    key={item.orderItemId}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50"
                  >
                    <td className="py-3 px-4 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {item.orderItemId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.menuItem.name}
                      </div>
                      {item.modifiers.length > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                          {item.modifiers.map((m) => m.label).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {item.portionSize}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                      ×{item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                        {item.menuItem.prepTimeMins}m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kitchen Workflow Actions */}
        <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          {canDecline ? (
            <button
              type="button"
              onClick={onDeclineAndRefund}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" strokeWidth={1.75} />
              <span>Decline &amp; Refund</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-3">
            {order.status === OrderStatus.Placed && (
              <button
                type="button"
                onClick={onAcceptOrder}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                <span>Accept &amp; Settle Payment</span>
              </button>
            )}

            {order.status === OrderStatus.Accepted && (
              <button
                type="button"
                onClick={onStartPreparing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
              >
                <Flame className="w-4 h-4" strokeWidth={1.75} />
                <span>Start Preparing</span>
              </button>
            )}

            {order.status === OrderStatus.Preparing && (
              <button
                type="button"
                onClick={onMarkReady}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" strokeWidth={1.75} />
                <span>Mark Ready &amp; Dispatch</span>
              </button>
            )}

            {(order.status === OrderStatus.Ready ||
              order.status === OrderStatus.InTransit ||
              order.status === OrderStatus.Delivered) && (
              <button
                type="button"
                onClick={onGoToDriver}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Open Dispatch View</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}

            {order.status === OrderStatus.Refunded && (
              <div className="inline-flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
                <span>Ticket Closed &amp; Refunded</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
