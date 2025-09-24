// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Automatically focus on the Customer Name input
  document.querySelector("#customerName").focus();

  // Attach form submit handler
  document
    .querySelector("#customerDetails")
    .addEventListener("submit", handleOrder);

  // Attach Clear All button handler
  document.querySelector("#clearBtn").addEventListener("click", clearAll);

  // Inline validation: clear error message as user types
  document
    .querySelectorAll("input")
    .forEach((input) =>
      input.addEventListener("input", () => clearFieldError(input))
    );

  // Restrict phone input to digits only
  document.querySelector("#customerPhone").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Load previously saved preferences from localStorage/cookies
  loadPreferences();
});

// Handle form submission
function handleOrder(e) {
  e.preventDefault(); // Prevent default form submission (page reload)

  // Get references to form inputs
  const nameEl = document.querySelector("#customerName");
  const emailEl = document.querySelector("#customerEmail");
  const phoneEl = document.querySelector("#customerPhone");
  const itemEl = document.querySelector("#itemName");
  const qtyEl = document.querySelector("#quantity");
  const priceEl = document.querySelector("#price");

  // Clear previous error messages
  clearErrors();
  let valid = true;

  try {
    // --- Validation for each field ---
    if (!validateName(nameEl)) valid = false;
    if (!validateEmail(emailEl)) valid = false;
    if (!validatePhone(phoneEl)) valid = false;
    if (!validateItem(itemEl)) valid = false;
    if (!validateQuantity(qtyEl)) valid = false;
    if (!validatePrice(priceEl)) valid = false;

    // Stop if any validation failed
    if (!valid) return;

    // Parse numeric values
    const qty = parseInt(qtyEl.value, 10);
    const price = parseFloat(priceEl.value);

    // Calculate totals
    const subtotal = qty * price;
    const tax = subtotal * 0.13;
    const total = subtotal + tax;

    // --- Display summary ---
    try {
      // Show customer name and timestamp
      document.querySelector(
        "#summaryCustomer"
      ).innerHTML = `Order for <strong>${escapeHtml(
        nameEl.value
      )}</strong> on ${new Date().toLocaleString()}`;

      // Show ordered item details
      document.querySelector("#orderItems").innerHTML = `
        <li>
          Item: <strong>${escapeHtml(itemEl.value)}</strong>, 
          Quantity: <strong>${qty}</strong>, 
          Price: <strong>$${price.toFixed(2)}</strong>
        </li>`;

      // Update subtotal, tax, total
      document.querySelector("#orderSubtotal").textContent =
        subtotal.toFixed(2);
      document.querySelector("#orderTax").textContent = tax.toFixed(2);
      document.querySelector("#orderTotal").textContent = total.toFixed(2);

      // Show the summary card
      document.querySelector("#summaryCard").classList.remove("hidden");
    } catch (displayError) {
      console.warn("Failed to display summary:", displayError);
    }

    // --- Save customer info in localStorage if "Remember Me" checked ---
    try {
      if (document.querySelector("#rememberMe").checked) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("customerName", nameEl.value.trim());
        localStorage.setItem("customerEmail", emailEl.value.trim());
        localStorage.setItem("customerPhone", phoneEl.value.trim());
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("customerName");
        localStorage.removeItem("customerEmail");
        localStorage.removeItem("customerPhone");
      }
    } catch (storageError) {
      console.warn("Could not save to localStorage:", storageError);
    }

    // --- Save order info in cookies if "Save My Order" checked ---
    try {
      if (document.querySelector("#saveOrder").checked) {
        setCookie("saveOrder", "true", 7);
        setCookie("itemName", itemEl.value.trim(), 7);
        setCookie("quantity", qty, 7);
        setCookie("price", price, 7);
      } else {
        // Delete cookies if unchecked
        setCookie("saveOrder", "", -1);
        setCookie("itemName", "", -1);
        setCookie("quantity", "", -1);
        setCookie("price", "", -1);
      }
    } catch (cookieError) {
      console.warn("Could not save cookies:", cookieError);
    }
  } catch (error) {
    // Catch any unexpected error
    alert("An unexpected error occurred. Please try again.");
    console.error(error);
  }
}

/* ----------------- Validation Functions ----------------- */
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
    showError(input, "Phone is required");
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

/* ----------------- Error Handling Helpers ----------------- */
function showError(input, msg) {
  input.classList.add("invalid"); // highlight input
  const container = input.closest(".form-group");
  const errorSpan = container.querySelector(".error-message");
  if (errorSpan) errorSpan.textContent = msg; // show message
}

function clearFieldError(input) {
  input.classList.remove("invalid"); // remove highlight
  const container = input.closest(".form-group");
  const errorSpan = container.querySelector(".error-message");
  if (errorSpan) errorSpan.textContent = ""; // clear message
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
  document.querySelector("#customerDetails").reset(); // reset form
  clearErrors();
  document.querySelector("#summaryCard").classList.add("hidden"); // hide summary
  localStorage.clear(); // clear saved preferences
  ["itemName", "quantity", "price", "saveOrder"].forEach(
    (n) => setCookie(n, "", -1) // delete cookies
  );
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
  // Load localStorage preferences
  try {
    if (localStorage.getItem("rememberMe") === "true") {
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

  // Load order from cookies
  try {
    if (getCookie("saveOrder") === "true") {
      document.querySelector("#itemName").value = getCookie("itemName") || "";
      document.querySelector("#quantity").value = getCookie("quantity") || "";
      document.querySelector("#price").value = getCookie("price") || "";
      document.querySelector("#saveOrder").checked = true;
    }
  } catch (e) {
    console.warn("Failed to load cookies:", e);
  }
}

/* ----------------- Security: Escape HTML ----------------- */
function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[m])
  );
}
