package org.ms.facture_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "reglement-service")
public interface ReglementServiceClient {
    @GetMapping("/reglements/total/facture/{factureId}")
    Double getTotalReglementByFactureId(@PathVariable("factureId") Long factureId);
    
    @GetMapping("/reglements/facture/{factureId}")
    List<Object> getReglementsByFactureId(@PathVariable("factureId") Long factureId);
    
    @GetMapping("/reglements/montant/facture/{factureId}")
    Double getMontantPayeByFactureId(@PathVariable("factureId") Long factureId);
}
