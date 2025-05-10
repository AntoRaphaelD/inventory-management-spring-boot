/**
 * SimpleMarket - Customer Module
 * Handles customer dashboard functionality including product browsing,
 * ordering, and cart management
 */

// API endpoints
const API_BASE = 'http://localhost:8080/api';
const ENDPOINTS = {
    PRODUCTS: `${API_BASE}/products`,
    ORDERS: `${API_BASE}/orders`,
};

// Local storage keys
const STORAGE_KEYS = {
    USER_ROLE: 'userRole',
    USERNAME: 'username',
    CART: 'simplemarket_cart',
    THEME: 'simplemarket_theme',
    BUYER_INFO: 'simplemarket_buyer_info'
};

// App state
let state = {
    products: [],
    filteredProducts: [],
    cart: [],
    currentFilter: 'all',
    searchQuery: '',
    isLoading: {
        products: false,
        orders: false
    }
};

/**
 * Authentication check and redirect if unauthorized
 */
function checkAuth() {
    const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
    
    if (userRole !== "customer") {
        window.location.href = "index.html";
        return false;
    }
    
    // Set user greeting
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting && username) {
        userGreeting.textContent = `Welcome, ${username}`;
    }
    
    return true;
}

/**
 * Initialize the application
 */
function initApp() {
    try {
        if (!checkAuth()) return;
        
        // Load saved data
        loadSavedData();
        
        // Add console log to track initialization
        console.log('SimpleMarket Customer Module initialized. Fetching products...');
        
        // Load products
        loadProducts();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize theme
        initTheme();
        
        // Initialize cart
        updateCartUI();
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during app initialization:', error);
        showToast('An error occurred during initialization. Please refresh the page.');
    }
}

/**
 * Load saved data from localStorage
 */
function loadSavedData() {
    // Load cart
    try {
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Error loading cart:', e);
        state.cart = [];
    }
    
    // Load buyer info
    try {
        const savedBuyerInfo = localStorage.getItem(STORAGE_KEYS.BUYER_INFO);
        if (savedBuyerInfo) {
            const buyerInfo = JSON.parse(savedBuyerInfo);
            document.getElementById('buyer').value = buyerInfo.name || '';
            
            if (document.getElementById('shippingAddress')) {
                document.getElementById('shippingAddress').value = buyerInfo.address || '';
            }
        }
    } catch (e) {
        console.error('Error loading buyer info:', e);
    }
}

/**
 * Set up all event listeners for the page
 */
function setupEventListeners() {
    // Order form
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
    
    // Product select
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.addEventListener('change', updateOrderSummary);
    }
    
    // Quantity input
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateOrderSummary);
        quantityInput.addEventListener('change', validateQuantity);
    }
    
    // Quantity buttons
    const decreaseBtn = document.getElementById('decreaseQuantity');
    const increaseBtn = document.getElementById('increaseQuantity');
    if (decreaseBtn && increaseBtn) {
        decreaseBtn.addEventListener('click', () => adjustQuantity(-1));
        increaseBtn.addEventListener('click', () => adjustQuantity(1));
    }
    
    // Product search
    const searchInput = document.getElementById('productSearch');
    const searchButton = document.getElementById('searchButton');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        if (searchButton) {
            searchButton.addEventListener('click', () => handleSearch());
        }
    }
    
    // Product filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            applyFiltersAndSearch();
        });
    });
    
    // Cart modal
    const cartBtn = document.getElementById('cartBtn');
    const closeCartModal = document.getElementById('closeCartModal');
    const cartModal = document.getElementById('cartModal');
    if (cartBtn && closeCartModal && cartModal) {
        cartBtn.addEventListener('click', () => {
            cartModal.classList.add('open');
            document.body.classList.add('modal-open');
        });
        
        closeCartModal.addEventListener('click', () => {
            cartModal.classList.remove('open');
            document.body.classList.remove('modal-open');
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                cartModal.classList.remove('open');
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    // Cart buttons
    const clearCartBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (clearCartBtn && checkoutBtn) {
        clearCartBtn.addEventListener('click', clearCart);
        checkoutBtn.addEventListener('click', processCheckout);
    }
    
    // Refresh orders button
    const refreshOrdersBtn = document.getElementById('refreshOrders');
    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', () => loadOrders(true));
    }
    
    // Theme switch
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
    }
    
    // Save buyer info when changed
    const buyerInput = document.getElementById('buyer');
    const addressInput = document.getElementById('shippingAddress');
    if (buyerInput) {
        buyerInput.addEventListener('change', saveBuyerInfo);
        buyerInput.addEventListener('change', loadOrders);
        
        if (addressInput) {
            addressInput.addEventListener('change', saveBuyerInfo);
        }
    }
}

