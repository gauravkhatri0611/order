// storage.js
/* Cookie helpers */
export const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie =
    name + "=" + encodeURIComponent(value) + expires + "; path=/";
};

export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

export const deleteCookie = (name) => {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

/* Load preferences (localStorage) and saved order (cookie).
   Exported as displaySavedPreferences to match assignment suggestion. */
import { OrderItem, addOrderItem } from "./order.js"; // OrderItem used to rehydrate saved items

export const displaySavedPreferences = () => {
  try {
    const remember = localStorage.getItem("rememberMe") === "true";
    if (remember) {
      const name = localStorage.getItem("customerName") || "";
      const email = localStorage.getItem("customerEmail") || "";
      const phone = localStorage.getItem("customerPhone") || "";

      const nameEl = document.querySelector("#customerName");
      const emailEl = document.querySelector("#customerEmail");
      const phoneEl = document.querySelector("#customerPhone");
      const rememberBox = document.querySelector("#rememberMe");

      if (nameEl) nameEl.value = name;
      if (emailEl) emailEl.value = email;
      if (phoneEl) phoneEl.value = phone;
      if (rememberBox) rememberBox.checked = true;
    }
  } catch (e) {
    console.warn("Failed to load localStorage preferences:", e);
  }

  // Load order items (array of objects) from cookie
  try {
    if (getCookie("saveOrder") === "true") {
      const itemsJson = getCookie("orderItems");
      if (itemsJson) {
        const savedItems = JSON.parse(itemsJson);
        if (Array.isArray(savedItems)) {
          savedItems.forEach((obj) => {
            try {
              addOrderItem(new OrderItem(obj.name, obj.quantity, obj.price));
            } catch (err) {
              // skip invalid saved item
              console.warn("Invalid saved item skipped:", err);
            }
          });
        }
      }
      const saveBox = document.querySelector("#saveOrder");
      if (saveBox) saveBox.checked = true;
    }
  } catch (e) {
    console.warn("Failed to load cookies:", e);
  }
};

// Save or remove cookie based on current orderItems
export function updateOrderCookies() {
  if (orderItems.length > 0) {
    // Store updated items
    document.cookie = `orderItems=${encodeURIComponent(
      JSON.stringify(orderItems)
    )}; path=/; max-age=${7 * 24 * 60 * 60}`;
  } else {
    // If no items left, remove cookie entirely
    document.cookie =
      "orderItems=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
}
