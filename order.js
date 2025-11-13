// order.js
export const SALES_TAX_RATE = 0.13;

/* Order storage managed via functions to avoid exposing internals */
const orderItems = [];

/* ----------------- OrderItem Class ----------------- */
export class OrderItem {
  constructor(name, quantity, price) {
    this._name = "";
    this._quantity = 0;
    this._price = 0.0;

    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }

  get name() {
    return this._name;
  }
  get quantity() {
    return this._quantity;
  }
  get price() {
    return this._price;
  }

  set name(val) {
    const v = String(val || "").trim();
    if (!v) throw new Error("Item name is required");
    if (v.length < 2 || v.length > 50)
      throw new Error("Item name must be 2–50 characters");
    this._name = v;
  }

  set quantity(val) {
    const q = parseInt(val, 10);
    if (isNaN(q) || q <= 0)
      throw new Error("Quantity must be a positive integer");
    if (q > 1000) throw new Error("Quantity too large");
    this._quantity = q;
  }

  set price(val) {
    const p = parseFloat(val);
    if (isNaN(p) || p <= 0) throw new Error("Price must be a positive number");
    this._price = parseFloat(p.toFixed(2));
  }

  getLineTotal() {
    const subtotal = this._quantity * this._price;
    return parseFloat(subtotal.toFixed(2));
  }
}

/* Public API to manipulate order items */
export const addOrderItem = (item) => {
  orderItems.push(item);
};

export const removeOrderItem = (index) => {
  if (index >= 0 && index < orderItems.length) {
    orderItems.splice(index, 1);
  }
};

export const clearOrderItems = () => {
  orderItems.length = 0;
};

export const getOrderItems = () => {
  // return a shallow copy to avoid accidental external mutation
  return orderItems.slice();
};

export const calculateTotals = () => {
  const subtotal = orderItems.reduce((acc, it) => acc + it.getLineTotal(), 0);
  const tax = parseFloat((subtotal * SALES_TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));
  return { subtotal, tax, total };
};