/**
 * Initialize theme based on saved preference
 */
function initTheme() {
    const themeSwitch = document.getElementById('themeSwitch');
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeSwitch) {
            themeSwitch.checked = true;
        }
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
}

/**
 * Save buyer information to localStorage
 */
function saveBuyerInfo() {
    const buyerName = document.getElementById('buyer').value;
    const shippingAddress = document.getElementById('shippingAddress')?.value || '';
    
    const buyerInfo = {
        name: buyerName,
        address: shippingAddress
    };
    
    localStorage.setItem(STORAGE_KEYS.BUYER_INFO, JSON.stringify(buyerInfo));
}

/**
 * Load products from API
 */
function loadProducts() {
    state.isLoading.products = true;
    updateLoadingState();
    
    console.log('Fetching products from:', ENDPOINTS.PRODUCTS);
    
    fetch(ENDPOINTS.PRODUCTS)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            console.log('Products loaded successfully:', products);
            state.products = products;
            state.filteredProducts = [...products];
            updateProductElements();
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showError('Failed to load products. Please try again.', 'productList');
        })
        .finally(() => {
            state.isLoading.products = false;
            updateLoadingState();
        });
}


/**
 * Load orders for the current buyer
 * @param {boolean} forceRefresh - Whether to force refresh from server
 */
function loadOrders(forceRefresh = false) {
    const buyerName = document.getElementById('buyer').value.trim();
    if (!buyerName) {
        updateOrderList([]);
        return;
    }
    
    state.isLoading.orders = true;
    updateLoadingState();
    
    const ordersUrl = `${ENDPOINTS.ORDERS}?buyer=${encodeURIComponent(buyerName)}`;
    console.log('Fetching orders from:', ordersUrl);
    
    fetch(ordersUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(orders => {
            console.log('Orders loaded successfully:', orders);
            updateOrderList(orders);
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            showError('Failed to load orders. Please try again.', 'orderList');
        })
        .finally(() => {
            state.isLoading.orders = false;
            updateLoadingState();
        });
}
/**
 * Update product-related UI elements
 */
function updateProductElements() {
    updateProductList();
    // We removed the product dropdown, so we don't need to call updateProductDropdown()
}

/**
 * Updates the product listing
 */
/**
 * Updates the product listing with improved add to cart functionality
 */
/**
 * Updates the product listing with improved add to cart functionality
 */
function updateProductList() {
    const list = document.getElementById('productList');
    const noProductsMessage = document.getElementById('noProductsMessage');
    
    if (!list) return;
    
    // Clear current list
    list.innerHTML = '';
    
    // Show no products message if needed
    if (state.filteredProducts.length === 0) {
        if (noProductsMessage) {
            noProductsMessage.classList.remove('hidden');
        }
        return;
    } else if (noProductsMessage) {
        noProductsMessage.classList.add('hidden');
    }
    
    // Add products to list
    state.filteredProducts.forEach(product => {
        const item = document.createElement('li');
        item.className = 'product-item';
        
        // Stock status class
        let stockClass = 'in-stock';
        if (product.availableQuantity <= 0) {
            stockClass = 'out-of-stock';
        } else if (product.availableQuantity <= 5) {
            stockClass = 'low-stock';
        }
        
        item.innerHTML = `
            <div class="product-details">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock ${stockClass}">
                    ${product.availableQuantity > 0 
                        ? `<span>${product.availableQuantity} in stock</span>` 
                        : '<span>Out of stock</span>'}
                </div>
                <p class="product-description">${escapeHtml(product.description || 'No description available')}</p>
            </div>
            <div class="product-actions">
                ${product.availableQuantity > 0 
                    ? `<button class="btn-primary add-to-cart" data-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Add to Cart
                      </button>`
                    : '<button class="btn-primary" disabled>Out of Stock</button>'}
            </div>
        `;
        
        list.appendChild(item);
    });
    
    // Add event listeners to all Add to Cart buttons after HTML is added to DOM
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            addToCart(productId);
        });
    });
}
/**
 * Updates the product dropdown in the order form
 */
