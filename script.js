
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
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
    }
    
  });

  function updatePieChart() {
    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    let expired = inventory.filter(item => new Date(item.expiryDate) < new Date()).length;
    let bought = (inventory.length) - expired;
    
    pieChart.data.datasets[0].data = [bought, expired];
    pieChart.update();
  }

  updatePieChart(); // Call function to update chart on load
  updateExpiry(); // Call function to update expiry list on load
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
  inventory.forEach((item, index) => {
    inventoryTable.innerHTML += `
      <tr>
        <td>${item.barcode} <input type="checkbox" class="select-item" value="${item.productName}">
        </td>
        <td>${item.productName}</td>
        <td>${item.expiryDate || "No Expiry Info"}</td>
        <td><img src="${item.image || ""}" alt="Product Image" width="50" height="50"></td>
        <td>
          <button onclick="deleteItem(${index})" id="remove" >Used 🍴</button>
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
      document.getElementById(`sourceLink-${id}`).href = data.sourceUrl;
      document.getElementById(`time-${id}`).innerHTML = `Estimated Time: <strong>${data.readyInMinutes} minutes</strong>`;
    })
    .catch(error => console.error("Error fetching recipe details:", error));
}


async function fetchProduct() {
  const barcode = document.getElementById("barcode").value;
  if (!barcode) return alert("Please scan or enter a barcode.");
  document.getElementById("pleasewait").textContent = "Please wait...";

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    const productName = data?.product?.product_name || "Unknown Product";
    document.getElementById("productDetails").textContent = `Product: ${productName}`;
    document.getElementById("productDetails").dataset.productName = productName;
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
  const productImageInput = document.getElementById("productImage");


  if (!barcode || !productName) return alert("Please fetch product details before adding.");
  if (!expiryDate) return alert("Please enter an expiry date.");

  const reader = new FileReader();
  reader.onload = () => {
    inventory.push({ barcode, productName, expiryDate, image: reader.result || "" });
    localStorage.setItem("inventory", JSON.stringify(inventory));
    renderInventory();
    updatePieChart();
    updateExpiry();
  };

  alert("Product added successfully!");
  if (productImageInput.files[0]) {
    reader.readAsDataURL(productImageInput.files[0]);
  } else {
    inventory.push({ barcode, productName, expiryDate, image: "" });
    localStorage.setItem("inventory", JSON.stringify(inventory));
    renderInventory();
    alert("Product added successfully!");
  }
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
      expiringList.innerHTML += `<li>${item.name} - Expiring in ${item.daysLeft} day(s)</li>`;
    });
  } else {
    expiringList.innerHTML += "<li>No products nearing expiry.</li>";
  }

  if (categorizedProducts.expired.length > 0) {
    expiringList.innerHTML += "<h3>Expired Products:</h3>";
    categorizedProducts.expired.forEach(item => {
      expiringList.innerHTML += `<li>${item.name} - Expired ${item.daysExpired} day(s) ago</li>`;
    });
  }
}
function deleteItem(index) {
  const item = inventory[index];
  
  // Confirm removal and mark the item as used
  if (confirm(`Remove "${item.productName}" from inventory? Only click ok if you have used the item.`)) {
    // Mark the item as used
    inventory[index].used = true;
    
    // Remove the item from the inventory
    inventory.splice(index, 1);
    
    // Update localStorage
    localStorage.setItem("inventory", JSON.stringify(inventory));
    
    // Re-render inventory and update pie chart
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