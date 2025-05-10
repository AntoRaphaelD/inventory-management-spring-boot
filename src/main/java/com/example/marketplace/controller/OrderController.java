package com.example.marketplace.controller;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.marketplace.model.Order;
import com.example.marketplace.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Optional<Order> order = orderService.getOrderById(id);
        return order.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    @GetMapping("/total-revenue")
public Map<String, Double> getTotalRevenue() {
    Double totalRevenue = orderService.getTotalRevenue();
    return Map.of("totalRevenue", totalRevenue);
}
@GetMapping("/total-cust")
public Map<String, Double> getTotalcust() {
    Double totalcust = orderService.getTotalcust();
    return Map.of("totalcust", totalcust);
}

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> orderRequest) {
        try {
            Long productId = Long.valueOf(orderRequest.get("productId").toString());
            Integer quantity = Integer.valueOf(orderRequest.get("quantity").toString());
            String buyerName = orderRequest.get("buyerName").toString();
            
            Order newOrder = orderService.createOrder(productId, quantity, buyerName);
            return new ResponseEntity<>(newOrder, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}