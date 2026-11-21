export interface MenuItemProps {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  prepTimeMins: number;
  imageUrl: string;
  inStock?: boolean;
}

/**
 * Independent Entity: MenuItem
 * Lifecycle is independent of Order and OrderItem.
 * Even when an Order is cancelled or destroyed, MenuItem instances persist inside Restaurant.
 */
export class MenuItem {
  public readonly id: string;
  public readonly name: string;
  public readonly category: string;
  public readonly description: string;
  public readonly basePrice: number;
  public readonly prepTimeMins: number;
  public readonly imageUrl: string;
  public inStock: boolean;

  constructor(props: MenuItemProps) {
    this.id = props.id;
    this.name = props.name;
    this.category = props.category;
    this.description = props.description;
    this.basePrice = props.basePrice;
    this.prepTimeMins = props.prepTimeMins;
    this.imageUrl = props.imageUrl;
    this.inStock = props.inStock ?? true;
  }
}

/**
 * Aggregate Container: Restaurant (Hollow Diamond ◇ Aggregation)
 * Holds references to independent MenuItem objects.
 */
export class Restaurant {
  public readonly id: string;
  public readonly name: string;
  public readonly address: string;
  public readonly rating: number;
  public readonly cuisine: string;
  private menuItems: MenuItem[];

  constructor(
    id: string,
    name: string,
    address: string,
    rating: number,
    cuisine: string,
    menuItems: MenuItem[],
  ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.rating = rating;
    this.cuisine = cuisine;
    this.menuItems = menuItems;
  }

  public getMenuItems(): ReadonlyArray<MenuItem> {
    return this.menuItems;
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    return this.menuItems.find((item) => item.id === id);
  }
}