function updateProductDropdown() {
    const select = document.getElementById('productSelect');
    if (!select) return;
    
    // Save current selection
    const currentSelection = select.value;
    
    // Clear current options
    select.innerHTML = '<option value="">Select a product</option>';
    
    // Filter products that are in stock
    const availableProducts = state.products.filter(p => p.availableQuantity > 0);
    
    if (availableProducts.length === 0) {
        select.innerHTML += '<option value="" disabled>No products available</option>';
        return;
    }
    
    // Add products to dropdown
    availableProducts.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} - $${p.price.toFixed(2)}`;
        option.dataset.price = p.price;
        option.dataset.maxQuantity = p.availableQuantity;
        select.appendChild(option);
    });
    
    // Restore selection if it exists
    if (currentSelection && select.querySelector(`option[value="${currentSelection}"]`)) {
        select.value = currentSelection;
    }
    
    // Update order summary
    updateOrderSummary();
}

/**
 * Updates the order list in the UI
 * @param {Array} orders - List of orders to display
 */
function updateOrderSummary() {
    const productNameInput = document.getElementById('productName');
    const quantityInput = document.getElementById('quantity');
    const summaryProduct = document.getElementById('summaryProduct');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryQuantity = document.getElementById('summaryQuantity');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (!productNameInput || !quantityInput || !summaryProduct || 
        !summaryPrice || !summaryQuantity || !summaryTotal) {
        console.error('One or more order summary elements not found');
        return;
    }
    
    // Get product name and quantity
    const productName = productNameInput.value.trim();
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (productName === "") {
        // No product entered
        summaryProduct.textContent = '-';
        summaryPrice.textContent = '$0.00';
        summaryQuantity.textContent = '0';
        summaryTotal.textContent = '$0.00';
        return;
    }
    
    // Try to find if the product exists in the catalog
    const matchedProduct = state.products.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
    );
    
    // Use matched product price or default to custom price field if available
    let price = 0;
    const priceInput = document.getElementById('productPrice');
    
    if (matchedProduct) {
        price = matchedProduct.price;
        // If we have a price input and found a matching product, update the price field
        if (priceInput) {
            priceInput.value = price.toFixed(2);
        }
    } else if (priceInput) {
        // Use custom price if available
        price = parseFloat(priceInput.value) || 0;
    }
    
    const total = quantity * price;
    
    // Update summary elements
    summaryProduct.textContent = productName || '-';
    summaryPrice.textContent = `$${price.toFixed(2)}`;
    summaryQuantity.textContent = quantity.toString();
    summaryTotal.textContent = `$${total.toFixed(2)}`;
    
    console.log('Order summary updated:', {
        product: productName,
        price: price,
        quantity: quantity,
        total: total
    });
}

/**
 * Updates the order summary in the UI
 */
/**
 * Updates the order summary in the UI based on current form selections
 */
/**
 * Updates the order summary in the UI based on current form selections
 */
function updateOrderSummary() {
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('quantity');
    const summaryProduct = document.getElementById('summaryProduct');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryQuantity = document.getElementById('summaryQuantity');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (!productSelect || !quantityInput || !summaryProduct || 
        !summaryPrice || !summaryQuantity || !summaryTotal) {
        console.error('One or more order summary elements not found');
        return;
    }
    
    // Get selected product
    const productId = productSelect.value;
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (productId === "") {
        // No product selected
        summaryProduct.textContent = '-';
        summaryPrice.textContent = '$0.00';
        summaryQuantity.textContent = '0';
        summaryTotal.textContent = '$0.00';
        return;
    }
    
    // Find product details
    const selectedProduct = state.products.find(p => p.id === productId);
    if (!selectedProduct) {
        console.error('Selected product not found in state');
        return;
    }
    
    const price = selectedProduct.price;
    const total = quantity * price;
    
    // Update summary elements
    summaryProduct.textContent = selectedProduct.name;
    summaryPrice.textContent = `$${price.toFixed(2)}`;
    summaryQuantity.textContent = quantity.toString();
    summaryTotal.textContent = `$${total.toFixed(2)}`;
    
    console.log('Order summary updated:', {
        product: selectedProduct.name,
        price: price,
        quantity: quantity,
        total: total
    });
}


/**
 * Adjust quantity value by a specific amount
 * @param {number} amount - Amount to adjust by (can be negative)
 */
function adjustQuantity(amount) {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;
    
    const currentValue = parseInt(quantityInput.value) || 0;
    const newValue = Math.max(1, currentValue + amount);
    
    quantityInput.value = newValue;
    
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    quantityInput.dispatchEvent(event);
    
    validateQuantity();
}

/**
 * Validates the quantity input against available stock
 */
function validateQuantity() {
    const quantityInput = document.getElementById('quantity');
    const productNameInput = document.getElementById('productName');
    const quantityFeedback = document.getElementById('quantityFeedback');
    
    if (!quantityInput || !productNameInput || !quantityFeedback) return;
    
    const productName = productNameInput.value.trim().toLowerCase();
    if (!productName) return;
    
    // Find matching product if it exists
    const matchedProduct = state.products.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
    );
    
    if (!matchedProduct) {
        // If no matching product, just validate the quantity is positive
        const quantity = parseInt(quantityInput.value) || 0;
        if (quantity <= 0) {
            quantityInput.value = 1;
            quantityFeedback.textContent = '';
            updateOrderSummary();
        } else {
            quantityFeedback.textContent = '';
        }
        return;
    }
    
    // If we found a matching product, validate against its stock
    const quantity = parseInt(quantityInput.value) || 0;
    const maxQuantity = matchedProduct.availableQuantity;
    
    if (quantity <= 0) {
        quantityInput.value = 1;
        quantityFeedback.textContent = '';
        updateOrderSummary();
    } else if (quantity > maxQuantity) {
        quantityFeedback.textContent = `Maximum available: ${maxQuantity}`;
        quantityFeedback.className = 'input-feedback error';
    } else {
        quantityFeedback.textContent = '';
        quantityFeedback.className = 'input-feedback';
    }
}
/**
 * Handle the order form submission
 /**
 * Handle the order form submission
 * @param {Event} event - The form submit event
 */
function handleOrderSubmit(event) {
    event.preventDefault();

    const productNameInput = document.getElementById('productName');
    const quantityEl = document.getElementById('quantity');
    const buyerEl = document.getElementById('buyer');
    const addressEl = document.getElementById('shippingAddress');
    const orderStatus = document.getElementById('orderStatus');
    const priceEl = document.getElementById('productPrice');

    // Reset order status display
    orderStatus.textContent = '';
    orderStatus.className = 'order-status';

    const productName = productNameInput.value.trim();
    const quantity = parseInt(quantityEl.value) || 1;
    const buyer = buyerEl.value.trim();
    const address = addressEl.value.trim();
    
    // Input validation
    if (!productName) {
        orderStatus.textContent = 'Please enter a product name.';
        orderStatus.classList.add('error');
        return;
    }
    
    if (!buyer) {
        orderStatus.textContent = 'Please enter your name.';
        orderStatus.classList.add('error');
        return;
    }
    
    // Get price either from matched product or custom price input
    let price = 0;
    let productId = null;
    
    // Try to find matching product to get ID and price
    const matchedProduct = state.products.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
    );
    
    if (matchedProduct) {
        productId = matchedProduct.id;
        price = matchedProduct.price;
        
        // Validate against available stock if it's a catalog product
        if (quantity > matchedProduct.availableQuantity) {
            orderStatus.textContent = `Only ${matchedProduct.availableQuantity} units available.`;
            orderStatus.classList.add('error');
            return;
        }
    } else if (priceEl) {
        // Use custom price if available
        price = parseFloat(priceEl.value) || 0;
        if (price <= 0) {
            orderStatus.textContent = 'Please enter a valid price.';
            orderStatus.classList.add('error');
            return;
        }
    } else {
        orderStatus.textContent = 'Product not found in catalog.';
        orderStatus.classList.add('error');
        return;
    }

    // Prepare order data
    const order = {
        productId,  // Will be null for custom products
        productName,
        quantity,
        price,
        buyerName: buyer,
        shippingAddress: address,
        orderDate: new Date().toISOString()
    };

    console.log('Submitting order to API:', order);
    orderStatus.textContent = 'Processing order...';
    
    // Send order to the server
    fetch(ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `HTTP error! Status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Order submitted successfully:', data);
        
        // If it was a catalog product, update the local state
        if (matchedProduct) {
            matchedProduct.availableQuantity -= quantity;
            updateProductElements();
        }
        
        // Update orders list
        loadOrders();
        
        // Clear form fields
        productNameInput.value = '';
        quantityEl.value = '1';
        if (priceEl) priceEl.value = '';
        
        // Update order summary
        updateOrderSummary();
        
        // Show success message
        orderStatus.textContent = 'Order placed successfully!';
        orderStatus.classList.add('success');
    })
    .catch(error => {
        console.error('Order submission error:', error);
        orderStatus.textContent = `Failed to place order: ${error.message}`;
        orderStatus.classList.add('error');
    });
}

