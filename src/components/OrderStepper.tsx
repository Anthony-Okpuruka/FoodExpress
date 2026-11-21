import { Check, ChefHat, PackageCheck, Receipt, Truck, XCircle } from 'lucide-react';
import { OrderStatus } from '../domain/types';

interface OrderStepperProps {
  status: OrderStatus;
  orderId: string;
}

const LIFECYCLE_STEPS: Array<{
  status: OrderStatus;
  label: string;
  icon: typeof Receipt;
}> = [
  { status: OrderStatus.Placed, label: 'Placed', icon: Receipt },
  { status: OrderStatus.Accepted, label: 'Accepted', icon: Check },
  { status: OrderStatus.Preparing, label: 'Preparing', icon: ChefHat },
  { status: OrderStatus.Ready, label: 'Ready', icon: PackageCheck },
  { status: OrderStatus.InTransit, label: 'InTransit', icon: Truck },
  { status: OrderStatus.Delivered, label: 'Delivered', icon: Check },
];

export function getStatusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Placed:
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
    case OrderStatus.Accepted:
    case OrderStatus.Preparing:
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
    case OrderStatus.Ready:
    case OrderStatus.InTransit:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
    case OrderStatus.Delivered:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
    case OrderStatus.Refunded:
    case OrderStatus.Cancelled:
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800';
  }
}

export function OrderStepper({ status, orderId }: OrderStepperProps) {
  const activeIndex = LIFECYCLE_STEPS.findIndex((step) => step.status === status);
  const isTerminalError = status === OrderStatus.Refunded || status === OrderStatus.Cancelled;

  return (
    <section
      aria-label="Order lifecycle progress"
      className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Order Progress
          </h2>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{orderId}</span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusBadgeClasses(
            status,
          )}`}
        >
          {isTerminalError && <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} />}
          <span>{status}</span>
        </span>
      </div>

      {isTerminalError ? (
        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm">
          <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" strokeWidth={1.75} />
          <div>
            <p className="font-semibold">
              {status === OrderStatus.Refunded
                ? 'Order Declined & Refunded'
                : 'Order Cancelled — Basket Cleared'}
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              {status === OrderStatus.Refunded
                ? 'Kitchen declined the ticket. Refund issued back to your original payment method.'
                : 'Composed OrderItem instances cleared while Restaurant menu items remain intact.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {LIFECYCLE_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = activeIndex > index || status === OrderStatus.Delivered;
            const isCurrent = activeIndex === index && status !== OrderStatus.Delivered;

            return (
              <div
                key={step.status}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : isCompleted
                      ? 'bg-neutral-50 dark:bg-neutral-900 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                </span>
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
