package com.org.reglement_service.web;

import com.org.reglement_service.entities.Reglement;
import com.org.reglement_service.feign.FactureServiceClient;
import com.org.reglement_service.model.Facture;
import com.org.reglement_service.repository.ReglementRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/reglements")
public class ReglementRestController {
    private final ReglementRepository reglementRepository;
    private final FactureServiceClient factureServiceClient;
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ReglementRestController.class);

    public ReglementRestController(ReglementRepository reglementRepository,
                                 FactureServiceClient factureServiceClient) {
        this.reglementRepository = reglementRepository;
        this.factureServiceClient = factureServiceClient;
    }

    @GetMapping
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public List<Reglement> getAllReglements() {
        logger.info("Fetching all reglements");
        return reglementRepository.findAll();
    }

    @GetMapping("/{id}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<Reglement> getReglementById(@PathVariable Long id) {
        logger.info("Fetching reglement with id: {}", id);
        return reglementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reglement not found with id: " + id));
    }

    @GetMapping("/facture/{factureId}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public List<Reglement> getReglementsByFactureId(@PathVariable Long factureId) {
        logger.info("Fetching reglements for facture id: {}", factureId);
        return reglementRepository.findByFactureId(factureId);
    }

    @GetMapping("/montant/facture/{factureId}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Double getMontantPayeByFactureId(@PathVariable Long factureId) {
        logger.info("Calculating total paid amount for facture id: {}", factureId);
        List<Reglement> reglements = reglementRepository.findByFactureId(factureId);
        return reglements.stream()
                .mapToDouble(Reglement::getMontant)
                .sum();
    }

    @GetMapping("/total/facture/{factureId}")
    public Double getTotalReglementByFactureId(@PathVariable Long factureId) {
        logger.info("Calculating total reglement for facture id: {}", factureId);
        List<Reglement> reglements = reglementRepository.findByFactureId(factureId);
        return reglements.stream()
                .mapToDouble(Reglement::getMontant)
                .sum();
    }

    @PostMapping
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<Reglement> createReglement(@RequestBody Reglement reglement) {
        logger.info("Creating new reglement: {}", reglement);
        
        // Validate facture ID
        if (reglement.getFactureId() == null || reglement.getFactureId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid facture ID: " + reglement.getFactureId());
        }

        try {
            // Verify facture exists
            Facture facture = factureServiceClient.findFactureById(reglement.getFactureId());
            if (facture == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Facture not found with id: " + reglement.getFactureId());
            }

            // Save reglement
            Reglement savedReglement = reglementRepository.save(reglement);
            logger.info("Successfully created reglement with id: {}", savedReglement.getId());
            
            // Calculate new total paid amount
            Double totalPaye = getMontantPayeByFactureId(facture.getId());
            
            // Update facture amounts
            facture.setMontantPaye(totalPaye);
            facture.setMontantRestant(facture.getMontantTotal() - totalPaye);
            
            // Update facture
            factureServiceClient.updateFacture(facture.getId(), facture);
            logger.info("Successfully updated facture {} amounts", facture.getId());
            
            return ResponseEntity.ok(savedReglement);
        } catch (Exception e) {
            logger.error("Error creating reglement: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error creating reglement: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<Reglement> updateReglement(@PathVariable Long id, @RequestBody Reglement reglement) {
        logger.info("Updating reglement with id: {}", id);
        
        // Validate facture ID
        if (reglement.getFactureId() == null || reglement.getFactureId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid facture ID: " + reglement.getFactureId());
        }

        try {
            // Verify facture exists
            Facture facture = factureServiceClient.findFactureById(reglement.getFactureId());
            if (facture == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Facture not found with id: " + reglement.getFactureId());
            }

            // Update the reglement
            reglement.setId(id);
            Reglement updatedReglement = reglementRepository.save(reglement);
            logger.info("Successfully updated reglement with id: {}", updatedReglement.getId());

            // Calculate new total paid amount
            Double totalPaye = getMontantPayeByFactureId(facture.getId());
            
            // Update facture amounts
            facture.setMontantPaye(totalPaye);
            facture.setMontantRestant(facture.getMontantTotal() - totalPaye);
            
            // Update facture
            factureServiceClient.updateFacture(facture.getId(), facture);
            logger.info("Successfully updated facture {} amounts", facture.getId());

            return ResponseEntity.ok(updatedReglement);
        } catch (Exception e) {
            logger.error("Error updating reglement: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating reglement: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PostAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReglement(@PathVariable Long id) {
        logger.info("Deleting reglement with id: {}", id);
        
        try {
            Reglement reglement = reglementRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reglement not found with id: " + id));

            Long factureId = reglement.getFactureId();
            
            // Delete the reglement
            reglementRepository.deleteById(id);
            logger.info("Successfully deleted reglement with id: {}", id);
            
            // Update facture amounts
            Facture facture = factureServiceClient.findFactureById(factureId);
            if (facture != null) {
                // Calculate new total paid amount
                Double totalPaye = getMontantPayeByFactureId(facture.getId());
                
                // Update facture amounts
                facture.setMontantPaye(totalPaye);
                facture.setMontantRestant(facture.getMontantTotal() - totalPaye);
                
                // Update facture
                factureServiceClient.updateFacture(facture.getId(), facture);
                logger.info("Successfully updated facture {} amounts", facture.getId());
            }
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting reglement: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error deleting reglement: " + e.getMessage());
        }
    }
}