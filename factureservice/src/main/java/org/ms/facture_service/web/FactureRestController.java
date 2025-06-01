package org.ms.facture_service.web;

import org.ms.facture_service.entities.Facture;
import org.ms.facture_service.entities.FactureLigne;
import org.ms.facture_service.feign.ClientServiceClient;
import org.ms.facture_service.feign.ProduitServiceClient;
import org.ms.facture_service.feign.ReglementServiceClient;
import org.ms.facture_service.model.Client;
import org.ms.facture_service.model.Produit;
import org.ms.facture_service.repository.FactureLigneRepository;
import org.ms.facture_service.repository.FactureRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import org.springframework.transaction.annotation.Transactional;

@RestController
public class FactureRestController {
    private static final Logger logger = LoggerFactory.getLogger(FactureRestController.class);
    private FactureRepository factureRepository;
    private FactureLigneRepository factureLigneRepository;
    private ClientServiceClient clientServiceClient;
    private ProduitServiceClient produitServiceClient;
    private ReglementServiceClient reglementServiceClient;
    
    public FactureRestController(FactureRepository factureRepository,
                               FactureLigneRepository factureLigneRepository,
                               ClientServiceClient clientServiceClient,
                               ProduitServiceClient produitServiceClient,
                               ReglementServiceClient reglementServiceClient) {
        this.factureRepository = factureRepository;
        this.factureLigneRepository = factureLigneRepository;
        this.clientServiceClient = clientServiceClient;
        this.produitServiceClient = produitServiceClient;
        this.reglementServiceClient = reglementServiceClient;
    }
    
    @GetMapping(path="/factures")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public List<Facture> getAllFactures() {
        try {
            logger.info("Fetching all factures");
            List<Facture> factures = factureRepository.findAll();
            // Populate client for each facture
            for (Facture facture : factures) {
                if (facture.getClientID() != null) {
                    try {
                        Client client = clientServiceClient.findClientById(facture.getClientID());
                        facture.setClient(client);
                    } catch (Exception ex) {
                        logger.warn("Could not fetch client for facture id {}: {}", facture.getId(), ex.getMessage());
                        facture.setClient(null);
                    }
                }
            }
            logger.info("Returning {} factures", factures.size());
            return factures;
        } catch (Exception e) {
            logger.error("Critical error while fetching factures: {}", e.getMessage(), e);
            // Return an empty list instead of null to avoid 500 error
            return new ArrayList<>();
        }
    }
    
    @GetMapping(path="/full-facture/{id}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Facture getFacture(@PathVariable(name = "id") Long id) {
        logger.info("Fetching facture with ID: {}", id);
        Facture facture = factureRepository.findById(id).get();
        logger.debug("Found facture: {}", facture);
        
        logger.info("Fetching client for facture");
        Client client = clientServiceClient.findClientById(facture.getClientID());
        facture.setClient(client);
        logger.debug("Client details: {}", client);
        
        logger.info("Processing facture lines");
        facture.getFactureLignes().forEach(fl-> {
            logger.debug("Fetching product for line: {}", fl);
            Produit product = produitServiceClient.findProduitById(fl.getProduitID());
            fl.setProduit(product);
            logger.debug("Product details: {}", product);
        });
        
        logger.info("Calculating amounts");
        facture.setMontantTotal(facture.getFactureLignes().stream()
        .mapToDouble(fl->fl.getPrice() * fl.getQuantity())
        .sum());
        facture.setMontantRestant(facture.getMontantTotal()-facture.getMontantPaye());
        facture.setMontantPaye(facture.getMontantTotal()-facture.getMontantRestant());
        
        logger.info("Returning complete facture");
        return facture;
    }
    
