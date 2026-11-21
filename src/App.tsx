import { useEffect, useMemo, useRef, useState } from 'react';
import { CustomerView, PaymentCheckoutFormState } from './components/CustomerView';
import { DriverView } from './components/DriverView';
import { KitchenView } from './components/KitchenView';
import { OoadInspector } from './components/OoadInspector';
import { OrderStepper } from './components/OrderStepper';
import { TopNav } from './components/TopNav';
import { DispatchDriver, DispatchHeuristic, HeuristicCandidate } from './domain/Dispatch';
import { MenuItem, Restaurant } from './domain/Menu';
import { Order } from './domain/Order';
import {
  CreditCardPayment,
  GatewayAttributeSnapshot,
  MobileMoneyPayment,
  PaymentGateway,
  PlatformWalletPayment,
} from './domain/PaymentGateway';
import {
  createInitialOrder,
  createSampleDrivers,
  createSampleRestaurant,
} from './domain/seedData';
import { OrderHistoryRepository } from './domain/orderHistoryRepository';
import {
  DriverStatus,
  MethodLogEntry,
  MobileNetwork,
  ModifierOption,
  OrderStatus,
  PaymentMethodType,
  PortionSize,
  RoleView,
} from './domain/types';

function createInitialFormState(): PaymentCheckoutFormState {
  return {
    selectedMethod: PaymentMethodType.CreditCard,
    simulateDecline: false,
    cardNumber: '4532 8910 3341 8842',
    cardholderName: 'Adebayo Ogunlesi',
    expiry: '08/28',
    cvv: '742',
    msisdn: '+234 803 456 7890',
    networkProvider: MobileNetwork.MTN,
    ussdPromptSent: false,
    ussdApproved: false,
    walletBalance: 25000,
  };
}

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function createSeedLogs(order: Order): MethodLogEntry[] {
  return [
    {
      id: 'log-seed-1',
      timestamp: nowTimeLabel(),
      instanceName: 'restaurant',
      className: 'Restaurant',
      methodSignature: `new Restaurant("${order.restaurant.name}", menuItems[5])`,
      returnValue: '5 MenuItem aggregates loaded',
      outcome: 'info',
    },
    {
      id: 'log-seed-2',
      timestamp: nowTimeLabel(),
      instanceName: 'order',
      className: 'Order',
      methodSignature: `order.addItem(MENU-101, Large, [Extra Protein], 1)`,
      returnValue: `${order.getItems()[0]?.orderItemId ?? 'OI-1'} composed`,
      outcome: 'success',
    },
    {
      id: 'log-seed-3',
      timestamp: nowTimeLabel(),
      instanceName: 'order',
      className: 'Order',
      methodSignature: `order.addItem(MENU-104, Regular, [], 1)`,
      returnValue: `${order.getItems()[1]?.orderItemId ?? 'OI-2'} composed`,
      outcome: 'success',
    },
  ];
}