/**
 * Set up all event listeners for the page
 */
function setupEventListeners() {
    // Order form
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
    
    // Product name input
    const productNameInput = document.getElementById('productName');
    if (productNameInput) {
        productNameInput.addEventListener('input', function() {
            // Try to auto-complete or validate the product name
            const productName = this.value.trim().toLowerCase();
            if (productName) {
                const matchedProduct = state.products.find(p => 
                    p.name.toLowerCase().includes(productName)
                );
                
                // If we have a price field and found a matching product, update the price
                const priceInput = document.getElementById('productPrice');
                if (matchedProduct && priceInput) {
                    priceInput.value = matchedProduct.price.toFixed(2);
                }
            }
            updateOrderSummary();
        });
    }
    
    // Product price input (if available)
    const productPriceInput = document.getElementById('productPrice');
    if (productPriceInput) {
        productPriceInput.addEventListener('input', updateOrderSummary);
    }
    
    // Quantity input
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateOrderSummary);
        quantityInput.addEventListener('change', validateQuantity);
    }
    
    // Quantity buttons
    const decreaseBtn = document.getElementById('decreaseQuantity');
    const increaseBtn = document.getElementById('increaseQuantity');
    if (decreaseBtn && increaseBtn) {
        decreaseBtn.addEventListener('click', () => adjustQuantity(-1));
        increaseBtn.addEventListener('click', () => adjustQuantity(1));
    }
    
    // Rest of your event listeners remain the same
    // Product search
    const searchInput = document.getElementById('productSearch');
    const searchButton = document.getElementById('searchButton');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        if (searchButton) {
            searchButton.addEventListener('click', () => handleSearch());
        }
    }
    
    // Product filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            applyFiltersAndSearch();
        });
    });
    
    // Cart modal
    const cartBtn = document.getElementById('cartBtn');
    const closeCartModal = document.getElementById('closeCartModal');
    const cartModal = document.getElementById('cartModal');
    if (cartBtn && closeCartModal && cartModal) {
        cartBtn.addEventListener('click', () => {
            cartModal.classList.add('open');
            document.body.classList.add('modal-open');
        });
        
        closeCartModal.addEventListener('click', () => {
            cartModal.classList.remove('open');
            document.body.classList.remove('modal-open');
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                cartModal.classList.remove('open');
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    // Cart buttons
    const clearCartBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (clearCartBtn && checkoutBtn) {
        clearCartBtn.addEventListener('click', clearCart);
        checkoutBtn.addEventListener('click', processCheckout);
    }
    
    // Refresh orders button
    const refreshOrdersBtn = document.getElementById('refreshOrders');
    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', () => loadOrders(true));
    }
    
    // Theme switch
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', toggleTheme);
    }
    
    // Save buyer info when changed
    const buyerInput = document.getElementById('buyer');
    const addressInput = document.getElementById('shippingAddress');
    if (buyerInput) {
        buyerInput.addEventListener('change', saveBuyerInfo);
        buyerInput.addEventListener('change', loadOrders);
        
        if (addressInput) {
            addressInput.addEventListener('change', saveBuyerInfo);
        }
    }
}


