import cart from "./cart.js";
let app = document.getElementById("app");
let temporaryContent = document.getElementById("temporaryContent");

// load templeate file
const loadTemplate = () => {
  fetch("template.html")
    .then((response) => response.text())
    .then((html) => {
      app.innerHTML = html;
      let contentTab = document.getElementById("contentTab");
      contentTab.innerHTML = temporaryContent.innerHTML;
      temporaryContent.innerHTML = "";
      cart();
      initApp();
    });
};
loadTemplate();

const initApp = async () => {
  // load list product
  // get data from products.json and render after fetch completes
  try {
    const response = await fetch("products.json");
    if (!response.ok)
      throw new Error(`Failed to fetch products: ${response.status}`);
    const products = await response.json();
    // Notify cart module that products are loaded so it can render product info
    window.dispatchEvent(
      new CustomEvent("products:loaded", { detail: products })
    );
    console.log("Loaded products:", products);

    const listProduct = document.querySelector(".listProduct");
    if (!listProduct) {
      console.warn(".listProduct element not found in DOM");
      return;
    }
    listProduct.innerHTML = "";

    products.forEach((product) => {
      const newProduct = document.createElement("div");
      newProduct.classList.add("item");
      newProduct.innerHTML = `
          <a href="detail.html?id=${product.id}">
            <img src="${product.image}">
          </a>
          <h2>${product.name}</h2>
          <div class="price">${product.price.toLocaleString()}</div>
          <button class="addCart"
            data-id="${product.id}">
            Add To Cart
          </button>`;
      listProduct.appendChild(newProduct);

      // Optional: add click handler for Add To Cart button
      const addBtn = newProduct.querySelector(".addCart");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          // If cart() exposes an add function or you manage cart in another file, call that here.
          // For now, trigger a custom event with product data so other code (e.g., cart.js) can listen.
          const event = new CustomEvent("product:add", { detail: product });
          window.dispatchEvent(event);
        });
      }
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
};
