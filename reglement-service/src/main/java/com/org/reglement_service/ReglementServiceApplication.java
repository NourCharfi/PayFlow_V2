package com.org.reglement_service;

import com.org.reglement_service.entities.PaymentType;
import com.org.reglement_service.entities.Reglement;
import com.org.reglement_service.feign.FactureServiceClient;
import com.org.reglement_service.model.Facture;
import com.org.reglement_service.repository.ReglementRepository;

import jakarta.persistence.Column;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import java.util.Date;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableMethodSecurity(prePostEnabled = true)
public class ReglementServiceApplication {
	@Column(nullable = false)
	private Long factureId;

    private static final Logger logger = LoggerFactory.getLogger(ReglementServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ReglementServiceApplication.class, args);
    }

}