/**
 * Apply filters and search to product list
 */
function applyFiltersAndSearch() {
    const { products, currentFilter, searchQuery } = state;
    
    // Apply search
    let filtered = products;
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchQuery) || 
            (p.description && p.description.toLowerCase().includes(searchQuery))
        );
    }
    
    // Apply filters
    if (currentFilter === 'in-stock') {
        filtered = filtered.filter(p => p.availableQuantity > 0);
    } else if (currentFilter === 'low-stock') {
        filtered = filtered.filter(p => p.availableQuantity > 0 && p.availableQuantity <= 5);
    }
    
    state.filteredProducts = filtered;
    updateProductList();
}

/**
 * Add a product to the cart
 * @param {string} productId - The ID of the product to add
 */
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product is already in cart
    const existingItem = state.cart.find(item => item.productId === productId);
    
    if (existingItem) {
        // Don't exceed available quantity
        if (existingItem.quantity < product.availableQuantity) {
            existingItem.quantity += 1;
        } else {
            showToast(`Maximum available quantity for ${product.name} is ${product.availableQuantity}`);
            return;
        }
    } else {
        // Add new item
        state.cart.push({
            productId,
            quantity: 1,
            name: product.name,
            price: product.price
        });
    }
    
    // Save cart
    saveCart();
    
    // Update UI
    updateCartUI();
    showToast(`${product.name} added to cart`);
}

