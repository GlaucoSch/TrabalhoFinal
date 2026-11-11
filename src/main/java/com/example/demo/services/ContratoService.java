package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.List;
import java.io.File;
import java.util.Objects;

import jakarta.mail.MessagingException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;

@Service
public class ContratoService {
    private final ContratoRepository repository;
    private final EmailService emailService;
    private final ImovelRepository imovelRepository;
    private final OfertaRepository ofertaRepository;

    public ContratoService(ContratoRepository repository, EmailService emailService,
            ImovelRepository imovelRepository, OfertaRepository ofertaRepository) {
        this.repository = repository;
        this.emailService = emailService;
        this.imovelRepository = imovelRepository;
        this.ofertaRepository = ofertaRepository;
    }

    public List<ContratoModel> findAll() {
        return repository.findAllByOrderByIdDesc();
    }

    public List<ContratoModel> findMine(String email) {
        return repository.findAllByOfertaUsuarioEmailOrderByIdDesc(email);
    }

    @Transactional
    public ContratoModel sign(Integer id, String email) {
        ContratoModel existing = repository.findByIdAndOfertaUsuarioEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        Integer imovelId = existing.getOferta().getImovel().getId();
        ImovelModel imovel = imovelRepository.findByIdForUpdate(imovelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
        List<OfertaModel> ofertasImovel = ofertaRepository.findAllByImovelIdForUpdate(imovelId);
        ContratoModel contrato = repository.findByIdForUpdate(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        if (!"aguardando_assinatura".equals(normalizeStatus(contrato.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este contrato não aguarda assinatura");
        }
        String tipo = normalizeStatus(contrato.getOferta().getTipo());
        if (tipo.contains("alug")) {
            imovel.setStatus("alugado");
        } else if (tipo.contains("vend") || tipo.contains("compr")) {
            imovel.setStatus("vendido");
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tipo da oferta inválido para concluir o contrato");
        }

        contrato.setStatus("assinado");
        contrato.setDataAssinatura(LocalDateTime.now());
        imovelRepository.save(imovel);
        ofertasImovel.stream()
            .filter(oferta -> !Objects.equals(oferta.getId(), contrato.getOferta().getId()))
            .filter(oferta -> !"recusada".equals(normalizeStatus(oferta.getStatus()))
                && !"cancelada".equals(normalizeStatus(oferta.getStatus())))
            .forEach(oferta -> oferta.setStatus("recusada"));
        ofertaRepository.saveAll(ofertasImovel);
        return repository.save(contrato);
    }

    @Transactional
    public ContratoModel approve(Integer id) {
        ContratoModel contrato = requireAwaitingSignature(id);
        contrato.setDataAprovacao(LocalDateTime.now());
        return repository.save(contrato);
    }

    @Transactional
    public ContratoModel cancel(Integer id) {
        ContratoModel existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        Integer imovelId = existing.getOferta().getImovel().getId();
        ImovelModel imovel = imovelRepository.findByIdForUpdate(imovelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
        List<OfertaModel> ofertasImovel = ofertaRepository.findAllByImovelIdForUpdate(imovelId);
        ContratoModel contrato = repository.findByIdForUpdate(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        if ("cancelado".equals(normalizeStatus(contrato.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O contrato já está cancelado");
        }
        contrato.setStatus("cancelado");
        imovel.setStatus("disponivel");
        imovelRepository.save(imovel);
        ofertasImovel.stream()
            .filter(oferta -> Objects.equals(oferta.getId(), contrato.getOferta().getId()))
            .forEach(oferta -> oferta.setStatus("cancelada"));
        ofertasImovel.stream()
            .filter(oferta -> "em_espera".equals(normalizeStatus(oferta.getStatus())))
            .forEach(oferta -> oferta.setStatus("pendente"));
        ofertaRepository.saveAll(ofertasImovel);
        return repository.save(contrato);
    }

    public ContratoModel refuse(Integer id) {
        return cancel(id);
    }

    public ContratoModel markSent(Integer id) throws MessagingException {
        ContratoModel contrato = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        if (!"assinado".equals(normalizeStatus(contrato.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Somente contratos assinados podem ser enviados");
        }
        File pdf = pdfFile(contrato);
        emailService.enviarEmailComAnexo(
                contrato.getOferta().getUsuario().getEmail(),
                "Contrato assinado #" + contrato.getId(),
                "Segue em anexo o contrato assinado.",
                pdf);
        return contrato;
    }

    public ContratoModel setPdfPath(Integer id, String path) {
        ContratoModel contrato = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        contrato.setCaminhoPdf(path);
        return repository.save(contrato);
    }

    public File pdfFile(Integer id) {
        ContratoModel contrato = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        return pdfFile(contrato);
    }

    private ContratoModel requireAwaitingSignature(Integer id) {
        ContratoModel contrato = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado"));
        if (!"aguardando_assinatura".equals(normalizeStatus(contrato.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O contrato não aguarda assinatura");
        }
        return contrato;
    }

    private File pdfFile(ContratoModel contrato) {
        if (contrato.getCaminhoPdf() == null || contrato.getCaminhoPdf().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PDF do contrato não disponível");
        }
        File file = new File(contrato.getCaminhoPdf()).getAbsoluteFile();
        if (!file.isFile()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo do contrato não encontrado");
        }
        return file;
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toLowerCase().replace(' ', '_');
    }
}