package com.example.demo.controllers;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.OfertaRequestDTO;
import com.example.demo.models.OfertaModel;
import com.example.demo.services.OfertaService;

@RestController
@RequestMapping("/ofertas")
public class OfertaController {
    private final OfertaService service;

    public OfertaController(OfertaService service) {
        this.service = service;
    }

    @GetMapping
    public List<OfertaModel> findAll() {
        return service.findAll();
    }

    @GetMapping("/minhas")
    public List<OfertaModel> findMine(Principal principal) {
        return service.findMine(principal.getName());
    }

    @PostMapping
    public ResponseEntity<OfertaModel> create(Principal principal, @RequestBody OfertaRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal.getName(), request));
    }

    @PatchMapping("/{id}/aceitar")
    public OfertaModel accept(@PathVariable Integer id) {
        return service.accept(id);
    }

    @PatchMapping("/{id}/recusar")
    public OfertaModel reject(@PathVariable Integer id) {
        return service.reject(id);
    }
}