/**
 * Remove a product from the cart
 * @param {string} productId - The ID of the product to remove
 */
function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.productId !== productId);
    saveCart();
    updateCartUI();
}

/**
 * Clear the entire cart
 */
function clearCart() {
    state.cart = [];
    saveCart();
    updateCartUI();
    showToast('Cart cleared');
}

/**
 * Process the checkout from cart
 */
/**
 * Process the checkout from cart
 */
function processCheckout() {
    if (state.cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    
    const buyerName = document.getElementById('buyer').value.trim();
    const shippingAddress = document.getElementById('shippingAddress')?.value || '';
    
    if (!buyerName) {
        showToast('Please enter your name to checkout');
        return;
    }
    
    // First, verify that all items are still available in the requested quantities
    for (const item of state.cart) {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) {
            showToast(`Product "${item.name}" is no longer available`);
            return;
        }
        
        if (item.quantity > product.availableQuantity) {
            showToast(`Only ${product.availableQuantity} units of "${item.name}" are available`);
            return;
        }
    }
    
    // Close modal
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
    
    showToast('Processing your order...');
    
    // Process each cart item as an order
    const orderPromises = state.cart.map(item => {
        const order = {
            productId: item.productId,
            quantity: item.quantity,
            buyerName: buyerName,
            shippingAddress: shippingAddress,
            orderDate: new Date().toISOString()
        };
        
        return fetch(ENDPOINTS.ORDERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        })
        .then(handleResponse)
        .then(responseData => {
            // Update the product quantity in the local state
            const product = state.products.find(p => p.id === item.productId);
            if (product) {
                product.availableQuantity -= item.quantity;
            }
            return responseData;
        });
    });
    
    // Wait for all orders to complete
    Promise.all(orderPromises)
        .then(() => {
            showToast('All orders placed successfully!');
            
            // Clear cart
            clearCart();
            
            // Update UI with new product quantities
            updateProductElements();
            loadOrders();
        })
        .catch(error => {
            console.error('Checkout error:', error);
            showToast('Failed to process checkout. Please try again.');
        });
}

