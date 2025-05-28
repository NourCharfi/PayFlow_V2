package com.org.reglement_service.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.util.Date;

@Data @NoArgsConstructor @AllArgsConstructor @ToString
public class Facture {
    private Long id;
    private Date dateFacture;
    private Long clientID;  // Matches the response field
    private Double montantPaye;
    private Double montantRestant;
    private Double montantTotal;
}