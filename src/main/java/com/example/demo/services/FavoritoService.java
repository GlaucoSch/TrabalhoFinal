package com.example.demo.services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dtos.FavoritoRequestDTO;
import com.example.demo.models.FavoritoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.FavoritoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class FavoritoService {
    private final FavoritoRepository favoritoRepository;
    private final ImovelRepository imovelRepository;
    private final UserRepository userRepository;

    public FavoritoService(FavoritoRepository favoritoRepository, ImovelRepository imovelRepository,
            UserRepository userRepository) {
        this.favoritoRepository = favoritoRepository;
        this.imovelRepository = imovelRepository;
        this.userRepository = userRepository;
    }

    public List<FavoritoModel> findMine(String email) {
        return favoritoRepository.findAllByUsuarioEmailOrderByIdDesc(email);
    }

    public FavoritoModel create(String email, FavoritoRequestDTO request) {
        if (request == null || request.imovelId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "imovelId é obrigatório");
        }
        UserModel usuario = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        ImovelModel imovel = imovelRepository.findById(request.imovelId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
        if (favoritoRepository.existsByUsuarioIdAndImovelId(usuario.getId(), imovel.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este imóvel já está nos favoritos");
        }

        FavoritoModel favorito = new FavoritoModel();
        favorito.setUsuario(usuario);
        favorito.setImovel(imovel);
        return favoritoRepository.save(favorito);
    }

    @Transactional
    public void delete(String email, Integer id) {
        FavoritoModel favorito = favoritoRepository.findByIdAndUsuarioEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorito não encontrado"));
        favoritoRepository.delete(favorito);
    }
}