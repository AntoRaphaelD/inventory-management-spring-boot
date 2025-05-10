package com.example.marketplace.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.marketplace.model.Order;
import com.example.marketplace.model.Product;
import com.example.marketplace.repository.OrderRepository;
import com.example.marketplace.repository.ProductRepository;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    public Double getTotalRevenue() {
        Double revenue = orderRepository.findTotalRevenue();
        return revenue != null ? revenue : 0.0;
    }
   public Double getTotalcust() {
    Double cust = orderRepository.findTotalcust();
    return cust != null ? cust : 0.0;
}

    
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }
    
    @Transactional
    public Order createOrder(Long productId, Integer quantity, String buyerName) {
        Optional<Product> productOpt = productRepository.findById(productId);
        
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            
            // Check if enough quantity is available
            if (product.getAvailableQuantity() >= quantity) {
                // Calculate total price
                BigDecimal totalPrice = product.getPrice().multiply(BigDecimal.valueOf(quantity));
                
                // Create order
                Order order = new Order();
                order.setProduct(product);
                order.setQuantity(quantity);
                order.setTotalPrice(totalPrice);
                order.setBuyerName(buyerName);
                order.setOrderDate(LocalDateTime.now());
                
                // Update product quantity
                product.setAvailableQuantity(product.getAvailableQuantity() - quantity);
                productRepository.save(product);
                
                return orderRepository.save(order);
            } else {
                throw new RuntimeException("Not enough quantity available");
            }
        } else {
            throw new RuntimeException("Product not found");
        }
    }
}