    @PostMapping(path="/factures")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Facture createFacture(@RequestBody Facture facture) {
        logger.info("Creating new facture");
        
        // Validate client exists
        Client client = clientServiceClient.findClientById(facture.getClientID());
        if (client == null) {
            throw new RuntimeException("Client not found with id: " + facture.getClientID());
        }
        
        // Save facture first
        Facture savedFacture = factureRepository.save(facture);
        Collection<FactureLigne> lines = new ArrayList<>();
        
        // Get facture lines from the request
        JsonNode factureLignes = new ObjectMapper().valueToTree(facture.getFactureLignes());
        
        for (JsonNode ligne : factureLignes) {
            Long produitId = ligne.has("produitId") ? ligne.get("produitId").asLong() : 
                           (ligne.has("produitID") ? ligne.get("produitID").asLong() : null);
            
            if (produitId != null) {                // Get product details and check quantity
                Produit produit = produitServiceClient.findProduitById(produitId);
                if (produit == null) {
                    throw new RuntimeException("Product not found with id: " + produitId);
                }
                
                // Get quantity from request
                long requestedQuantity = ligne.has("quantite") ? ligne.get("quantite").asLong() :
                                     (ligne.has("quantity") ? ligne.get("quantity").asLong() : 1L);
                
                // Check available quantity
                long availableQuantity = produitServiceClient.getAvailableQuantity(produitId);
                if (requestedQuantity > availableQuantity) {
                    throw new RuntimeException("Insufficient quantity available for product " + 
                        produit.getName() + ". Only " + availableQuantity + " units left.");
                }
                
                // Create facture line
                FactureLigne factureLigne = new FactureLigne();
                factureLigne.setProduitID(produitId);
                factureLigne.setQuantity(requestedQuantity);
                factureLigne.setPrice(ligne.has("prixUnitaire") ? 
                    ligne.get("prixUnitaire").asDouble() : produit.getPrice());
                factureLigne.setFacture(savedFacture);
                
                // Save line and update product quantity
                FactureLigne savedLine = factureLigneRepository.save(factureLigne);
                lines.add(savedLine);
                
                // Update product's sold quantity
                updateProduitQuantiteVendue(produitId, requestedQuantity);
                
                logger.debug("Created and saved facture line: {} x {} = {} (Product: {})",
                    savedLine.getQuantity(), savedLine.getPrice(), 
                    (savedLine.getQuantity() * savedLine.getPrice()), 
                    produit.getName());
            }
        }
        
        // Update facture with lines and total
        savedFacture.setFactureLignes(lines);
        double total = lines.stream()
            .mapToDouble(fl -> fl.getPrice() * fl.getQuantity())
            .sum();
        savedFacture.setMontantTotal(total);
        
        return factureRepository.save(savedFacture);
    }
    
    private void updateProduitQuantiteVendue(Long produitId, long quantity) {
        try {
            produitServiceClient.updateQuantiteVendue(produitId, quantity);
        } catch (Exception e) {
            logger.error("Error updating product quantity: {}", e.getMessage());
            throw new RuntimeException("Failed to update product quantity: " + e.getMessage());
        }
    }
    