/**
 * Save cart data to localStorage
 */
function saveCart() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
}

/**
 * Update cart-related UI elements
 */
function updateCartUI() {
    // Update cart count
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems.toString();
        cartCount.classList.toggle('hidden', totalItems === 0);
    }
    
    // Update cart items list
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItems || !emptyCart || !cartTotal || !checkoutBtn) return;
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('hidden');
        checkoutBtn.disabled = true;
        cartTotal.textContent = '$0.00';
        return;
    }
    
    // Hide empty cart message and enable checkout
    emptyCart.classList.add('hidden');
    checkoutBtn.disabled = false;
    
    // Clear and populate cart items
    cartItems.innerHTML = '';
    let totalPrice = 0;
    
    state.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        
        const cartItem = document.createElement('li');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
            </div>
            <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
            <button class="btn-icon remove-item" aria-label="Remove item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // Add remove button event listener
        const removeBtn = cartItem.querySelector('.remove-item');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeFromCart(item.productId));
        }
        
        cartItems.appendChild(cartItem);
    });
    
    // Update total price
    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * Update loading indicators based on state
 */
function updateLoadingState() {
    const loadingProducts = document.getElementById('loadingProducts');
    const loadingOrders = document.getElementById('loadingOrders');
    
    if (loadingProducts) {
        loadingProducts.classList.toggle('hidden', !state.isLoading.products);
    }
    
    if (loadingOrders) {
        loadingOrders.classList.toggle('hidden', !state.isLoading.orders);
    }
}

/**
 * Show error message in a list element
 * @param {string} message - Error message to display
 * @param {string} elementId - ID of the list element
 */
function showError(message, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
        // Clear list
        element.innerHTML = '';
        
        // Create error message
        const errorItem = document.createElement('li');
        errorItem.className = 'error-item';
        errorItem.innerHTML = `
            <div class="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="error-message">${escapeHtml(message)}</div>
        `;
        
        element.appendChild(errorItem);
    }
    
    /**
     * Handle API response and check for errors
     * @param {Response} response - Fetch API response
     * @returns {Promise} - Promise that resolves to parsed response data
     */
    function handleResponse(response) {
    if (!response.ok) {
        return response.text().then(text => {
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorData = JSON.parse(text);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If not JSON, use the text directly
                if (text) errorMessage = text;
            }
            throw new Error(errorMessage);
        });
    }
    return response.json().catch(error => {
        console.error('JSON parsing error:', error);
        throw new Error('Invalid response format from server');
    });
}
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Debounce function to limit event handler execution rate
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} - Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    /**
     * Logout user
     */
    /**
 * Handle user logout
 */
function logout() {
    // Clear all authentication-related data
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    
    // Clear any other potential auth data that might be present
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN); // If you're using any auth token
    localStorage.removeItem(STORAGE_KEYS.USER_ID); // If you're storing user ID
    sessionStorage.clear(); // Clear any session storage data
    
    // Clear cookies if you're using any for authentication
    document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Prevent any cached redirects
    if (window.history && window.history.pushState) {
        window.history.pushState('', '', window.location.pathname);
    }
    
    // Redirect to login page using replace instead of href
    window.location.replace("index.html");
}

