package com.org.reglement_service.feign;

import com.org.reglement_service.model.Facture;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "facture-service", configuration = FeignClientConfig.class)
public interface FactureServiceClient {
    @GetMapping("/factures/{id}")
    Facture findFactureById(@PathVariable("id") Long id);

    @PutMapping("/factures/{id}")
    Facture updateFacture(@PathVariable("id") Long id, @RequestBody Facture facture);
}