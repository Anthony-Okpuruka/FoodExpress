import { ChevronRight, Layers, Terminal } from 'lucide-react';
import { Order } from '../domain/Order';
import { GatewayAttributeSnapshot } from '../domain/PaymentGateway';
import { formatNaira } from '../domain/seedData';
import { MethodLogEntry, OrderStatus } from '../domain/types';

interface OoadInspectorProps {
  order: Order;
  previewGateway: GatewayAttributeSnapshot;
  methodLogs: MethodLogEntry[];
}

const STATE_NODES: OrderStatus[] = [
  OrderStatus.Placed,
  OrderStatus.Accepted,
  OrderStatus.Preparing,
  OrderStatus.Ready,
  OrderStatus.InTransit,
  OrderStatus.Delivered,
];

export function OoadInspector({
  order,
  previewGateway,
  methodLogs,
}: OoadInspectorProps) {
  const activeGateway = order.paymentGateway?.inspectAttributes() ?? previewGateway;
  const orderItems = order.getItems();
  const menuItems = order.restaurant.getMenuItems();

  return (
    <aside
      aria-label="Live OOAD and UML Inspector"
      className="bg-[#0B0B0C] text-neutral-100 border border-neutral-800 rounded-xl p-5 font-sans text-xs space-y-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto inspector-scroll"
    >
      {/* Inspector Header */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Live Domain &amp; UML Inspector
          </h2>
        </div>
        <span className="text-[11px] text-neutral-400 tabular-nums">
          {order.orderId}
        </span>
      </div>

      {/* 1. State Machine Badge Tracker */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300">
            State Machine Tracker
          </span>
          <span
            className={`text-[11px] font-semibold ${
              order.status === OrderStatus.Refunded || order.status === OrderStatus.Cancelled
                ? 'text-rose-400'
                : order.status === OrderStatus.Delivered
                  ? 'text-emerald-400'
                  : 'text-sky-400'
            }`}
          >
            status = {order.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATE_NODES.map((node, idx) => {
            const isCurrent = order.status === node;
            const currentIdx = STATE_NODES.indexOf(order.status);
            const isPassed = currentIdx > idx;

            return (
              <div key={node} className="flex items-center gap-1">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-semibold'
                      : isPassed
                        ? 'bg-black/60 text-emerald-400 border-neutral-700'
                        : 'bg-black/40 text-neutral-500 border-neutral-800'
                  }`}
                >
                  {node}
                </span>
                {idx < STATE_NODES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-neutral-600" strokeWidth={1.75} />
                )}
              </div>
            );
          })}
          {(order.status === OrderStatus.Refunded ||
            order.status === OrderStatus.Cancelled ||
            order.status === OrderStatus.Draft) && (
            <span
              className={`px-2 py-0.5 rounded text-[11px] border ml-1 ${
                order.status === OrderStatus.Draft
                  ? 'bg-black text-neutral-300 border-neutral-700'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-semibold'
              }`}
            >
              {order.status}
            </span>
          )}
        </div>
      </div>

      {/* 2. Active Payment Subclass Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-neutral-400">
              Active PaymentGateway Subclass
            </div>
            <div className="text-sky-400 font-semibold text-xs mt-0.5">
              {activeGateway.className}
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
              activeGateway.baseAttributes.status === 'DECLINED' ||
              activeGateway.baseAttributes.status === 'REFUNDED'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                : activeGateway.baseAttributes.status === 'SETTLED' ||
                    activeGateway.baseAttributes.status === 'PRE_AUTHORIZED'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-black text-neutral-300 border-neutral-700'
            }`}
          >
            {activeGateway.baseAttributes.status}
          </span>
        </div>

        <div className="bg-black/70 border border-neutral-800 rounded-lg p-2.5 space-y-1 text-[11px] leading-relaxed">
          <div className="flex justify-between gap-2 text-neutral-400">
            <span className="text-neutral-500">- transactionId:</span>
            <span className="text-neutral-200 tabular-nums">
              {activeGateway.baseAttributes.transactionId}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-neutral-400">
            <span className="text-neutral-500">- amount:</span>
            <span className="text-emerald-300 font-medium tabular-nums">
              {formatNaira(
                order.paymentGateway
                  ? activeGateway.baseAttributes.amount
                  : order.getTotal(),
              )}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-neutral-400">
            <span className="text-neutral-500">- timeStamp:</span>
            <span className="text-neutral-300 truncate tabular-nums">
              {activeGateway.baseAttributes.timeStamp.slice(11, 19)}Z
            </span>
          </div>

          <div className="pt-1.5 mt-1.5 border-t border-neutral-800 space-y-1">
            {Object.entries(activeGateway.subclassAttributes).map(([key, val]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="text-neutral-500">- {key}:</span>
                <span className="text-sky-300 text-right truncate max-w-[180px] tabular-nums">
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Composition vs. Aggregation Visualizer */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
          <span className="text-[11px] font-semibold text-neutral-300">
            Composition (♦) vs. Aggregation (◇)
          </span>
        </div>

        {/* Composition */}
        <div className="bg-black/70 border border-neutral-800 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-sky-400 font-semibold">
              Order ♦— OrderItem[]
            </span>
            <span
              className={`tabular-nums font-medium ${
                orderItems.length === 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {orderItems.length} instance{orderItems.length === 1 ? '' : 's'}
            </span>
          </div>
          {orderItems.length === 0 ? (
            <div className="text-[11px] text-rose-300/90">
              [] — Child OrderItem instances destroyed / empty
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {orderItems.map((oi) => (
                <span
                  key={oi.orderItemId}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200 tabular-nums"
                >
                  {oi.orderItemId} ({oi.quantity}× {oi.menuItem.id})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Aggregation */}
        <div className="bg-black/70 border border-neutral-800 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-sky-400 font-semibold">
              Restaurant ◇— MenuItem[]
            </span>
            <span className="text-emerald-400 font-medium tabular-nums">
              {menuItems.length} persistent
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {menuItems.map((mi) => (
              <span
                key={mi.id}
                className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 tabular-nums"
              >
                {mi.id}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Polymorphic Method Execution Log */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300">
            Polymorphic Method Execution Log
          </span>
          <span className="text-[11px] text-neutral-400 tabular-nums">
            {methodLogs.length} calls
          </span>
        </div>

        <div className="bg-black/80 border border-neutral-800 rounded-lg p-2.5 max-h-56 overflow-y-auto inspector-scroll space-y-2">
          {methodLogs.map((entry) => (
            <div
              key={entry.id}
              className="animate-log-entry text-[11px] leading-snug border-b border-neutral-800/80 pb-1.5 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-500 tabular-nums">
                <span>{entry.timestamp}</span>
                <span className="text-sky-400 font-medium">{entry.className}</span>
              </div>
              <div className="mt-0.5 break-all">
                <span className="text-neutral-500">&gt; </span>
                <span className="text-sky-300">{entry.methodSignature}</span>
                <span className="text-neutral-500"> -&gt; </span>
                <span
                  className={
                    entry.outcome === 'error'
                      ? 'text-rose-400 font-semibold'
                      : entry.outcome === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : 'text-neutral-300'
                  }
                >
                  {entry.returnValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
