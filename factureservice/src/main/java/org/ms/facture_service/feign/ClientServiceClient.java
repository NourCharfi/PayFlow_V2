package org.ms.facture_service.feign;
import org.ms.facture_service.model.Client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@FeignClient(name="client-service", configuration = FeignClientConfig.class)
public interface ClientServiceClient {
    @GetMapping(path="/clients/{id}")
    Client findClientById(@PathVariable(name="id") Long id);
}