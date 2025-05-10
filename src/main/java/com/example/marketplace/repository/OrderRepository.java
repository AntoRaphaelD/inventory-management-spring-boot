package com.example.marketplace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.marketplace.model.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * Finds the total revenue by summing the totalPrice of all orders
     * @return the sum of all order totalPrice values
     */
    @Query(value = "SELECT SUM(o.total_price) FROM orders o", nativeQuery = true)
    Double findTotalRevenue();
    @Query(value = "SELECT COUNT(*) FROM orders",nativeQuery=true)
    Double findTotalcust();
}