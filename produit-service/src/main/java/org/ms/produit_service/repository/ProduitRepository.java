package org.ms.produit_service.repository;

import org.ms.produit_service.entities.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.webmvc.RepositoryRestController;
@RepositoryRestController
public interface ProduitRepository extends JpaRepository<Produit,Long> {}
