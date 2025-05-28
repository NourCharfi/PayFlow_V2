package org.ms.facture_service;
import org.ms.facture_service.entities.Facture;
import org.ms.facture_service.entities.FactureLigne;
import org.ms.facture_service.feign.ClientServiceClient;
import org.ms.facture_service.feign.ProduitServiceClient;
import org.ms.facture_service.model.Client;
import org.ms.facture_service.model.Produit;
import org.ms.facture_service.repository.FactureLigneRepository;
import org.ms.facture_service.repository.FactureRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import feign.FeignException;

import java.util.Date;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
@EnableFeignClients
public class FactureServiceApplication {
    private static final Logger logger = LoggerFactory.getLogger(FactureServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(FactureServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner start(FactureRepository factureRepository,
                          FactureLigneRepository factureLigneRepository,
                          ClientServiceClient clientServiceClient,
                          ProduitServiceClient produitServiceClient) {
        return args -> {
            try {
                logger.info("Starting facture creation test...");
                
                logger.debug("Looking up client with ID 1");
                try {
                    Client client = clientServiceClient.findClientById(1L);
                    if (client != null) {
                        logger.info("Client found: {}", client);
                        
                        logger.debug("Creating initial facture");
                        Facture facture = new Facture();
                        facture.setClientID(client.getId());
                        facture.setDateFacture(new Date());
                        final Facture[] factureHolder = {factureRepository.save(facture)};
                        logger.info("Initial facture created with ID: {}", factureHolder[0].getId());
                    
                        logger.debug("Fetching all products");
                        try {
                            java.util.List<Produit> listeProduits = produitServiceClient.getAllProduits();
                            logger.info("Found {} products", listeProduits.size());
                            
                            final double[] montantTotal = {0.0};
                            
                            listeProduits.forEach(p -> {
                                try {
                                    logger.debug("Creating facture line for product: {}", p);
                                    FactureLigne factureLigne = new FactureLigne();
                                    factureLigne.setProduitID(p.getId());
                                    factureLigne.setPrice(p.getPrice());
                                    factureLigne.setQuantity(1 + new Random().nextInt(5));
                                    factureLigne.setFacture(factureHolder[0]);
                                    factureLigneRepository.save(factureLigne);
                                    
                                    double lineTotal = factureLigne.getPrice() * factureLigne.getQuantity();
                                    montantTotal[0] += lineTotal;
                                    logger.info("Added line: {} x {} = {} (Product: {})",
                                        factureLigne.getQuantity(), factureLigne.getPrice(), lineTotal, p.getName());
                                } catch (Exception e) {
                                    logger.error("Error processing product: {}", p, e);
                                }
                            });
                        
                            logger.debug("Updating facture totals");
                            factureHolder[0].setMontantTotal(montantTotal[0]);
                            factureHolder[0].setMontantPaye(0.0);
                            factureHolder[0].setMontantRestant(montantTotal[0]);
                            factureHolder[0] = factureRepository.save(factureHolder[0]);
                            logger.info("Final facture amounts - Total: {}, Paid: {}, Remaining: {}",
                                factureHolder[0].getMontantTotal(), factureHolder[0].getMontantPaye(), 
                                factureHolder[0].getMontantRestant());
                        } catch (Exception e) {
                            logger.error("Error fetching products", e);
                        }
                        
                        logger.info("Facture creation test completed successfully");
                    } else {
                        logger.error("Client with ID 1 not found!");
                    }
                } catch (FeignException.InternalServerError e) {
                    logger.error("Client service returned 500 error: {}", e.getMessage());
                } catch (FeignException e) {
                    logger.error("Error calling client service: {} - {}", e.status(), e.getMessage());
                } catch (Exception e) {
                    logger.error("Unexpected error while fetching client: {}", e.getMessage(), e);
                }
            } catch (Exception e) {
                logger.error("Error in facture creation process", e);
            }
        };
    }
}

