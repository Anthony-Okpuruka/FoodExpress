import {
  ArrowRight,
  Bike,
  CheckCircle2,
  MapPin,
  Navigation,
  Star,
  Truck,
} from 'lucide-react';
import { DispatchDriver, HeuristicCandidate } from '../domain/Dispatch';
import { Order } from '../domain/Order';
import { DriverStatus, OrderStatus } from '../domain/types';
import { getStatusBadgeClasses } from './OrderStepper';

interface DriverViewProps {
  order: Order;
  drivers: DispatchDriver[];
  heuristicResults: HeuristicCandidate[];
  onPickUpOrder: () => void;
  onConfirmDelivery: () => void;
  onGoToKitchen: () => void;
  onGoToCustomer: () => void;
}

export function DriverView({
  order,
  drivers,
  heuristicResults,
  onPickUpOrder,
  onConfirmDelivery,
  onGoToKitchen,
  onGoToCustomer,
}: DriverViewProps) {
  const isDispatchReady =
    order.status === OrderStatus.Ready ||
    order.status === OrderStatus.InTransit ||
    order.status === OrderStatus.Delivered;

  const displayCandidates: HeuristicCandidate[] =
    heuristicResults.length > 0
      ? heuristicResults
      : drivers.map((driver, idx) => ({
          driver,
          rank: idx + 1,
          eligible: driver.status === DriverStatus.Available,
          scoreLabel: 'Pending Ready',
          reason:
            driver.status === DriverStatus.Available
              ? `Standby in ${driver.zone} (${driver.distanceKm.toFixed(1)} km)`
              : `Unavailable: ${driver.status}`,
        }));

  const completedCount = order.deliveryMilestones.filter((m) => m.completed).length;
  const progressPct = Math.round(
    (completedCount / Math.max(1, order.deliveryMilestones.length)) * 100,
  );

  return (
    <div className="space-y-6">
      {/* Driver Matching Heuristic Panel */}
      <section className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h1 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Nearby Courier Matching
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Ranks couriers by availability and proximity distance (km)
            </p>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStatusBadgeClasses(
              order.status,
            )}`}
          >
            Order: {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {displayCandidates.map((cand) => {
            const isAssigned = order.assignedDriver?.driverId === cand.driver.driverId;
            return (
              <div
                key={cand.driver.driverId}
                className={`p-4 rounded-xl border transition-colors ${
                  isAssigned
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600'
                    : cand.driver.status === DriverStatus.Busy
                      ? 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-75'
                      : 'bg-white dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    #{cand.rank} · {cand.driver.driverId}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      isAssigned
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                        : cand.driver.status === DriverStatus.Available
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {cand.driver.status}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                    <Bike className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {cand.driver.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {cand.driver.vehicleType}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-200/70 dark:border-neutral-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500">Proximity</div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {cand.driver.distanceKm.toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500">Rating</div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {cand.driver.rating.toFixed(1)}
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                  {cand.reason}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Driver Delivery Console */}
      <section className="bg-white dark:bg-[#0B0B0C] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 transition-colors">
        {!isDispatchReady ? (
          <div className="py-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
              <Truck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
              Waiting for Kitchen Ready State
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Auto-dispatch runs as soon as {order.orderId} is marked Ready by the kitchen.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {order.status === OrderStatus.Draft || order.status === OrderStatus.Cancelled ? (
                <button
                  type="button"
                  onClick={onGoToCustomer}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  <span>Place Order in Customer View</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoToKitchen}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-emerald-600 hover:bg-neutral-800 dark:hover:bg-emerald-500 rounded-lg cursor-pointer"
                >
                  <span>Advance Order in Kitchen View</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Assigned Courier · {order.assignedDriver?.plateNumber}
                </div>
                <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {order.assignedDriver?.name} ({order.assignedDriver?.vehicleType})
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {order.status === OrderStatus.Ready && (
                  <button
                    type="button"
                    onClick={onPickUpOrder}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" strokeWidth={1.75} />
                    <span>Pick Up Order</span>
                  </button>
                )}

                {order.status === OrderStatus.InTransit && (
                  <button
                    type="button"
                    onClick={onConfirmDelivery}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                    <span>Confirm Delivery</span>
                  </button>
                )}

                {order.status === OrderStatus.Delivered && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={1.75}
                    />
                    <span>Delivery Completed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Delivery Route Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Lagos Dispatch Corridor
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {progressPct}% Route Complete
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {order.deliveryMilestones.map((ms, i) => (
                  <div
                    key={ms.id}
                    className={`p-3.5 rounded-xl border ${
                      ms.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                        Stop 0{i + 1}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {ms.timestamp ?? 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          ms.completed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                        strokeWidth={1.75}
                      />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {ms.label}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {ms.location}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
