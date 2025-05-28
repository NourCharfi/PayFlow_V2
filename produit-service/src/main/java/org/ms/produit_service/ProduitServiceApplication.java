package org.ms.produit_service;
import org.ms.produit_service.entities.Produit;
import org.ms.produit_service.repository.ProduitRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;



@SpringBootApplication
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class ProduitServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProduitServiceApplication.class, args);
    }
    
    @Bean
    CommandLineRunner start(ProduitRepository produitRepository, RepositoryRestConfiguration repositoryRestConfiguration) {
        repositoryRestConfiguration.exposeIdsFor(Produit.class);
        return args -> {
            produitRepository.save(new Produit(null, "Lait", 1350, 100, "Lait frais pasteurisé", 0));
            produitRepository.save(new Produit(null, "Pain", 230, 20, "Pain traditionnel", 0));
            produitRepository.save(new Produit(null, "Yaourt", 460, 555, "Yaourt nature", 0));
            
            produitRepository.findAll().forEach(p -> {
                System.out.println(p.getName() + ":" + p.getPrice() + ":" + p.getQuantity() + 
                                 ":" + p.getDescription() + ":vendu=" + p.getQuantiteVendue());
            });
        };
    }
}