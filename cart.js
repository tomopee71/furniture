const cart = () => {
  const iconCart = document.querySelector(".icon-cart");
  const closeBtn = document.querySelector(".cartTab .close");
  const body = document.querySelector("body");

  let cartItems = [];
  let products = [];

  // UI elements
  const listCartEl = document.querySelector(".listCart");
  const cartCountSpan = iconCart ? iconCart.querySelector("span") : null;
  const checkOutBtn = document.querySelector(".cartTab .checkOut");

  // Load persistent cart from localStorage
  try {
    const raw = localStorage.getItem("cart");
    if (raw) cartItems = JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse saved cart", e);
    cartItems = [];
  }

  const saveCart = () => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Failed to save cart", e);
    }
  };

  const setProductInCart = (idProduct, quantity, position) => {
    if (quantity > 0) {
      if (position < 0) {
        cartItems.push({ product_id: Number(idProduct), quantity });
      } else {
        cartItems[position].quantity = quantity;
      }
    } else if (position >= 0) {
      // remove
      cartItems.splice(position, 1);
    }
    saveCart();
    refreshCartHTML();
  };

  let lastTotals = { subtotal: 0, tax: 0, shipping: 0, total: 0 };

  const refreshCartHTML = () => {
    if (!listCartEl) return;
    if (cartCountSpan) cartCountSpan.textContent = String(cartItems.length);
    listCartEl.innerHTML = "";
    let totalQuantity = 0;
    let subtotal = 0; // subtotal of items
    cartItems.forEach((item, idx) => {
      totalQuantity += item.quantity;
      const pos = products.findIndex(
        (p) => Number(p.id) === Number(item.product_id)
      );
      const info = pos >= 0 ? products[pos] : null;
      const newItem = document.createElement("div");
      newItem.classList.add("item");
      newItem.innerHTML = `
        <div class="image">
          <img src="${info ? info.image : ""}" alt="${info ? info.name : ""}" />
           <button class="remove-item" data-index="${idx}">削除</button>
        </div>
        
          <div class="name">${info ? info.name : "Unknown"}</div>
          <div class="itemTotal">${
            info ? (info.price * item.quantity).toLocaleString() : ""
          }</div>
          <div class="quantity">
            <button class="minus" data-index="${idx}">-</button>
            <span>${item.quantity}</span>
            <button class="plus" data-index="${idx}">+</button>
           
          </div>`;
      listCartEl.appendChild(newItem);
      if (info) subtotal += Number(info.price) * Number(item.quantity);
    });
    if (cartCountSpan) cartCountSpan.textContent = String(totalQuantity);
    const totalPriceEl = document.querySelector(
      ".cartTab .cartTotal .totalPrice"
    );
    const subtotalEl = document.querySelector(
      ".cartTab .cartTotal .subtotalPrice"
    );
    const taxEl = document.querySelector(".cartTab .cartTotal .taxPrice");
    const shippingEl = document.querySelector(
      ".cartTab .cartTotal .shippingPrice"
    );
    // tax and shipping configuration
    const TAX_RATE = 0.1; // 10% tax
    const SHIPPING_RATE = 800; // flat 800 JPY
    const FREE_SHIPPING_THRESHOLD = 30000; // free shipping threshold in JPY
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const shippingAmount =
      subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_RATE;
    const totalPrice = subtotal + taxAmount + shippingAmount;
    // store last totals for later validation/confirmation
    lastTotals.subtotal = subtotal;
    lastTotals.tax = taxAmount;
    lastTotals.shipping = shippingAmount;
    lastTotals.total = totalPrice;
    if (totalPriceEl) {
      try {
        totalPriceEl.textContent = new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(Number(totalPrice));
      } catch (e) {
        totalPriceEl.textContent = "￥" + Number(totalPrice).toLocaleString();
      }
    }
    const formatJPY = (v) => {
      try {
        return new Intl.NumberFormat("ja-JP", {
          style: "currency",
          currency: "JPY",
        }).format(Number(v));
      } catch (e) {
        return "￥" + Number(v).toLocaleString();
      }
    };
    if (subtotalEl) subtotalEl.textContent = formatJPY(subtotal);
    if (taxEl) taxEl.textContent = formatJPY(taxAmount);
    if (shippingEl)
      shippingEl.textContent =
        subtotal === 0
          ? formatJPY(0)
          : shippingAmount === 0 && subtotal >= FREE_SHIPPING_THRESHOLD
          ? "Free"
          : formatJPY(shippingAmount);
    if (totalPriceEl) totalPriceEl.textContent = formatJPY(totalPrice);
    // disable checkout if cart/subtotal is empty
    if (checkOutBtn) checkOutBtn.disabled = subtotal <= 0;
  };

  // Toggle cart open/close
  if (iconCart) {
    iconCart.addEventListener("click", () => {
      body.classList.toggle("activeTabCart");
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      body.classList.toggle("activeTabCart");
    });
  }

  // Listen for product:add events from the product list
  window.addEventListener("product:add", (e) => {
    if (!e || !e.detail) return;
    const product = e.detail;
    const id = Number(product.id);
    const pos = cartItems.findIndex((c) => c.product_id === id);
    const qty = pos < 0 ? 1 : cartItems[pos].quantity + 1;
    setProductInCart(id, qty, pos);
  });

  // Listen for products loaded event to have product info for the UI
  window.addEventListener("products:loaded", (e) => {
    products = e && e.detail ? e.detail : [];
    refreshCartHTML();
  });

  // Listen for clicks inside the cart to handle +, -, and remove
  if (listCartEl) {
    listCartEl.addEventListener("click", (ev) => {
      const plus = ev.target.closest(".plus");
      const minus = ev.target.closest(".minus");
      const removeBtn = ev.target.closest(".remove-item");
      if (plus || minus || removeBtn) {
        const idx = Number((plus || minus || removeBtn).dataset.index);
        if (!Number.isFinite(idx)) return;
        const item = cartItems[idx];
        if (!item) return;
        let newQty = item.quantity;
        if (plus) newQty++;
        if (minus) newQty = Math.max(0, newQty - 1);
        if (removeBtn) newQty = 0;
        setProductInCart(item.product_id, newQty, idx);
      }
    });
  }

  // Initial render
  refreshCartHTML();

  // Checkout validation and confirmation
  if (checkOutBtn) {
    checkOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (checkOutBtn.disabled) {
        // If disabled, show a friendly alert (optional)
        alert("Your cart is empty. Please add items before checking out.");
        return;
      }
      if (!products || products.length === 0) {
        alert(
          "Product data has not finished loading. Please wait and try again."
        );
        return;
      }
      if (!cartItems || cartItems.length === 0) {
        alert("Your cart is empty. Please add items before checking out.");
        return;
      }
      // Build confirmation message
      const formatJPY = (v) => {
        try {
          return new Intl.NumberFormat("ja-JP", {
            style: "currency",
            currency: "JPY",
          }).format(Number(v));
        } catch (e) {
          return "￥" + Number(v).toLocaleString();
        }
      };
      const subtotalText = formatJPY(lastTotals.subtotal);
      const taxText = formatJPY(lastTotals.tax);
      const shippingText =
        lastTotals.shipping === 0 && lastTotals.subtotal > 0
          ? "Free"
          : formatJPY(lastTotals.shipping);
      const totalText = formatJPY(lastTotals.total);
      const confirmMsg = `Order Summary:\nSubtotal: ${subtotalText}\nTax: ${taxText}\nShipping: ${shippingText}\n\nTotal: ${totalText}\n\nProceed to checkout?`;
      if (confirm(confirmMsg)) {
        // Placeholder: implement actual checkout flow here (redirect, server POST, etc.)
        alert("Checkout confirmed. Proceeding to checkout... (placeholder)");
      }
    });
  }
};

// Helper export to add product programmatically
export const addProductToCart = (product) => {
  window.dispatchEvent(new CustomEvent("product:add", { detail: product }));
};

export default cart;
