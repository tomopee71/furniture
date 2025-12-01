const cart = () => {
  const iconCart = document.querySelector(".icon-cart");
  const closeBtn = document.querySelector(".cartTab .close");
  const body = document.querySelector("body");

  let cartItems = [];
  let products = [];

  // UI elements
  const listCartEl = document.querySelector(".listCart");
  const cartCountSpan = iconCart ? iconCart.querySelector("span") : null;

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

  const refreshCartHTML = () => {
    if (!listCartEl) return;
    if (cartCountSpan) cartCountSpan.textContent = String(cartItems.length);
    listCartEl.innerHTML = "";
    let totalQuantity = 0;
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
           <button class="remove-item" data-index="${idx}">Remove</button>
        </div>
        
          <div class="name">${info ? info.name : "Unknown"}</div>
          <div class="totalPrice">${
            info ? (info.price * item.quantity).toLocaleString() : ""
          }</div>
          <div class="quantity">
            <button class="minus" data-index="${idx}">-</button>
            <span>${item.quantity}</span>
            <button class="plus" data-index="${idx}">+</button>
           
          </div>`;
      listCartEl.appendChild(newItem);
    });
    if (cartCountSpan) cartCountSpan.textContent = String(totalQuantity);
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
};

// Helper export to add product programmatically
export const addProductToCart = (product) => {
  window.dispatchEvent(new CustomEvent("product:add", { detail: product }));
};

export default cart;
