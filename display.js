// display.js
import { getOrderItems, removeOrderItem, calculateTotals } from "./order.js";

/* Security helper */
export const escapeHtml = (str) => {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        m
      ])
  );
};

export const renderOrderSummary = () => {
  const itemsUl = document.querySelector("#orderItems");
  if (!itemsUl) return;

  const items = getOrderItems();
  itemsUl.innerHTML = "";

  if (items.length === 0) {
    const summaryCard = document.querySelector("#summaryCard");
    if (summaryCard) summaryCard.classList.add("hidden");
    const cust = document.querySelector("#summaryCustomer");
    if (cust) cust.textContent = "";
    document.querySelector("#orderSubtotal").textContent = "0.00";
    document.querySelector("#orderTax").textContent = "0.00";
    document.querySelector("#orderTotal").textContent = "0.00";
    return;
  }

  items.forEach((it, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><strong>${escapeHtml(it.name)}</strong> — ${
      it.quantity
    } × $${it.price.toFixed(2)} = $${it.getLineTotal().toFixed(2)}</span>
      <button type="button" class="small remove-item" data-idx="${idx}" title="Remove item">✕</button>
    `;
    itemsUl.appendChild(li);
  });

  // attach remove handlers
  document.querySelectorAll(".remove-item").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
      if (!isNaN(idx)) {
        removeOrderItem(idx);
        renderOrderSummary();
      }
    })
  );

  const totals = calculateTotals();
  document.querySelector("#orderSubtotal").textContent =
    totals.subtotal.toFixed(2);
  document.querySelector("#orderTax").textContent = totals.tax.toFixed(2);
  document.querySelector("#orderTotal").textContent = totals.total.toFixed(2);

  const summaryCard = document.querySelector("#summaryCard");
  if (summaryCard) summaryCard.classList.remove("hidden");
};

export const displayFinalSummary = (nameEl) => {
  const container = document.querySelector("#summaryCustomer");
  if (!container) return;
  const nameTrimmed = nameEl ? nameEl.value.trim() : "";
  container.innerHTML = `Order for <strong>${escapeHtml(
    nameTrimmed
  )}</strong> on ${new Date().toLocaleString()}`;

  // ensure items & totals are in sync
  renderOrderSummary();
};

// Toast Utility Function
export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add("show"), 100);

  // Auto-remove after 2.5s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
