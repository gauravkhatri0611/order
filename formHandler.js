// formHandler.js
import {
  OrderItem,
  addOrderItem,
  getOrderItems,
  clearOrderItems,
} from "./order.js";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateItem,
  validateQuantity,
  validatePrice,
  clearFieldError,
  clearErrors,
} from "./validation.js";
import { setCookie, deleteCookie } from "./storage.js";
import {
  renderOrderSummary,
  displayFinalSummary,
  showToast,
} from "./display.js";

/* This module exports a single function to wire up event handlers
   and exposes the core handlers internally. */

export const setupFormHandlers = () => {
  // Focus first field
  const nameEl = document.querySelector("#customerName");
  if (nameEl) nameEl.focus();

  // Attach handlers
  const form = document.querySelector("#customerDetails");
  if (form) form.addEventListener("submit", handleOrder);

  const clearBtn = document.querySelector("#clearBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearAll);

  const addItemBtn = document.querySelector("#addItemBtn");
  if (addItemBtn) addItemBtn.addEventListener("click", handleAddItem);

  // Inline validation clearing
  document
    .querySelectorAll("input")
    .forEach((input) =>
      input.addEventListener("input", () => clearFieldError(input))
    );

  // Restrict phone input to digits
  const phoneInput = document.querySelector("#customerPhone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }

  // Remember Me dynamic saving
  const rememberBox = document.querySelector("#rememberMe");
  const emailInput = document.querySelector("#customerEmail");
  const phoneInput2 = document.querySelector("#customerPhone");
  if (rememberBox) {
    rememberBox.addEventListener("change", () => {
      try {
        if (rememberBox.checked) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem(
            "customerName",
            nameEl ? nameEl.value.trim() : ""
          );
          localStorage.setItem(
            "customerEmail",
            emailInput ? emailInput.value.trim() : ""
          );
          localStorage.setItem(
            "customerPhone",
            phoneInput2 ? phoneInput2.value.trim() : ""
          );
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("customerName");
          localStorage.removeItem("customerEmail");
          localStorage.removeItem("customerPhone");
        }
      } catch (e) {
        console.warn("localStorage not available:", e);
      }
    });

    // Auto-save while checked
    [nameEl, emailInput, phoneInput2].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        try {
          if (rememberBox.checked) {
            localStorage.setItem(el.id, el.value.trim());
          }
        } catch (e) {
          console.warn("localStorage set failed:", e);
        }
      });
    });
  }

  // Render any existing items (if saved by cookie loader)
  renderOrderSummary();
};

/* -------- handlers -------- */
export function handleAddItem(e) {
  try {
    clearErrors();

    const itemEl = document.querySelector("#itemName");
    const qtyEl = document.querySelector("#quantity");
    const priceEl = document.querySelector("#price");

    let valid = true;
    if (!validateItem(itemEl)) valid = false;
    if (!validateQuantity(qtyEl)) valid = false;
    if (!validatePrice(priceEl)) valid = false;
    if (!valid) return;

    let newItem;
    try {
      newItem = new OrderItem(itemEl.value.trim(), qtyEl.value, priceEl.value);
    } catch (err) {
      const msg = err.message || "Invalid item";
      if (itemEl) itemEl.classList.add("invalid");
      const container = itemEl ? itemEl.closest(".form-group") : null;
      const span = container ? container.querySelector(".error-message") : null;
      if (span) span.textContent = msg;
      return;
    }

    addOrderItem(newItem);

    // Clear product input fields
    itemEl.value = "";
    qtyEl.value = "";
    priceEl.value = "";

    renderOrderSummary();
    itemEl.focus();
  } catch (error) {
    console.error("Failed to add item:", error);
    showToast("Could not add item. See console for details.");
  }
}

export function handleOrder(e) {
  e.preventDefault();
  clearErrors();

  const nameEl = document.querySelector("#customerName");
  const emailEl = document.querySelector("#customerEmail");
  const phoneEl = document.querySelector("#customerPhone");
  const itemEl = document.querySelector("#itemName");
  const qtyEl = document.querySelector("#quantity");
  const priceEl = document.querySelector("#price");

  let valid = true;

  if (!validateName(nameEl)) valid = false;
  if (!validateEmail(emailEl)) valid = false;
  if (!validatePhone(phoneEl)) valid = false;

  if (getOrderItems().length === 0) {
    if (!validateItem(itemEl)) valid = false;
    if (!validateQuantity(qtyEl)) valid = false;
    if (!validatePrice(priceEl)) valid = false;
  }

  if (!valid) return;

  if (getOrderItems().length === 0) {
    try {
      const newItem = new OrderItem(
        itemEl.value.trim(),
        qtyEl.value,
        priceEl.value
      );
      addOrderItem(newItem);
      itemEl.value = "";
      qtyEl.value = "";
      priceEl.value = "";
    } catch (err) {
      const container = itemEl ? itemEl.closest(".form-group") : null;
      const span = container ? container.querySelector(".error-message") : null;
      if (span) span.textContent = err.message || "Invalid product details";
      return;
    }
  }

  if (getOrderItems().length === 0) {
    const container = itemEl ? itemEl.closest(".form-group") : null;
    const span = container ? container.querySelector(".error-message") : null;
    if (span) span.textContent = "Add at least one item before finalizing";
    return;
  }

  // update UI
  renderOrderSummary();
  displayFinalSummary(nameEl);

  // Save order cookies if selected
  try {
    if (document.querySelector("#saveOrder").checked) {
      setCookie("saveOrder", "true", 7);
      const plainOrderArray = getOrderItems().map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      setCookie("orderItems", JSON.stringify(plainOrderArray), 7);
    } else {
      deleteCookie("saveOrder");
      deleteCookie("orderItems");
    }
  } catch (cookieError) {
    console.warn("Could not save cookies:", cookieError);
  }

  // Scroll to summary
  const summaryCard = document.querySelector("#summaryCard");
  if (summaryCard) summaryCard.scrollIntoView({ behavior: "smooth" });
}

export function clearAll() {
  // Clear all form fields
  const fields = [
    "#customerName",
    "#customerEmail",
    "#customerPhone",
    "#itemName",
    "#quantity",
    "#price",
  ];
  fields.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });

  const saveEl = document.querySelector("#saveOrder");
  if (saveEl) saveEl.checked = false;
  const remEl = document.querySelector("#rememberMe");
  if (remEl) remEl.checked = false;

  // Clear displayed errors and summary
  clearErrors();
  const cust = document.querySelector("#summaryCustomer");
  if (cust) cust.textContent = "";
  const itemsUl = document.querySelector("#orderItems");
  if (itemsUl) itemsUl.innerHTML = "";
  document.querySelector("#orderSubtotal").textContent = "0.00";
  document.querySelector("#orderTax").textContent = "0.00";
  document.querySelector("#orderTotal").textContent = "0.00";
  const summaryCard = document.querySelector("#summaryCard");
  if (summaryCard) summaryCard.classList.add("hidden");

  // Empty the order items storage
  clearOrderItems();

  // Remove cookies
  deleteCookie("saveOrder");
  deleteCookie("orderItems");

  // Remove localStorage data
  try {
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("customerName");
    localStorage.removeItem("customerEmail");
    localStorage.removeItem("customerPhone");
  } catch (e) {
    console.warn("localStorage removal failed:", e);
  }

  showToast("All data, cookies, and saved preferences have been cleared!");
}
