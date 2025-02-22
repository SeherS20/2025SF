
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
// Path: script.js
const ctx = document.getElementById('statsPieChart')?.getContext('2d');

if (ctx) {
  const pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [ 'Usable', 'Expired' ], 
      datasets: [{
        backgroundColor: ['#2a3285', '#B2DDF7'],
        data: [0, 0, 0], 
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
      // Add more options here
    }
    
  });

  function updatePieChart() {
    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    let expired = inventory.filter(item => new Date(item.expiryDate) < new Date()).length; // Expired items
    let bought = (inventory.length) - expired;
    
    pieChart.data.datasets[0].data = [bought, expired];
    pieChart.update();
  }

  updatePieChart(); 
  updateExpiry(); 
}

console.log("JavaScript started successfully 🌈🌈🌈");

// Initialize inventory from localStorage
document.addEventListener("DOMContentLoaded", initializeInventory);

function initializeInventory() {
  const storedInventory = localStorage.getItem("inventory");
  if (storedInventory) {
    inventory = JSON.parse(storedInventory);
  }
  renderInventory();
}

// Render inventory table
function renderInventory() {
  const inventoryTable = document.getElementById("inventoryTable");
  inventoryTable.innerHTML = "";

  // Sort inventory by expiry date (earliest expiry first)
  inventory.sort((a, b) => {
    const dateA = new Date(a.expiryDate || "9999-12-31"); // Default far future if no expiry
    const dateB = new Date(b.expiryDate || "9999-12-31");
    return dateA - dateB;
  });

  const today = new Date();
  
  inventory.forEach((item, index) => {
    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;

    if (expiryDate) {
      const timeDiff = (expiryDate - today) / (1000 * 60 * 60 * 24); // Convert milliseconds to days
      if (timeDiff < 0) {
        colorClass = "expired"; // Red for expired items
      } else if (timeDiff <= 3) {
        colorClass = "near-expiry"; // Yellow for near expiry
      } else {
        colorClass = "fresh"; // Green for safe-to-use
      }
    }

    // Alternate row shades (even = light, odd = dark)
    const shadeClass = index % 2 === 0 ? "light" : "dark";

    inventoryTable.innerHTML += `
      <tr class="${colorClass} ${shadeClass}">
        <td>${item.barcode} <input type="checkbox" class="select-item" value="${item.productName}"></td>
        <td>${item.productName}</td>
        <td>${item.expiryDate || "No Expiry Info"}</td>
        <td>
          <img src="${item.image || "default-image.png"}" alt="Image" id="fun_img" width="100px" height="100px">
        </td>
        <td>
          <button onclick="deleteItem(${index})" id="remove">Used 🍴</button>
          <br><br>
          <button onclick="findRecipe('${item.productName}')">Find Recipe</button>
        </td>
      </tr>
    `;
  });
}


function findRecipe(query) {
  const apiKey = "e3ced957b8054abab2caec514a8a63f7";
  const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${query}&number=5`; // Fetch 5 recipes

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.results.length > 0) {
        let outputHTML = "<h2>Recipes Found:</h2>";

        data.results.forEach(recipe => {
          outputHTML += `
            <div>
              <h3>${recipe.title}</h3>
              <img src="${recipe.image}" alt="Recipe Image" width="150">
              <p id="time-${recipe.id}">Fetching time...</p>
              <a id="sourceLink-${recipe.id}" target="_blank">View Full Recipe</a>
            </div>
            <hr>
          `;
          getSource(recipe.id);
        });

        document.getElementById("output").innerHTML = outputHTML;

        document.getElementById("output").scrollIntoView({ behavior: "smooth" });

      } else {
        alert("No recipes found for this product!");
      }
    })
    .catch(error => console.error("Error fetching recipes:", error));
  }

    function getSource(id) {
      const apiKey = "e3ced957b8054abab2caec514a8a63f7";
      fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`)
        .then(response => response.json())
        .then(data => {
          document.getElementById(`sourceLink-${id}`).href = data.sourceUrl;
          document.getElementById(`time-${id}`).innerHTML = `Estimated Time: <strong>${data.readyInMinutes} minutes</strong>`;
        })
        .catch(error => console.error("Error fetching recipe details:", error));
    }
    

async function findMultipleRecipes() {
  const selectedItems = Array.from(document.querySelectorAll(".select-item:checked")).map(checkbox => checkbox.value);
  if (selectedItems.length === 0) return alert("Please select at least one item.");

  const apiKey = "e3ced957b8054abab2caec514a8a63f7";
  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${selectedItems.join(",")}&number=5&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    displayRecipes(data);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    alert("Could not fetch recipes. Please try again.");
  }
}

function displayRecipes(recipes) {
  const output = document.getElementById("output");
  output.innerHTML = "<h2>Recipes Found:</h2>";

  if (recipes.length === 0) {
    output.innerHTML += "<p>No recipes found.</p>";
    return;
  }

  recipes.forEach(recipe => {
    output.innerHTML += `
      <div>
        <h3>${recipe.title}</h3>
        <img src="${recipe.image}" alt="${recipe.title}" width="150">
        <p id="time-${recipe.id}">Fetching time...</p>
        <a id="sourceLink-${recipe.id}" target="_blank">View Full Recipe</a>
      </div>
      <hr>
    `;

    getSource(recipe.id);
  });

  output.scrollIntoView({ behavior: "smooth" });
}
function getSource(id) {
  const apiKey = "e3ced957b8054abab2caec514a8a63f7";
  fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      console.log(`Recipe ID: ${id}`, data); // Debugging
      document.getElementById(`sourceLink-${id}`).href = data.sourceUrl;
      if (data.readyInMinutes) {
        document.getElementById(`time-${id}`).innerHTML = `Estimated Time: <strong>${data.readyInMinutes} minutes</strong>`;
      } else {
        document.getElementById(`time-${id}`).innerHTML = `Estimated Time: <strong>Not Available</strong>`;
      }
    })
    .catch(error => console.error("Error fetching recipe details:", error));
}

