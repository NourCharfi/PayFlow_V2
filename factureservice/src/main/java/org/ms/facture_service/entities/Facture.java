package org.ms.facture_service.entities;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.ms.facture_service.model.Client;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import java.util.Collection;
import java.util.Date;
@Entity
@Data @NoArgsConstructor @AllArgsConstructor @ToString
public class Facture {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;
    
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dateFacture;
    
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_WRITE)
    private Client client;
    
    @Column(name = "client_id")
    private Long clientID;
    
    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL)
    private Collection<FactureLigne> factureLignes;
    
    private double montantTotal;
    private double montantPaye;
    private double montantRestant;
}