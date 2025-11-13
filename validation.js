// validation.js

export const validateName = (input) => {
  const regex = /^[A-Za-z\s]{2,50}$/;
  if (!input.value.trim()) {
    showError(input, "Name is required");
    return false;
  } else if (!regex.test(input.value.trim())) {
    showError(input, "Name must be 2–50 letters");
    return false;
  }
  return true;
};

export const validateEmail = (input) => {
  const regex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
  if (!input.value.trim()) {
    showError(input, "Email is required");
    return false;
  } else if (!regex.test(input.value.trim())) {
    showError(input, "Invalid email format");
    return false;
  }
  return true;
};

export const validatePhone = (input) => {
  const digits = input.value.replace(/\D/g, "");
  if (!input.value.trim()) {
    showError(input, "Phone Number is required");
    return false;
  } else if (digits.length < 10 || digits.length > 15) {
    showError(input, "Phone must be 10–15 digits");
    return false;
  }
  return true;
};

export const validateItem = (input) => {
  const regex = /^[A-Za-z0-9\s]{2,50}$/;
  if (!input.value.trim()) {
    showError(input, "Item name is required");
    return false;
  } else if (!regex.test(input.value.trim())) {
    showError(input, "Only letters/numbers allowed");
    return false;
  }
  return true;
};

export const validateQuantity = (input) => {
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
};

export const validatePrice = (input) => {
  const price = parseFloat(input.value);
  if (!input.value) {
    showError(input, "Price is required");
    return false;
  } else if (isNaN(price) || price <= 0) {
    showError(input, "Must be a positive number");
    return false;
  }
  return true;
};

/* Error helpers used by validation modules (shared local functions) */
function showError(input, msg) {
  if (!input) return;
  input.classList.add("invalid");
  const container = input.closest(".form-group");
  const errorSpan = container
    ? container.querySelector(".error-message")
    : null;
  if (errorSpan) errorSpan.textContent = msg;
}

export const clearFieldError = (input) => {
  input.classList.remove("invalid");
  const container = input.closest(".form-group");
  const errorSpan = container
    ? container.querySelector(".error-message")
    : null;
  if (errorSpan) errorSpan.textContent = "";
};

export const clearErrors = () => {
  document
    .querySelectorAll(".error-message")
    .forEach((span) => (span.textContent = ""));
  document
    .querySelectorAll("input")
    .forEach((i) => i.classList.remove("invalid"));
};