export default function App() {
  const restaurantRef = useRef<Restaurant>(createSampleRestaurant());
  const orderRef = useRef<Order>(createInitialOrder(restaurantRef.current));
  const driversRef = useRef<DispatchDriver[]>(createSampleDrivers());

  const [, setVersion] = useState<number>(0);
  const bump = () => setVersion((v) => v + 1);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('foodexpress-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('foodexpress-theme', theme);
  }, [theme]);

  const [activeRole, setActiveRole] = useState<RoleView>('customer');
  const [checkoutForm, setCheckoutForm] = useState<PaymentCheckoutFormState>(
    createInitialFormState,
  );
  const [lastCheckoutError, setLastCheckoutError] = useState<string | null>(null);
  const [heuristicResults, setHeuristicResults] = useState<HeuristicCandidate[]>([]);
  const [methodLogs, setMethodLogs] = useState<MethodLogEntry[]>(() =>
    createSeedLogs(orderRef.current),
  );
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState<boolean>(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);

  const persistActiveOrder = (order: Order) => {
    OrderHistoryRepository.upsertFromOrder(order);
    setHistoryRefreshKey((k) => k + 1);
  };

  const appendLog = (
    instanceName: string,
    className: string,
    methodSignature: string,
    returnValue: string,
    outcome: 'success' | 'error' | 'info',
  ) => {
    setMethodLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowTimeLabel(),
        instanceName,
        className,
        methodSignature,
        returnValue,
        outcome,
      },
      ...prev,
    ]);
  };

  const instantiateGatewayFromForm = (
    form: PaymentCheckoutFormState,
  ): PaymentGateway => {
    switch (form.selectedMethod) {
      case PaymentMethodType.CreditCard:
        return new CreditCardPayment({
          cardNumber: form.cardNumber,
          cardholderName: form.cardholderName,
          expiry: form.expiry,
          cvv: form.cvv,
          simulateDecline: form.simulateDecline,
        });
      case PaymentMethodType.MobileMoney:
        return new MobileMoneyPayment({
          msisdn: form.msisdn,
          networkProvider: form.networkProvider,
          ussdApproved: form.ussdApproved,
          simulateDecline: form.simulateDecline,
        });
      case PaymentMethodType.PlatformWallet:
        return new PlatformWalletPayment({
          walletId: 'WLT-NG-9042',
          walletBalance: form.walletBalance,
          simulateDecline: form.simulateDecline,
        });
    }
  };

  const previewGateway: GatewayAttributeSnapshot = useMemo(() => {
    return instantiateGatewayFromForm(checkoutForm).inspectAttributes();
  }, [checkoutForm]);

  const handleUpdateCheckoutForm = (patch: Partial<PaymentCheckoutFormState>) => {
    setLastCheckoutError(null);
    setCheckoutForm((prev) => ({ ...prev, ...patch }));
  };

  const handleAddItemToOrder = (
    menuItem: MenuItem,
    portion: PortionSize,
    modifiers: ModifierOption[],
    quantity: number,
  ) => {
    const created = orderRef.current.addItem(menuItem, portion, modifiers, quantity);
    appendLog(
      'order',
      'Order',
      `order.addItem(${menuItem.id}, ${portion}, [${modifiers.length} mods], ${quantity})`,
      `${created.orderItemId} created`,
      'success',
    );
    bump();
  };

  const handleUpdateItemQty = (orderItemId: string, delta: number) => {
    orderRef.current.updateItemQuantity(orderItemId, delta);
    appendLog(
      'order',
      'Order',
      `order.updateItemQuantity("${orderItemId}", ${delta > 0 ? `+${delta}` : delta})`,
      'recalculated',
      'info',
    );
    bump();
  };

  const handleRemoveItem = (orderItemId: string) => {
    orderRef.current.removeItem(orderItemId);
    appendLog(
      'order',
      'Order',
      `order.removeItem("${orderItemId}")`,
      'OrderItem destroyed',
      'info',
    );
    bump();
  };

  const handleCancelAndDestroyItems = () => {
    const destroyedCount = orderRef.current.destroyAllComposedItems();
    appendLog(
      'order',
      'Order',
      `order.destroyAllComposedItems()`,
      `${destroyedCount} OrderItem(s) destroyed; 5 MenuItems intact`,
      'error',
    );
    bump();
  };

  const handleApplyPromoCode = (code: string) => {
    const result = orderRef.current.applyPromoCode(code);
    appendLog(
      'order',
      'Order',
      `order.applyPromoCode("${code.trim().toUpperCase()}")`,
      result.valid ? `true (${Math.round(result.rate * 100)}% discount)` : 'false (invalid)',
      result.valid ? 'success' : 'error',
    );
    bump();
    return result;
  };

  const handleSendUssdPrompt = () => {
    const gw = new MobileMoneyPayment({
      msisdn: checkoutForm.msisdn,
      networkProvider: checkoutForm.networkProvider,
      ussdApproved: false,
    });
    const session = gw.sendUSSDPrompt();
    setCheckoutForm((prev) => ({
      ...prev,
      ussdPromptSent: true,
      ussdApproved: false,
    }));
    appendLog(
      'mobileMoneyPayment',
      'MobileMoneyPayment',
      `mobileMoneyPayment.sendUSSDPrompt()`,
      `session ${session} pushed`,
      'info',
    );
  };

  const handleApproveUssdPrompt = () => {
    setCheckoutForm((prev) => ({ ...prev, ussdApproved: true }));
    appendLog(
      'mobileMoneyPayment',
      'MobileMoneyPayment',
      `customer.approveUSSDPin("${checkoutForm.networkProvider}")`,
      'true (PIN verified)',
      'success',
    );
  };

  const handleTopUpWallet = (amount: number) => {
    setCheckoutForm((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance + amount,
    }));
    appendLog(
      'platformWalletPayment',
      'PlatformWalletPayment',
      `platformWalletPayment.topUp(${amount.toFixed(2)})`,
      `₦${(checkoutForm.walletBalance + amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
      })}`,
      'success',
    );
  };

  const handleAuthorizeAndPlaceOrder = () => {
    const order = orderRef.current;
    const total = order.getTotal();
    if (total <= 0) return;

    const gateway = instantiateGatewayFromForm(checkoutForm);

    if (gateway instanceof CreditCardPayment) {
      const validToken = gateway.validateCardToken();
      appendLog(
        'creditCardPayment',
        'CreditCardPayment',
        `creditCardPayment.validateCardToken()`,
        String(validToken),
        validToken ? 'success' : 'error',
      );
    } else if (gateway instanceof PlatformWalletPayment) {
      const enough = gateway.verifyBalance(total);
      appendLog(
        'platformWalletPayment',
        'PlatformWalletPayment',
        `platformWalletPayment.verifyBalance(${total.toFixed(2)})`,
        String(enough),
        enough ? 'success' : 'error',
      );
    }

    const authResult = gateway.authorizePayment(total);
    appendLog(
      gateway.getInstanceName(),
      gateway.getClassName(),
      authResult.methodCall,
      authResult.returnLabel,
      authResult.success ? 'success' : 'error',
    );

    if (!authResult.success) {
      setLastCheckoutError(authResult.message);
      bump();
      return;
    }

    setLastCheckoutError(null);
    order.paymentGateway = gateway;

    if (gateway instanceof PlatformWalletPayment) {
      setCheckoutForm((prev) => ({
        ...prev,
        walletBalance: gateway.getWalletBalance(),
      }));
    }

    order.transitionTo(
      OrderStatus.Placed,
      `Authorized via ${gateway.getClassName()} (${authResult.transactionId})`,
    );
    persistActiveOrder(order);
    appendLog(
      'order',
      'Order',
      `order.transitionTo("Placed")`,
      `Order ${order.orderId} -> Placed`,
      'success',
    );
    bump();
  };

  const handleAcceptOrder = () => {
    const order = orderRef.current;
    const gw = order.paymentGateway;
    if (!gw || order.status !== OrderStatus.Placed) return;

    const res = gw.processSettlement(gw.getTransactionId());
    appendLog(
      gw.getInstanceName(),
      gw.getClassName(),
      res.methodCall,
      res.returnLabel,
      'success',
    );

    order.transitionTo(OrderStatus.Accepted, 'Kitchen accepted order & settled payment');
    persistActiveOrder(order);
    appendLog(
      'order',
      'Order',
      `order.transitionTo("Accepted")`,
      'Accepted',
      'success',
    );
    bump();
  };

  const handleStartPreparing = () => {
    const order = orderRef.current;
    if (order.transitionTo(OrderStatus.Preparing, 'Kitchen fired prep line')) {
      persistActiveOrder(order);
      appendLog(
        'order',
        'Order',
        `order.transitionTo("Preparing")`,
        'Preparing',
        'info',
      );
      bump();
    }
  };

  const handleMarkReady = () => {
    const order = orderRef.current;
    if (!order.transitionTo(OrderStatus.Ready, 'Kitchen marked order ready for pickup')) {
      return;
    }
    appendLog('order', 'Order', `order.transitionTo("Ready")`, 'Ready', 'success');

    const match = DispatchHeuristic.evaluateAndAssign(driversRef.current);
    setHeuristicResults(match.candidates);
    order.assignedDriver = match.assignedDriver;
    persistActiveOrder(order);

    appendLog(
      'dispatchHeuristic',
      'DispatchHeuristic',
      `DispatchHeuristic.evaluateAndAssign(drivers[3])`,
      match.assignedDriver
        ? `assigned ${match.assignedDriver.driverId} (${match.assignedDriver.distanceKm} km)`
        : 'none available',
      match.assignedDriver ? 'success' : 'error',
    );
    bump();
  };

  const handleDeclineAndRefund = () => {
    const order = orderRef.current;
    const gw = order.paymentGateway;
    if (!gw) return;

    const total = order.getTotal();
    const refundRes = gw.issueRefund(gw.getTransactionId(), total);
    appendLog(
      gw.getInstanceName(),
      gw.getClassName(),
      refundRes.methodCall,
      refundRes.returnLabel,
      'error',
    );

    if (gw instanceof PlatformWalletPayment) {
      setCheckoutForm((prev) => ({
        ...prev,
        walletBalance: gw.getWalletBalance(),
      }));
    }

    order.transitionTo(OrderStatus.Refunded, 'Kitchen declined / out of stock');
    persistActiveOrder(order);
    appendLog(
      'order',
      'Order',
      `order.transitionTo("Refunded")`,
      'Refunded',
      'error',
    );
    bump();
  };

  const handlePickUpOrder = () => {
    const order = orderRef.current;
    if (order.assignedDriver) {
      order.assignedDriver.status = DriverStatus.InTransit;
    }
    if (order.transitionTo(OrderStatus.InTransit, 'Courier picked up order from kitchen')) {
      persistActiveOrder(order);
      appendLog(
        'order',
        'Order',
        `order.transitionTo("InTransit")`,
        'InTransit',
        'info',
      );
      bump();
    }
  };

  const handleConfirmDelivery = () => {
    const order = orderRef.current;
    if (order.assignedDriver) {
      order.assignedDriver.status = DriverStatus.Available;
    }
    if (order.transitionTo(OrderStatus.Delivered, 'Customer confirmed order delivery')) {
      persistActiveOrder(order);
      appendLog(
        'order',
        'Order',
        `order.transitionTo("Delivered")`,
        'Delivered',
        'success',
      );
      bump();
    }
  };

  const handleResetDemo = () => {
    restaurantRef.current = createSampleRestaurant();
    orderRef.current = createInitialOrder(restaurantRef.current);
    driversRef.current = createSampleDrivers();
    OrderHistoryRepository.resetToSeed();
    setHistoryRefreshKey((k) => k + 1);
    setCheckoutForm(createInitialFormState());
    setLastCheckoutError(null);
    setHeuristicResults([]);
    setActiveRole('customer');
    setMethodLogs(createSeedLogs(orderRef.current));
    bump();
  };

  const order = orderRef.current;

  return (
    <div
      id="top"
      className="min-h-screen ankara-canvas text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-200"
    >
      <TopNav
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        onResetDemo={handleResetDemo}
        orderStatus={order.status}
        itemCount={order.getItems().length}
        mobileInspectorOpen={mobileInspectorOpen}
        onToggleMobileInspector={() => setMobileInspectorOpen((prev) => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane (65% -> ~8 cols on 12-col grid): Interactive User Workflows */}
          <div className="lg:col-span-8 space-y-6">
            <OrderStepper status={order.status} orderId={order.orderId} />

            {activeRole === 'customer' && (
              <CustomerView
                restaurant={restaurantRef.current}
                order={order}
                checkoutForm={checkoutForm}
                lastCheckoutError={lastCheckoutError}
                onUpdateCheckoutForm={handleUpdateCheckoutForm}
                onAddItemToOrder={handleAddItemToOrder}
                onUpdateItemQty={handleUpdateItemQty}
                onRemoveItem={handleRemoveItem}
                onCancelAndDestroyItems={handleCancelAndDestroyItems}
                onApplyPromoCode={handleApplyPromoCode}
                onSendUssdPrompt={handleSendUssdPrompt}
                onApproveUssdPrompt={handleApproveUssdPrompt}
                onTopUpWallet={handleTopUpWallet}
                onAuthorizeAndPlaceOrder={handleAuthorizeAndPlaceOrder}
                onGoToKitchen={() => setActiveRole('kitchen')}
                historyRefreshKey={historyRefreshKey}
                onLogHistoryFetch={(count) =>
                  appendLog(
                    'orderHistoryRepository',
                    'OrderHistoryRepository',
                    `OrderHistoryRepository.fetchAll()`,
                    `${count} historical record(s) loaded`,
                    'info',
                  )
                }
              />
            )}

            {activeRole === 'kitchen' && (
              <KitchenView
                order={order}
                onAcceptOrder={handleAcceptOrder}
                onStartPreparing={handleStartPreparing}
                onMarkReady={handleMarkReady}
                onDeclineAndRefund={handleDeclineAndRefund}
                onGoToCustomer={() => setActiveRole('customer')}
                onGoToDriver={() => setActiveRole('driver')}
              />
            )}

            {activeRole === 'driver' && (
              <DriverView
                order={order}
                drivers={driversRef.current}
                heuristicResults={heuristicResults}
                onPickUpOrder={handlePickUpOrder}
                onConfirmDelivery={handleConfirmDelivery}
                onGoToKitchen={() => setActiveRole('kitchen')}
                onGoToCustomer={() => setActiveRole('customer')}
              />
            )}
          </div>

          {/* Right Pane (35% -> ~4 cols on 12-col grid): Sticky Dark-Mode OOAD Inspector */}
          <div
            className={`lg:col-span-4 ${
              mobileInspectorOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <OoadInspector
              order={order}
              previewGateway={previewGateway}
              methodLogs={methodLogs}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
