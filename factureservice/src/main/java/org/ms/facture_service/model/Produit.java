package org.ms.facture_service.model;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
@Data @NoArgsConstructor @AllArgsConstructor @ToString
public class Produit {
    private Long id;
    private String name;  // Changed from nom to name
    private double price; // Changed from prix to price
    private long quantity;
    private String description;
    private long quantiteVendue;
}