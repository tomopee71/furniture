import cart, { addProductToCart } from "./cart.js";

let app = document.getElementById("app");
let temporaryContent = document.getElementById("temporaryContent");

// load template file
const loadTemplate = async () => {
  if (!app) {
    console.warn("`#app` element not found; aborting template load");
    return;
  }
  if (!temporaryContent) {
    console.warn(
      "`#temporaryContent` element not found; aborting template load"
    );
    return;
  }
  try {
    const response = await fetch("template.html");
    if (!response.ok)
      throw new Error(`Failed to load template: ${response.status}`);
    const html = await response.text();
    app.innerHTML = html;
    const contentTab = document.getElementById("contentTab");
    if (contentTab) {
      contentTab.innerHTML = temporaryContent.innerHTML;
      temporaryContent.innerHTML = "";
    }
    if (typeof cart === "function") cart();
    initApp();
  } catch (err) {
    console.error("Error loading template:", err);
  }
};
loadTemplate();

const initApp = async () => {
  let idProduct = new URLSearchParams(window.location.search).get("id");
  try {
    const response = await fetch("products.json");
    if (!response.ok)
      throw new Error(`Failed to fetch products: ${response.status}`);
    const products = await response.json();
    // dispatch products:loaded for cart UI
    window.dispatchEvent(
      new CustomEvent("products:loaded", { detail: products })
    );
    const info = products.find((p) => String(p.id) === String(idProduct));
    console.log(info);
    if (!info) {
      window.location.href = "index.html";
    }
    let detail = document.querySelector(".detail");
    if (!detail) {
      console.warn(".detail element not found; aborting detail render");
      return;
    }
    detail.querySelector(".image img").src = info.image;
    detail.querySelector(".name").innerText = info.name;
    // Format price using Intl.NumberFormat for consistency/currency
    try {
      const priceFormatted = new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
      }).format(Number(info.price));
      detail.querySelector(".price").innerText = priceFormatted;
    } catch (e) {
      detail.querySelector(".price").innerText =
        "￥" + Number(info.price).toLocaleString();
    }
    detail.querySelector(".description").innerText = info.description;
    const addBtn = detail.querySelector(".addCart");
    if (addBtn) {
      addBtn.dataset.id = idProduct;
      addBtn.addEventListener("click", () => addProductToCart(info));
    }

    // similar products
    const listProduct = document.querySelector(".listProduct");
    if (listProduct) {
      listProduct.innerHTML = "";
      // exclude the current product from similar products
      products
        .filter((p) => String(p.id) !== String(idProduct))
        .forEach((product) => {
          const newProduct = document.createElement("div");
          newProduct.classList.add("item");
          newProduct.innerHTML = `
          <a href="detail.html?id=${product.id}">
            <img src="${product.image}">
          </a>
          <h2>${product.name}</h2>
          <div class="price">${new Intl.NumberFormat("ja-JP", {
            style: "currency",
            currency: "JPY",
          }).format(Number(product.price))}</div>
          <button class="addCart" data-id="${product.id}">カートに追加</button>
        `;
          listProduct.appendChild(newProduct);

          const addBtn = newProduct.querySelector(".addCart");
          if (addBtn)
            addBtn.addEventListener("click", () => addProductToCart(product));
        });
    }
  } catch (err) {
    console.error("Error loading product detail", err);
    window.location.href = "index.html";
  }
};
