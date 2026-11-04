package com.example.demo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.models.TipoImovelModel;
import com.example.demo.repositories.TipoImovelRepository;

@Service
public class TipoImovelService {
    private final TipoImovelRepository repository;

    public TipoImovelService(TipoImovelRepository repository) {
        this.repository = repository;
    }

    public List<TipoImovelModel> getAll() {
        return repository.findAll();
    }

    public TipoImovelModel find(Integer id) {
        return repository.findById(id).orElse(null);
    }

    public TipoImovelModel insert(TipoImovelModel model) {
        return repository.save(model);
    }

    public TipoImovelModel update(TipoImovelModel model) {
        return repository.save(model);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }
}
