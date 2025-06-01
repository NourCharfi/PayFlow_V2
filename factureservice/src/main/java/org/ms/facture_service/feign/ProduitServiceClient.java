package org.ms.facture_service.feign;
import java.util.List;

import org.ms.facture_service.model.Produit;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name="produit-service", configuration = FeignClientConfig.class)
public interface ProduitServiceClient {
    @GetMapping(path="/produits")
    List<Produit> getAllProduits();

    @GetMapping(path="/produits/{id}")
    Produit findProduitById(@PathVariable(name="id") Long id);

    @GetMapping(path="/produits/{id}/available")
    long getAvailableQuantity(@PathVariable(name="id") Long id);

    @PutMapping(path="/produits/{id}/updateQuantiteVendue")
    Produit updateQuantiteVendue(@PathVariable(name="id") Long id, @RequestParam long newQuantity);
}