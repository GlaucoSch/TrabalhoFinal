package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.models.ImovelModel;

public interface  ImovelRepository extends JpaRepository<ImovelModel, Integer>{
    @EntityGraph(attributePaths = {"bairro", "tipoImovel"})
    Optional<ImovelModel> findWithDetailsById(Integer id);

    @Query(value = "select * from imovel where id = :id for update", nativeQuery = true)
    Optional<ImovelModel> findByIdForUpdate(@Param("id") Integer id);
}