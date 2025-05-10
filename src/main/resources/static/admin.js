// Check authentication
if (localStorage.getItem("userRole") !== "admin") {
    window.location.href = "index.html";
}

const API = 'http://localhost:8080/api/products';

async function fetchTotalRevenue() {
    try {
        const response = await fetch('http://localhost:8080/api/orders/total-revenue');
        if (!response.ok) throw new Error('Failed to fetch total revenue');

        const data = await response.json();
        document.getElementById('totalRevenue').textContent = `$${data.totalRevenue.toFixed(2)}`;
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        document.getElementById('totalRevenue').textContent = 'Error';
    }
}

// Call it when page loads
window.addEventListener('load', fetchTotalRevenue);



function addProduct() {
    const nameEl = document.getElementById("name");
    const descEl = document.getElementById("desc");
    const priceEl = document.getElementById("price");
    const qtyEl = document.getElementById("qty");
    
    // Validate inputs
    if (!nameEl.value || !priceEl.value || !qtyEl.value) {
        alert("Please fill all required fields");
        return;
    }
    
    const product = {
        name: nameEl.value,
        description: descEl.value,
        price: parseFloat(priceEl.value),
        availableQuantity: parseInt(qtyEl.value)
    };
    
    fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(() => {
        // Clear form
        nameEl.value = '';
        descEl.value = '';
        priceEl.value = '';
        qtyEl.value = '';
        
        loadProducts();
    })
    .catch(error => {
        console.error('Error adding product:', error);
        alert('Failed to add product');
    });
}
// Example with fetch API for server data
async function displayTotalRevenue() {
    const totalRevenueElement = document.getElementById('totalRevenue');
    
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        
        // Calculate total as before
        let totalRevenue = 0;
        if (orders && orders.length > 0) {
            totalRevenue = orders.reduce((sum, order) => {
                return sum + parseFloat(order.totalPrice || 0);
            }, 0);
        }
        
        // Format and display
        totalRevenueElement.textContent = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(totalRevenue);
    } catch (error) {
        console.error('Error fetching orders:', error);
        totalRevenueElement.textContent = '$0';
    }
}
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`${API}/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadProducts())
        .catch(error => {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        });
    }
}
   function fetchTotalRevenue() {
  const totalRevenueElement = document.getElementById('totalRevenue');
  totalRevenueElement.innerText = 'Loading...';  // Show loading text while fetching data

  fetch('/api/orders/total-revenue', { cache: "no-cache" })  // Fetch the data with cache-busting
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();  // Parse the response as JSON
    })
    .then(data => {
      console.log('API Response:', data);  // Log the response to the console

      if (data && data.totalRevenue !== undefined) {
        const revenue = data.totalRevenue;
        // Format the number with dollar sign and commas
        totalRevenueElement.innerText = '$' + revenue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } else {
        console.error('Unexpected API response format:', data);
        totalRevenueElement.innerText = 'Invalid data';  // Show fallback message
      }
    })
    .catch(error => {
      console.error('Error fetching total revenue:', error);
      totalRevenueElement.innerText = 'Error fetching data';  // Show error message if fetch fails
    });
}

function loadProducts() {
    fetch(API)
        .then(res => res.json())
        .then(products => {
            const list = document.getElementById("productList");
            list.innerHTML = '';
            
            if (products.length === 0) {
                list.innerHTML = '<li>No products available</li>';
                return;
            }
            
            products.forEach(p => {
                const item = document.createElement("li");
                item.innerHTML = `
                    <strong>${p.name}</strong> - $${p.price.toFixed(2)} 
                    <span class="stock">(${p.availableQuantity} in stock)</span>
                    <button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button>
                `;
                list.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading products:', error);
            document.getElementById("productList").innerHTML = 
                '<li class="error">Failed to load products</li>';
        });
}

    function logout() {
        // Remove session and role info
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("simplemarket_session");

        sessionStorage.removeItem("simplemarket_session");

        // Optionally clear everything:
        // localStorage.clear();
        // sessionStorage.clear();

        // Redirect to login (index.html)
        window.location.href = "/";
    }

    document.addEventListener("DOMContentLoaded", function () {
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout);
        }
    });



// Initial load
loadProducts();