package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.models.OfertaModel;

public interface OfertaRepository extends JpaRepository<OfertaModel, Integer> {
    List<OfertaModel> findAllByOrderByDataCriacaoDesc();
    List<OfertaModel> findAllByUsuarioEmailOrderByDataCriacaoDesc(String email);
    Optional<OfertaModel> findByIdAndUsuarioEmail(Integer id, String email);
    boolean existsByUsuario_IdAndImovel_IdAndStatusIgnoreCase(Integer usuarioId, Integer imovelId, String status);
    List<OfertaModel> findAllByImovel_IdAndStatusIgnoreCase(Integer imovelId, String status);

    @Query(value = "select * from ofertas where imovel_id = :imovelId for update", nativeQuery = true)
    List<OfertaModel> findAllByImovelIdForUpdate(@Param("imovelId") Integer imovelId);
}