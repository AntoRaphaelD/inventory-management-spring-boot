package com.example.marketplace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.marketplace.model.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}