package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.ImovelModel;

public interface  ImovelRepository extends JpaRepository<ImovelModel, Integer>{
    @EntityGraph(attributePaths = {"bairro", "tipoImovel"})
    Optional<ImovelModel> findWithDetailsById(Integer id);
}