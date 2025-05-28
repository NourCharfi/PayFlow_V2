package com.org.reglement_service.repository;

import com.org.reglement_service.entities.Reglement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import java.util.List;

@RepositoryRestResource
public interface ReglementRepository extends JpaRepository<Reglement, Long> {
    List<Reglement> findByFactureId(Long factureId);
}