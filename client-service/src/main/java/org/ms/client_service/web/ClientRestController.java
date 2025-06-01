package org.ms.client_service.web;

import org.ms.client_service.entities.Client;
import org.ms.client_service.repository.ClientRepository;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
public class ClientRestController {
	@Autowired
	private ClientRepository clientRepository;

	@GetMapping(path = "/clients")
	@PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
	public List<Client> list() {
		return clientRepository.findAll();
	}

	@GetMapping(path = "/clients/{id}")
	@PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
	public Client getOne(@PathVariable Long id) {
		return clientRepository.findById(id).get();
	}

	@PostMapping(path = "/clients")
	@PreAuthorize("hasRole('ADMIN')")
	public Client save(@RequestBody Client client) {
		return clientRepository.save(client);
	}

	@PutMapping(path = "/clients/{id}")
	@PostAuthorize("hasRole('ADMIN') or hasRole('USER')")
	public Client update(@PathVariable Long id, @RequestBody Client client) {
		client.setId(id);
		return clientRepository.save(client);
	}

	@DeleteMapping(path = "/clients/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(@PathVariable Long id) {
		clientRepository.deleteById(id);
	}
}
