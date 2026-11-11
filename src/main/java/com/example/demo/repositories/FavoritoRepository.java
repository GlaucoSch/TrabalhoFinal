package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.models.FavoritoModel;

public interface FavoritoRepository extends JpaRepository<FavoritoModel, Integer> {
    List<FavoritoModel> findAllByUsuarioEmailOrderByIdDesc(String email);
    Optional<FavoritoModel> findByIdAndUsuarioEmail(Integer id, String email);
    boolean existsByUsuarioIdAndImovelId(Integer usuarioId, Integer imovelId);
}