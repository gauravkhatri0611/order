// Sales tax constant
const SALES_TAX_RATE = 0.13;

// Array to hold OrderItem objects
const orderItems = [];

/* ----------------- OrderItem Class ----------------- */
class OrderItem {
  constructor(name, quantity, price) {
    this._name = "";
    this._quantity = 0;
    this._price = 0.0;

    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }

  // getters
  get name() {
    return this._name;
  }
  get quantity() {
    return this._quantity;
  }
  get price() {
    return this._price;
  }

  // setters with basic validation (throws on invalid values)
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

  // method to calculate subtotal for this item
  getLineTotal() {
    // Work with numbers precisely enough for display (fixed to 2 decimals)
    const subtotal = this._quantity * this._price;
    return parseFloat(subtotal.toFixed(2));
  }
}

/* ----------------- DOM Ready ----------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Focus
  document.querySelector("#customerName").focus();

  // Attach handlers
  document
    .querySelector("#customerDetails")
    .addEventListener("submit", handleOrder);
  document.querySelector("#clearBtn").addEventListener("click", clearAll);
  const addItemBtn = document.querySelector("#addItemBtn");
  if (addItemBtn) addItemBtn.addEventListener("click", handleAddItem);

  // Inline validation clearing
  document
    .querySelectorAll("input")
    .forEach((input) =>
      input.addEventListener("input", () => clearFieldError(input))
    );

  // Restrict phone input
  document.querySelector("#customerPhone").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Load saved preferences & any last-saved item cookies
  loadPreferences();
  // --- Remember Me: Save preferences dynamically ---
  const rememberBox = document.querySelector("#rememberMe");
  const nameInput = document.querySelector("#customerName");
  const emailInput = document.querySelector("#customerEmail");
  const phoneInput = document.querySelector("#customerPhone");

  // Save on checkbox toggle
  rememberBox.addEventListener("change", () => {
    if (rememberBox.checked) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("customerName", nameInput.value.trim());
      localStorage.setItem("customerEmail", emailInput.value.trim());
      localStorage.setItem("customerPhone", phoneInput.value.trim());
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("customerName");
      localStorage.removeItem("customerEmail");
      localStorage.removeItem("customerPhone");
    }
  });

  // Auto-save fields while checked
  [nameInput, emailInput, phoneInput].forEach((el) => {
    el.addEventListener("input", () => {
      if (rememberBox.checked) {
        localStorage.setItem(el.id, el.value.trim());
      }
    });
  });

  // Render any items that might have been reloaded (we don't persist orderItems array across page loads)
  renderOrderSummary();
});

/* ----------------- Add Item (Part 1) ----------------- */
function handleAddItem(e) {
  // Add current product inputs into orderItems array after validation
  // Do not submit the form
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

    // Create OrderItem (class handles additional validation)
    let newItem;
    try {
      newItem = new OrderItem(itemEl.value.trim(), qtyEl.value, priceEl.value);
    } catch (err) {
      // Show error on the relevant field(s) if possible
      const msg = err.message || "Invalid item";
      // attempt to attach to item input for message
      showError(itemEl, msg);
      return;
    }

    // Push into array
    orderItems.push(newItem);

    // Clear product input fields (make ready for next item)
    itemEl.value = "";
    qtyEl.value = "";
    priceEl.value = "";

    // Update the UI
    renderOrderSummary();

    // Focus back to item name for quick entry
    itemEl.focus();
  } catch (error) {
    console.error("Failed to add item:", error);
    alert("Could not add item. See console for details.");
  }
}

