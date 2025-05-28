package org.ms.produit_service.entities;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;


@Entity
@Data @NoArgsConstructor @AllArgsConstructor @ToString
public class Produit {
 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;  // Changed from nom to name
    private double price; // Changed from prix to price
    private long quantity;
    private String description;
    private long quantiteVendue;  // Total quantity sold across all invoices
}
