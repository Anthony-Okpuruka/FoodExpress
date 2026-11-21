import { DispatchDriver } from './Dispatch';
import { MenuItem, Restaurant } from './Menu';
import { AVAILABLE_MODIFIERS, Order } from './Order';
import { DriverStatus, PortionSize } from './types';

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function createSampleRestaurant(): Restaurant {
  const menuItems = [
    new MenuItem({
      id: 'MENU-101',
      name: 'Jollof Rice Combo',
      category: 'Signature Mains',
      description: 'Smoky party jollof rice, sweet fried plantain dodo, suya-spiced chicken thigh & slaw.',
      basePrice: 4500,
      prepTimeMins: 18,
      imageUrl: '/src/assets/images/jollof_rice_combo_1795301698249.jpg',
      inStock: true,
    }),
    new MenuItem({
      id: 'MENU-102',
      name: 'Grilled Chicken Platter',
      category: 'Flame Grill',
      description: 'Charcoal-grilled peri-peri half chicken with roasted corn, pepper dip & yam fries.',
      basePrice: 6800,
      prepTimeMins: 22,
      imageUrl: '/src/assets/images/grilled_chicken_platter_1795301697567.jpg',
      inStock: true,
    }),
    new MenuItem({
      id: 'MENU-103',
      name: 'Spicy Beef Shawarma',
      category: 'Wraps & Grill',
      description: 'Toasted flatbread packed with suya beef strips, crisp slaw & garlic pepper sauce.',
      basePrice: 3200,
      prepTimeMins: 12,
      imageUrl: '/src/assets/images/spicy_beef_shawarma_1795301697481.jpg',
      inStock: true,
    }),
    new MenuItem({
      id: 'MENU-104',
      name: 'Chapman Drink',
      category: 'Cold Beverages',
      description: 'Chilled Lagos classic citrus mocktail with cucumber ribbon, lime & aromatic bitters.',
      basePrice: 1500,
      prepTimeMins: 4,
      imageUrl: '/src/assets/images/chapman_drink_1795301698231.jpg',
      inStock: true,
    }),
    new MenuItem({
      id: 'MENU-105',
      name: 'Peppered Suya Skewers',
      category: 'Street Classics',
      description: 'Char-roasted beef skewers coated in toasted yaji peanut spice with red onions & lime.',
      basePrice: 4200,
      prepTimeMins: 14,
      imageUrl: '/src/assets/images/peppered_suya_skewers_1795303267103.jpg',
      inStock: true,
    }),
  ];

  return new Restaurant(
    'REST-VI-01',
    'Lagos Grill & Kitchen',
    'Plot 42 Adeola Odeku St, Victoria Island, Lagos',
    4.8,
    'Modern Nigerian Grill',
    menuItems,
  );
}

export function createSampleDrivers(): DispatchDriver[] {
  return [
    new DispatchDriver({
      driverId: 'DRV-01',
      name: 'Chinedu Okafor',
      vehicleType: 'Yamaha Dispatch Bike',
      plateNumber: 'LND-482-QA',
      distanceKm: 1.2,
      status: DriverStatus.Available,
      rating: 4.9,
      zone: 'Victoria Island',
    }),
    new DispatchDriver({
      driverId: 'DRV-02',
      name: 'Tunde Adebayo',
      vehicleType: 'Bajaj Boxer 150',
      plateNumber: 'EKY-910-MX',
      distanceKm: 2.4,
      status: DriverStatus.Available,
      rating: 4.7,
      zone: 'Lekki Phase 1',
    }),
    new DispatchDriver({
      driverId: 'DRV-03',
      name: 'Emeka Nwosu',
      vehicleType: 'Honda Civic Courier',
      plateNumber: 'APP-204-JK',
      distanceKm: 0.9,
      status: DriverStatus.Busy,
      rating: 4.8,
      zone: 'Victoria Island',
    }),
  ];
}

export function createInitialOrder(restaurant: Restaurant): Order {
  const order = new Order(restaurant, 'ORD-4821');
  const items = restaurant.getMenuItems();

  // Pre-populate realistic basket so the OOAD Inspector shows live Composition right on load
  const jollof = items[0];
  const chapman = items[3];
  const extraProtein = AVAILABLE_MODIFIERS[0];

  if (jollof) {
    order.addItem(jollof, PortionSize.Large, [extraProtein], 1);
  }
  if (chapman) {
    order.addItem(chapman, PortionSize.Regular, [], 1);
  }

  return order;
}
