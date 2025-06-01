package org.ms.produit_service.web;

import org.ms.produit_service.entities.Produit;
import org.ms.produit_service.repository.ProduitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;




@RestController
public class ProduitRestController {
    @Autowired
    private ProduitRepository produitRepository;

    @GetMapping(path = "/produits")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public List<Produit> list() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        return produitRepository.findAll();
    }

    @GetMapping(path = "/produits/{id}")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Produit getOne(@PathVariable("id") Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        return produitRepository.findById(id).get();
    }

    @PostMapping(path = "/produits")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Produit save(@RequestBody Produit produit) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        return produitRepository.save(produit);
    }

    @PutMapping(path = "/produits/{id}")
    @PostAuthorize("hasRole('ADMIN')")
    public Produit update(@PathVariable("id") Long id, @RequestBody Produit produit) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        produit.setId(id);
        return produitRepository.save(produit);
    }

    @DeleteMapping(path = "/produits/{id}")
    @PostAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable("id") Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        produitRepository.deleteById(id);
    }

    // New method to check available quantity
    @GetMapping(path = "/produits/{id}/available")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public long getAvailableQuantity(@PathVariable("id") Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        Produit produit = produitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        return produit.getQuantity() - produit.getQuantiteVendue();
    }

    // New method to update sold quantity
    @PutMapping(path = "/produits/{id}/updateQuantiteVendue")
    @PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public Produit updateQuantiteVendue(@PathVariable("id") Long id, @RequestParam long newQuantity) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[SECURITY] Utilisateur connecté : " + authentication.getName());
        System.out.println("[SECURITY] Rôles de l'utilisateur :");
        authentication.getAuthorities().forEach(a -> System.out.println("[SECURITY] - " + a.getAuthority()));
        Produit produit = produitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        long availableQuantity = produit.getQuantity() - produit.getQuantiteVendue();
        if (newQuantity > availableQuantity) {
            throw new RuntimeException("Insufficient quantity available. Only " + availableQuantity + " units left.");
        }
        produit.setQuantiteVendue(produit.getQuantiteVendue() + newQuantity);
        return produitRepository.save(produit);
    }
}