    @PutMapping(path="/factures/{id}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    @Transactional
    public Facture updateFacture(@PathVariable Long id, @RequestBody Map<String, Object> factureDetails) {
        try {
            logger.info("Received update request for facture ID: {}", id);
            
            Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facture not found with id: " + id));
            
            // Update basic fields
            if (factureDetails.containsKey("dateFacture")) {
                try {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    facture.setDateFacture(dateFormat.parse((String)factureDetails.get("dateFacture")));
                } catch (ParseException e) {
                    logger.error("Date parsing error: {}", e.getMessage());
                    throw new IllegalArgumentException("Invalid date format. Expected yyyy-MM-dd");
                }
            }
            
            if (factureDetails.containsKey("clientID")) {
                Long clientId = ((Number)factureDetails.get("clientID")).longValue();
                try {
                    Client client = clientServiceClient.findClientById(clientId);
                    if (client == null) {
                        throw new IllegalArgumentException("Client not found with id: " + clientId);
                    }
                    facture.setClientID(clientId);
                    facture.setClient(client);
                } catch (Exception e) {
                    logger.error("Error fetching client: {}", e.getMessage());
                    throw new IllegalArgumentException("Error fetching client with id: " + clientId);
                }
            }
            
            // Process invoice lines
            if (factureDetails.containsKey("factureLignes")) {
                try {
                    // First delete all existing lines for this facture
                    factureLigneRepository.deleteByFactureId(id);
                    
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> lines = (List<Map<String, Object>>) factureDetails.get("factureLignes");
                    Collection<FactureLigne> newLines = new ArrayList<>();
                    
                    for (Map<String, Object> line : lines) {
                        if (line.get("produitID") == null) {
                            throw new IllegalArgumentException("produitID is required for facture ligne");
                        }
                        Long produitId = ((Number)line.get("produitID")).longValue();
                        
                        // Validate product exists and check quantity
                        try {
                            Produit produit = produitServiceClient.findProduitById(produitId);
                            if (produit == null) {
                                throw new IllegalArgumentException("Product not found with id: " + produitId);
                            }
                            
                            long requestedQuantity = line.get("quantity") != null ? 
                                ((Number)line.get("quantity")).longValue() : 1L;
                                
                            long availableQuantity = produitServiceClient.getAvailableQuantity(produitId);
                            if (requestedQuantity > availableQuantity) {
                                throw new IllegalArgumentException(
                                    String.format("Insufficient quantity available for product %s. Only %d units left.", 
                                        produit.getName(), availableQuantity));
                            }
                            
                            FactureLigne factureLigne = new FactureLigne();
                            factureLigne.setProduitID(produitId);
                            factureLigne.setQuantity(requestedQuantity);
                            factureLigne.setPrice(line.get("price") != null ?
                                ((Number)line.get("price")).doubleValue() : produit.getPrice());
                            factureLigne.setFacture(facture);
                            
                            if (line.containsKey("description")) {
                                factureLigne.setDescription((String)line.get("description"));
                            }
                            
                            // Save line and update product quantity
                            FactureLigne savedLine = factureLigneRepository.save(factureLigne);
                            updateProduitQuantiteVendue(produitId, requestedQuantity);
                            newLines.add(savedLine);
                            
                        } catch (Exception e) {
                            logger.error("Error processing product {}: {}", produitId, e.getMessage());
                            throw new IllegalArgumentException("Error processing product: " + e.getMessage());
                        }
                    }
                    
                    facture.setFactureLignes(newLines);
                } catch (Exception e) {
                    logger.error("Error processing facture lines: {}", e.getMessage());
                    throw new IllegalArgumentException("Error processing facture lines: " + e.getMessage());
                }
            }
            
            // Recalculate totals
            try {
                facture.setMontantTotal(facture.getFactureLignes().stream()
                    .mapToDouble(fl -> fl.getPrice() * fl.getQuantity())
                    .sum());
                
                // Fetch total reglement for this facture
                Double montantPaye = 0.0;
                try {
                    Double reglementTotal = reglementServiceClient.getTotalReglementByFactureId(id);
                    if (reglementTotal != null) {
                        montantPaye = reglementTotal;
                    }
                } catch (Exception ex) {
                    logger.warn("Could not fetch reglement total for facture id {}: {}", id, ex.getMessage());
                }
                
                facture.setMontantPaye(montantPaye);
                facture.setMontantRestant(facture.getMontantTotal() - montantPaye);
                
                return factureRepository.save(facture);
            } catch (Exception e) {
                logger.error("Error finalizing facture update: {}", e.getMessage());
                throw new IllegalArgumentException("Error finalizing facture update: " + e.getMessage());
            }
        } catch (Exception e) {
            logger.error("Error updating facture: {}", e.getMessage());
            throw new IllegalArgumentException("Error updating facture: " + e.getMessage());
        }
    }
    
    @GetMapping(path="/factures/{id}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Facture getFactureById(@PathVariable(name = "id") Long id) {
        return factureRepository.findById(id).orElseThrow(() -> 
            new IllegalArgumentException("Facture not found with id: " + id));
    }
    
    @DeleteMapping(path="/factures/{id}")
    @PostAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteFacture(@PathVariable(name = "id") Long id) {
        logger.info("Deleting facture with ID: {}", id);
        
        // First delete all associated factureLignes
        factureLigneRepository.deleteByFactureId(id);
        
        // Then delete the facture
        factureRepository.deleteById(id);
        
        logger.info("Successfully deleted facture with ID: {}", id);
    }
}