async function fetchProduct() {
  const barcode = document.getElementById("barcode").value;
  if (!barcode) return alert("Please scan or enter a barcode.");
  document.getElementById("pleasewait").textContent = "Please wait...";
  // Fetch product details from Open Food Facts API

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    const product = data?.product;
    if (!product) throw new Error("Product not found.");

    const productName = product.product_name || "Unknown Product";
    const productImage = product.image_url || product.image_front_url || ""; // Fetch product image

    // Store product details in dataset attributes
    document.getElementById("productDetails").textContent = `Product: ${productName}`;
    document.getElementById("productDetails").dataset.productName = productName;
    document.getElementById("productDetails").dataset.productImage = productImage; // Store image
    document.getElementById("pleasewait").textContent = "↓ Add to Inventory ↓";

  } catch (error) {
    console.error("Error fetching product:", error);
    alert("Could not fetch product details.");
  }
}

function addToInventory() {
  const barcode = document.getElementById("barcode").value;
  const productName = document.getElementById("productDetails").dataset.productName;
  const expiryDate = document.getElementById("expiryDate").value;
  const productImage = document.getElementById("productDetails").dataset.productImage || ""; // Get image

  if (!barcode || !productName) return alert("Please fetch product details before adding.");
  if (!expiryDate) return alert("Please enter an expiry date.");

  // Store the item in local storage
  inventory.push({ barcode, productName, expiryDate, image: productImage });
  localStorage.setItem("inventory", JSON.stringify(inventory));

  renderInventory();
  updatePieChart();
  updateExpiry();

  alert("Product added successfully!");
}

function updateExpiry() {
  const expiringList2 = document.getElementById("expiringList2");
  expiringList2.innerHTML = "";
  const today = new Date();

  const categorizedProducts = inventory.reduce(
    (categories, item) => {
      const expiryDate = new Date(item.expiryDate);
      if (expiryDate) {
        const daysDifference = (expiryDate - today) / (1000 * 60 * 60 * 24);
        if (daysDifference > 0 && daysDifference <= 7) {
          categories.expiring.push({ name: item.productName, daysLeft: Math.ceil(daysDifference) });
        } else if (daysDifference < 0) {
          categories.expired.push({ name: item.productName, daysExpired: Math.abs(Math.ceil(daysDifference)) });
        }
      }
      return categories;
    },
    { expiring: [], expired: [] }
  );

  if (categorizedProducts.expiring.length > 0) {
    categorizedProducts.expiring.forEach(item => {
      expiringList2.innerHTML += `<li>${item.name} - Expiring in ${item.daysLeft} day(s)!!</li> <br>`;
    });
  } else {
    expiringList2.innerHTML += "<li>No products nearing expiry.</li>";
  }

  if (categorizedProducts.expired.length > 0) {
    expiringList2.innerHTML += "<h2>Expired Products:</h2>";
    categorizedProducts.expired.forEach(item => {
      expiringList2.innerHTML += `<li>${item.name} - Expired ${item.daysExpired} day(s) ago</li><br>`;
    });
  }
}

function viewExpiringSoon() {
  const expiringList = document.getElementById("expiringList");
  expiringList.innerHTML = "";
  const today = new Date();

  const categorizedProducts = inventory.reduce(
    (categories, item) => {
      const expiryDate = new Date(item.expiryDate);
      if (expiryDate) {
        const daysDifference = (expiryDate - today) / (1000 * 60 * 60 * 24);
        if (daysDifference > 0 && daysDifference <= 7) {
          categories.expiring.push({ name: item.productName, daysLeft: Math.ceil(daysDifference) });
        } else if (daysDifference < 0) {
          categories.expired.push({ name: item.productName, daysExpired: Math.abs(Math.ceil(daysDifference)) });
        }
      }
      return categories;
    },
    { expiring: [], expired: [] }
  );

  if (categorizedProducts.expiring.length > 0) {
    categorizedProducts.expiring.forEach(item => {
      expiringList.innerHTML += `<li>${item.name} - Expiring in ${item.daysLeft} day(s)</li><br>`;
    });
  } else {
    expiringList.innerHTML += "<li>No products nearing expiry.</li>";
  }

  if (categorizedProducts.expired.length > 0) {
    expiringList.innerHTML += "<h3>Expired Products:</h3>";
    categorizedProducts.expired.forEach(item => {
      expiringList.innerHTML += `<li>${item.name} - Expired ${item.daysExpired} day(s) ago</li><br>`;
      alert("Expired Products: " + item.name + " - Expired " + item.daysExpired + " day(s) ago");
    });
  }
}
function deleteItem(index) {
  const item = inventory[index];
  
  if (confirm(`Remove "${item.productName}" from inventory? Only click ok if you have used the item, Or the item isn't edible anymore.`)) {
    inventory[index].used = true;
    inventory.splice(index, 1);
    localStorage.setItem("inventory", JSON.stringify(inventory));
    
    renderInventory();
    updatePieChart();
    
    alert("Item used successfully!");
  }
}

document.getElementById("findRecipesButton").addEventListener("click", findMultipleRecipes);


function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
}
function inventorybutton() {
  window.location.href = "inventory.html";
}