/* ----------------- Finalize / Submit Order ----------------- */
function handleOrder(e) {
  e.preventDefault();
  clearErrors();

  const nameEl = document.querySelector("#customerName");
  const emailEl = document.querySelector("#customerEmail");
  const phoneEl = document.querySelector("#customerPhone");
  const itemEl = document.querySelector("#itemName");
  const qtyEl = document.querySelector("#quantity");
  const priceEl = document.querySelector("#price");

  let valid = true;

  // Always validate customer fields
  if (!validateName(nameEl)) valid = false;
  if (!validateEmail(emailEl)) valid = false;
  if (!validatePhone(phoneEl)) valid = false;

  // Case 1: If NO items have been added, validate product fields too
  if (orderItems.length === 0) {
    if (!validateItem(itemEl)) valid = false;
    if (!validateQuantity(qtyEl)) valid = false;
    if (!validatePrice(priceEl)) valid = false;
  }

  // Stop if any validation failed
  if (!valid) return;

  // Case 2: If no items added, auto-create one from product fields
  if (orderItems.length === 0) {
    try {
      const newItem = new OrderItem(
        itemEl.value.trim(),
        qtyEl.value,
        priceEl.value
      );
      orderItems.push(newItem);
      itemEl.value = "";
      qtyEl.value = "";
      priceEl.value = "";
    } catch (err) {
      showError(itemEl, err.message || "Invalid product details");
      return;
    }
  }

  // If still no items (edge case)
  if (orderItems.length === 0) {
    showError(itemEl, "Add at least one item before finalizing");
    return;
  }

  // Always render all items correctly before showing summary
  renderOrderSummary();

  // Display final customer summary
  displayFinalSummary(nameEl);

  // Save order cookies if selected
  try {
    if (document.querySelector("#saveOrder").checked) {
      setCookie("saveOrder", "true", 7);
      const plainOrderArray = orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      setCookie("orderItems", JSON.stringify(plainOrderArray), 7);
    } else {
      setCookie("saveOrder", "", -1);
      setCookie("orderItems", "", -1);
    }
  } catch (cookieError) {
    console.warn("Could not save cookies:", cookieError);
  }

  // Scroll smoothly to summary section
  document.querySelector("#summaryCard").scrollIntoView({ behavior: "smooth" });
}

