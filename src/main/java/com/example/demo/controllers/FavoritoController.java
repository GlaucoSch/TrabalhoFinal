package com.example.demo.controllers;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.FavoritoRequestDTO;
import com.example.demo.models.FavoritoModel;
import com.example.demo.services.FavoritoService;

@RestController
@RequestMapping("/favoritos")
public class FavoritoController {
    private final FavoritoService service;

    public FavoritoController(FavoritoService service) {
        this.service = service;
    }

    @GetMapping
    public List<FavoritoModel> findMine(Principal principal) {
        return service.findMine(principal.getName());
    }

    @PostMapping
    public ResponseEntity<FavoritoModel> create(Principal principal, @RequestBody FavoritoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal.getName(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Integer id) {
        service.delete(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}