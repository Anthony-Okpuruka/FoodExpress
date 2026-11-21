import { Code2, Moon, RotateCcw, ShoppingBag, Sun, Truck, UtensilsCrossed } from 'lucide-react';
import { OrderStatus, RoleView } from '../domain/types';
import { BrandLogo } from './BrandLogo';

interface TopNavProps {
  activeRole: RoleView;
  onSelectRole: (role: RoleView) => void;
  onResetDemo: () => void;
  orderStatus: OrderStatus;
  itemCount: number;
  mobileInspectorOpen: boolean;
  onToggleMobileInspector: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const ROLE_TABS: Array<{
  id: RoleView;
  label: string;
  icon: typeof ShoppingBag;
}> = [
  { id: 'customer', label: 'Customer View', icon: ShoppingBag },
  { id: 'kitchen', label: 'Restaurant Kitchen', icon: UtensilsCrossed },
  { id: 'driver', label: 'Dispatch & Driver', icon: Truck },
];

export function TopNav({
  activeRole,
  onSelectRole,
  onResetDemo,
  orderStatus,
  itemCount,
  mobileInspectorOpen,
  onToggleMobileInspector,
  theme,
  onToggleTheme,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="ankara-trim w-full" aria-hidden="true" />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Custom Brand Logo + Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectRole('customer');
          }}
          className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <BrandLogo className="w-8 h-8 shrink-0" />
          <span className="font-display tracking-tight">FoodExpress</span>
        </a>

        {/* Zone 2: Interactive Role Switcher Segmented Control */}
        <nav
          aria-label="Simulation role views"
          className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800 overflow-x-auto"
        >
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectRole(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/60 dark:border-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{tab.label}</span>
                {tab.id === 'customer' && itemCount > 0 && orderStatus === OrderStatus.Draft && (
                  <span className="tabular-nums text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    ({itemCount})
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle & Reset Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center w-9 h-9 text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMobileInspector}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Code2 className="w-4 h-4" strokeWidth={1.75} />
            <span>{mobileInspectorOpen ? 'Hide UML' : 'OOAD UML'}</span>
          </button>

          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-neutral-900 dark:bg-emerald-600 hover:bg-neutral-800 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
