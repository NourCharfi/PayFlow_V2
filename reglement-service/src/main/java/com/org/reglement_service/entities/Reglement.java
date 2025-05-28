package com.org.reglement_service.entities;


import com.org.reglement_service.model.Facture;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Date;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @ToString
public class Reglement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Date dateReglement;
    
    @Column(nullable = false)
    private Double montant;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType type;
    
    @Column
    private String referenceNumber;
    
    @Column(nullable = false)
    private Long factureId;
    
    @Transient
    private Facture facture;
}