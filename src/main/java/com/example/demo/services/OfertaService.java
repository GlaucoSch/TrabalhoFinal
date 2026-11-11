package com.example.demo.services;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dtos.OfertaRequestDTO;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class OfertaService {
    private final OfertaRepository ofertaRepository;
    private final ContratoRepository contratoRepository;
    private final ImovelRepository imovelRepository;
    private final UserRepository userRepository;

    public OfertaService(OfertaRepository ofertaRepository, ContratoRepository contratoRepository,
            ImovelRepository imovelRepository, UserRepository userRepository) {
        this.ofertaRepository = ofertaRepository;
        this.contratoRepository = contratoRepository;
        this.imovelRepository = imovelRepository;
        this.userRepository = userRepository;
    }

    public List<OfertaModel> findAll() {
        return ofertaRepository.findAllByOrderByDataCriacaoDesc();
    }

    public List<OfertaModel> findMine(String email) {
        return ofertaRepository.findAllByUsuarioEmailOrderByDataCriacaoDesc(email);
    }

    @Transactional
    public OfertaModel create(String email, OfertaRequestDTO request) {
        if (request == null || request.imovelId() == null || request.valorProposto() == null
                || request.valorProposto().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Imóvel e valor proposto maior que zero são obrigatórios");
        }

        String tipo = normalize(request.tipo());
        if (tipo.contains("alug") || tipo.contains("loca")) {
            tipo = "aluguel";
        } else if (tipo.contains("vend") || tipo.contains("compr")) {
            tipo = "venda";
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo deve ser venda ou aluguel");
        }

        ImovelModel imovel = imovelRepository.findByIdForUpdate(request.imovelId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
        UserModel usuario = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (!"disponivel".equals(normalize(imovel.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este imóvel não está disponível para ofertas");
        }
        validatePurpose(imovel.getFinalidade(), tipo);
        if (ofertaRepository.existsByUsuario_IdAndImovel_IdAndStatusIgnoreCase(
            usuario.getId(), imovel.getId(), "pendente")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Você já tem uma oferta pendente para este imóvel");
        }

        OfertaModel oferta = new OfertaModel();
        oferta.setImovel(imovel);
        oferta.setUsuario(usuario);
        oferta.setTipo(tipo);
        oferta.setValorProposto(request.valorProposto());
        oferta.setMensagem(request.mensagem() == null ? "" : request.mensagem().trim());
        oferta.setStatus("pendente");
        return ofertaRepository.save(oferta);
    }

    @Transactional
    public OfertaModel accept(Integer id) {
        OfertaModel existing = ofertaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta não encontrada"));
        Integer imovelId = existing.getImovel().getId();
        ImovelModel imovel = imovelRepository.findByIdForUpdate(imovelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
        List<OfertaModel> ofertasImovel = ofertaRepository.findAllByImovelIdForUpdate(imovelId);
        OfertaModel oferta = ofertasImovel.stream()
            .filter(item -> Objects.equals(item.getId(), id))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta não encontrada"));
        requirePending(oferta);
        if (!"disponivel".equals(normalize(imovel.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O imóvel não está disponível para reserva");
        }

        oferta.setStatus("aceita");
        OfertaModel saved = ofertaRepository.save(oferta);
        imovel.setStatus("reservado");
        imovelRepository.save(imovel);

        ofertasImovel.stream()
            .filter(item -> !Objects.equals(item.getId(), id))
            .filter(item -> "pendente".equals(normalize(item.getStatus())))
            .forEach(item -> item.setStatus("em_espera"));
        ofertaRepository.saveAll(ofertasImovel);

        if (contratoRepository.findByOfertaId(id).isEmpty()) {
            ContratoModel contrato = new ContratoModel();
            contrato.setOferta(saved);
            contrato.setStatus("aguardando_assinatura");
            contrato.setDataAprovacao(java.time.LocalDateTime.now());
            contratoRepository.save(contrato);
        }
        return saved;
    }

    @Transactional
    public OfertaModel reject(Integer id) {
        OfertaModel existing = ofertaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta não encontrada"));
        Integer imovelId = existing.getImovel().getId();
        imovelRepository.findByIdForUpdate(imovelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
        List<OfertaModel> ofertasImovel = ofertaRepository.findAllByImovelIdForUpdate(imovelId);
        OfertaModel oferta = ofertasImovel.stream()
                .filter(item -> Objects.equals(item.getId(), id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Oferta não encontrada"));
        requirePending(oferta);
        oferta.setStatus("recusada");
        return ofertaRepository.save(oferta);
    }

    private void requirePending(OfertaModel oferta) {
        if (!"pendente".equals(normalize(oferta.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A oferta não está pendente");
        }
    }

    private void validatePurpose(String finalidade, String tipo) {
        String normalized = normalize(finalidade);
        if (normalized.isBlank() || normalized.contains("amb")) return;
        boolean valid = tipo.equals("venda")
                ? normalized.contains("vend") || normalized.contains("compr")
                : normalized.contains("alug") || normalized.contains("loca");
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O tipo da oferta não corresponde à finalidade do imóvel");
        }
    }

    private String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}