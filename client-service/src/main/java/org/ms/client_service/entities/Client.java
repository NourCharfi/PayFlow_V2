package org.ms.client_service.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
//Annotations Lombok
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Client {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String nom;  // Changed from name to nom
	private String email;
	private String telephone;
	private String adresse;
}