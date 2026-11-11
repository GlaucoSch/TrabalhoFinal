package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.models.ContratoModel;

public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {
    List<ContratoModel> findAllByOrderByIdDesc();
    List<ContratoModel> findAllByOfertaUsuarioEmailOrderByIdDesc(String email);
    Optional<ContratoModel> findByOfertaId(Integer ofertaId);
    Optional<ContratoModel> findByIdAndOfertaUsuarioEmail(Integer id, String email);

    @Query(value = "select * from contratos where id = :id for update", nativeQuery = true)
    Optional<ContratoModel> findByIdForUpdate(@Param("id") Integer id);
}