/* ----------------- Summary Rendering ----------------- */
function renderOrderSummary() {
  // Render the list of items from orderItems array and update totals
  const itemsUl = document.querySelector("#orderItems");
  itemsUl.innerHTML = "";

  // If empty hide the card
  if (orderItems.length === 0) {
    document.querySelector("#summaryCard").classList.add("hidden");
    document.querySelector("#summaryCustomer").textContent = "";
    document.querySelector("#orderSubtotal").textContent = "0.00";
    document.querySelector("#orderTax").textContent = "0.00";
    document.querySelector("#orderTotal").textContent = "0.00";
    return;
  }

  // Render each item
  orderItems.forEach((it, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><strong>${escapeHtml(it.name)}</strong> — ${
      it.quantity
    } × $${it.price.toFixed(2)} = $${it.getLineTotal().toFixed(2)}</span>
      <button type="button" class="small remove-item" data-idx="${idx}" title="Remove item">✕</button>
    `;
    itemsUl.appendChild(li);
  });

  // Attach remove handlers (delegation would also work; this is fine for small lists)
  document.querySelectorAll(".remove-item").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
      if (!isNaN(idx)) {
        orderItems.splice(idx, 1);
        renderOrderSummary();
      }
    })
  );

  // Calculate totals
  const subtotal = orderItems.reduce((acc, it) => acc + it.getLineTotal(), 0);
  const tax = parseFloat((subtotal * SALES_TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  // Update UI
  document.querySelector("#orderSubtotal").textContent = subtotal.toFixed(2);
  document.querySelector("#orderTax").textContent = tax.toFixed(2);
  document.querySelector("#orderTotal").textContent = total.toFixed(2);

  // Show the summary card (customer info might be empty until finalize)
  document.querySelector("#summaryCard").classList.remove("hidden");
}

/* ----------------- Display Final Summary (customer + items) ----------------- */
function displayFinalSummary(nameEl) {
  // Show customer name + timestamp
  document.querySelector(
    "#summaryCustomer"
  ).innerHTML = `Order for <strong>${escapeHtml(
    nameEl.value.trim()
  )}</strong> on ${new Date().toLocaleString()}`;

  // Order items and totals are rendered by renderOrderSummary()
  renderOrderSummary();
}

/* ----------------- Validation Functions----------------- */
function validateName(input) {
  const regex = /^[A-Za-z\s]{2,50}$/;
  if (!input.value.trim()) {
    showError(input, "Name is required");
    return false;
  } else if (!regex.test(input.value.trim())) {
    showError(input, "Name must be 2–50 letters");
    return false;
  }
  return true;
}

function validateEmail(input) {
  const regex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
  if (!input.value.trim()) {
    showError(input, "Email is required");
    return false;
  } else if (!regex.test(input.value.trim())) {
    showError(input, "Invalid email format");
    return false;
  }
  return true;
}

function validatePhone(input) {
  const digits = input.value.replace(/\D/g, "");
  if (!input.value.trim()) {
    showError(input, "Phone Number is required");
    return false;
  } else if (digits.length < 10 || digits.length > 15) {
    showError(input, "Phone must be 10–15 digits");
    return false;
  }
  return true;
}

function validateItem(input) {
  const regex = /^[A-Za-z0-9\s]{2,50}$/;
  if (!input.value.trim()) {
    showError(input, "Item name is required");
    return false;
  } else if (!regex.test(input.value.trim())) {
    showError(input, "Only letters/numbers allowed");
    return false;
  }
  return true;
}

function validateQuantity(input) {
  const qty = parseInt(input.value, 10);
  if (!input.value) {
    showError(input, "Quantity is required");
    return false;
  } else if (isNaN(qty) || qty <= 0) {
    showError(input, "Must be a positive integer");
    return false;
  } else if (qty > 1000) {
    showError(input, "Quantity too large");
    return false;
  }
  return true;
}

function validatePrice(input) {
  const price = parseFloat(input.value);
  if (!input.value) {
    showError(input, "Price is required");
    return false;
  } else if (isNaN(price) || price <= 0) {
    showError(input, "Must be a positive number");
    return false;
  }
  return true;
}

/* ----------------- Error Handling Helpers----------------- */
function showError(input, msg) {
  if (!input) return;
  input.classList.add("invalid");
  const container = input.closest(".form-group");
  const errorSpan = container
    ? container.querySelector(".error-message")
    : null;
  if (errorSpan) errorSpan.textContent = msg;
}

function clearFieldError(input) {
  input.classList.remove("invalid");
  const container = input.closest(".form-group");
  const errorSpan = container
    ? container.querySelector(".error-message")
    : null;
  if (errorSpan) errorSpan.textContent = "";
}

function clearErrors() {
  document
    .querySelectorAll(".error-message")
    .forEach((span) => (span.textContent = ""));
  document
    .querySelectorAll("input")
    .forEach((i) => i.classList.remove("invalid"));
}

/* ----------------- Clear Form Function ----------------- */
function clearAll() {
  // Clear all form fields
  document.querySelector("#customerName").value = "";
  document.querySelector("#customerEmail").value = "";
  document.querySelector("#customerPhone").value = "";
  document.querySelector("#itemName").value = "";
  document.querySelector("#quantity").value = "";
  document.querySelector("#price").value = "";
  document.querySelector("#saveOrder").checked = false;
  document.querySelector("#rememberMe").checked = false;

  // Clear displayed errors and summary
  clearErrors();
  document.querySelector("#summaryCustomer").textContent = "";
  document.querySelector("#orderItems").innerHTML = "";
  document.querySelector("#orderSubtotal").textContent = "0.00";
  document.querySelector("#orderTax").textContent = "0.00";
  document.querySelector("#orderTotal").textContent = "0.00";
  document.querySelector("#summaryCard").classList.add("hidden");

  // Empty the existing orderItems array safely (since it's const)
  orderItems.length = 0;

  // Remove cookies (set expired)
  deleteCookie("saveOrder");
  deleteCookie("orderItems");

  // Remove localStorage data (Remember Me + saved fields)
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("customerName");
  localStorage.removeItem("customerEmail");
  localStorage.removeItem("customerPhone");

  // Confirm to user
  alert("All data, cookies, and saved preferences have been cleared!");
  console.log(
    "All data (form, cookies, and localStorage) cleared successfully."
  );
}

/* ----------------- Cookie Helpers (Updated) ----------------- */
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie =
    name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/* New Helper: Delete Cookie Properly */
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

/* ----------------- Cookie Helpers ----------------- */
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie =
    name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/* ----------------- Load Preferences ----------------- */
function loadPreferences() {
  try {
    const remember = localStorage.getItem("rememberMe") === "true";
    if (remember) {
      document.querySelector("#customerName").value =
        localStorage.getItem("customerName") || "";
      document.querySelector("#customerEmail").value =
        localStorage.getItem("customerEmail") || "";
      document.querySelector("#customerPhone").value =
        localStorage.getItem("customerPhone") || "";
      document.querySelector("#rememberMe").checked = true;
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
            orderItems.push(new OrderItem(obj.name, obj.quantity, obj.price));
          });
          renderOrderSummary();
        }
      }
      document.querySelector("#saveOrder").checked = true;
    }
  } catch (e) {
    console.warn("Failed to load cookies:", e);
  }
}

/* ----------------- Security: Escape HTML ----------------- */
function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        m
      ])
  );
}