/**
 * Initialize logout button
 */
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}
    
    /**
     * Check if product is out of stock
     * @param {Object} product - Product to check
     * @returns {boolean} - True if out of stock
     */
    function isOutOfStock(product) {
        return product.availableQuantity <= 0;
    }
    
    /**
     * Initialize product quickview functionality
     */
    function initQuickview() {
        // Delegate event to document for dynamically created elements
        document.addEventListener('click', function(e) {
            // Check if clicked element is a quickview button
            if (e.target.classList.contains('quickview-btn') || 
                e.target.parentElement.classList.contains('quickview-btn')) {
                
                const btn = e.target.classList.contains('quickview-btn') ? 
                    e.target : e.target.parentElement;
                
                const productId = btn.dataset.id;
                showProductQuickview(productId);
            }
            
            // Close quickview
            if (e.target.classList.contains('close-quickview') || 
                e.target.parentElement.classList.contains('close-quickview')) {
                closeQuickview();
            }
        });
    }
    
    /**
     * Show product quickview modal
     * @param {string} productId - ID of product to show
     */
    function showProductQuickview(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        
        // Create or get quickview modal
        let quickview = document.getElementById('productQuickview');
        if (!quickview) {
            quickview = document.createElement('div');
            quickview.id = 'productQuickview';
            quickview.className = 'modal';
            document.body.appendChild(quickview);
        }
        
        // Update modal content
        quickview.innerHTML = `
            <div class="modal-content quickview-content">
                <button class="close-quickview" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="quickview-header">
                    <h2>${escapeHtml(product.name)}</h2>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                </div>
                <div class="quickview-body">
                    <p>${escapeHtml(product.description || 'No description available')}</p>
                    <div class="product-stock ${isOutOfStock(product) ? 'out-of-stock' : 'in-stock'}">
                        ${isOutOfStock(product) 
                            ? 'Out of stock' 
                            : `${product.availableQuantity} in stock`}
                    </div>
                </div>
                <div class="quickview-footer">
                    ${!isOutOfStock(product) 
                        ? `<div class="quantity-selector">
                            <button class="qty-btn" data-action="decrease">-</button>
                            <input type="number" class="qty-input" value="1" min="1" max="${product.availableQuantity}">
                            <button class="qty-btn" data-action="increase">+</button>
                          </div>
                          <button class="btn-primary add-to-cart-quick" data-id="${product.id}">
                            Add to Cart
                          </button>`
                        : '<button class="btn-primary" disabled>Out of Stock</button>'}
                </div>
            </div>
        `;
        
        // Show modal
        quickview.classList.add('open');
        document.body.classList.add('modal-open');
        
        // Add event listeners for quantity buttons
        const qtyInput = quickview.querySelector('.qty-input');
        if (qtyInput) {
            const decreaseBtn = quickview.querySelector('[data-action="decrease"]');
            const increaseBtn = quickview.querySelector('[data-action="increase"]');
            
            decreaseBtn.addEventListener('click', () => {
                const currentVal = parseInt(qtyInput.value) || 1;
                qtyInput.value = Math.max(1, currentVal - 1);
            });
            
            increaseBtn.addEventListener('click', () => {
                const currentVal = parseInt(qtyInput.value) || 1;
                qtyInput.value = Math.min(product.availableQuantity, currentVal + 1);
            });
            
            // Add to cart
            const addToCartBtn = quickview.querySelector('.add-to-cart-quick');
            addToCartBtn.addEventListener('click', () => {
                const quantity = parseInt(qtyInput.value) || 1;
                
                // Check if product is already in cart
                const existingItem = state.cart.find(item => item.productId === productId);
                
                if (existingItem) {
                    // Don't exceed available quantity
                    const newQuantity = existingItem.quantity + quantity;
                    if (newQuantity <= product.availableQuantity) {
                        existingItem.quantity = newQuantity;
                    } else {
                        showToast(`Cannot add ${quantity} more. Cart would exceed available stock.`);
                        return;
                    }
                } else {
                    // Add new item
                    state.cart.push({
                        productId,
                        quantity,
                        name: product.name,
                        price: product.price
                    });
                }
                
                // Save cart and update UI
                saveCart();
                updateCartUI();
                showToast(`${quantity} ${product.name} added to cart`);
                
                // Close quickview
                closeQuickview();
            });
        }
    }
    
    /**
     * Close the product quickview modal
     */
    function closeQuickview() {
        const quickview = document.getElementById('productQuickview');
        if (quickview) {
            quickview.classList.remove('open');
            document.body.classList.remove('modal-open');
        }
    }
    
    /**
     * Initialize page when DOM is loaded
     */
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        initLogout();
        initQuickview();
    });
    
    /**
     * Handle network status changes
     */
    window.addEventListener('online', () => {
        showToast('You are back online!', 2000);
        // Refresh data when back online
        loadProducts();
        loadOrders();
    });
    
    window.addEventListener('offline', () => {
        showToast('You are offline. Some features may be limited.', 4000);
    });