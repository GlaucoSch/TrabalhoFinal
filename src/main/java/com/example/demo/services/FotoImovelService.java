package com.example.demo.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.repositories.FotoImovelRepository;
import com.example.demo.repositories.ImovelRepository;

@Service
public class FotoImovelService {
    private final FotoImovelRepository fotoImovelRepository;
    private final ImovelRepository imovelRepository;
    private final String uploadDir;

    public FotoImovelService(
        FotoImovelRepository fotoImovelRepository,
        ImovelRepository imovelRepository,
        @Value("${app.upload-dir}") String uploadDir
    ) {
        this.fotoImovelRepository = fotoImovelRepository;
        this.imovelRepository = imovelRepository;
        this.uploadDir = uploadDir;
    }

    public List<FotoImovelModel> listarPorImovel(Integer imovelId) {
        if (imovelId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o campo 'imovelId'.");
        }
        imovelRepository.findById(imovelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Imóvel não encontrado com o ID: " + imovelId));
        return fotoImovelRepository.findByImovelIdOrderByOrdemAsc(imovelId);
    }

    public FotoImovelModel buscarPorId(Integer fotoId) {
        return fotoImovelRepository.findById(fotoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Foto não encontrada com o ID: " + fotoId));
    }

    public FotoImovelModel salvar(MultipartFile arquivo, Integer imovelId) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie o campo 'arquivo' como File.");
        }
        if (imovelId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o campo 'imovelId'.");
        }

        ImovelModel imovel = imovelRepository.findById(imovelId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Imóvel não encontrado com o ID: " + imovelId));

        try {
            Path pasta = Paths.get(uploadDir).resolve(String.valueOf(imovelId)).normalize();
            Files.createDirectories(pasta);

            String nomeOriginal = StringUtils.cleanPath(Objects.requireNonNullElse(arquivo.getOriginalFilename(), "foto"));
            if (nomeOriginal.isBlank() || nomeOriginal.contains("..")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do arquivo inválido.");
            }

            String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
            Path destino = pasta.resolve(nomeFinal).normalize();
            if (!destino.startsWith(pasta)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho de destino inválido.");
            }

            arquivo.transferTo(destino);

            FotoImovelModel model = new FotoImovelModel();
            model.setCaminho(destino.toString());
            model.setNomeArquivo(nomeFinal);
            model.setImovel(imovel);
            model.setCapa(Boolean.FALSE);
            model.setOrdem(0);

            return fotoImovelRepository.save(model);
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao salvar a foto do imóvel: " + e.getMessage(),
                e
            );
        }
    }

    public FotoImovelModel atualizar(Integer fotoId, MultipartFile arquivo, Integer ordem, Boolean capa) {
        FotoImovelModel foto = buscarPorId(fotoId);

        if (arquivo != null && !arquivo.isEmpty()) {
            try {
                Path pasta = Paths.get(uploadDir, String.valueOf(foto.getImovel().getId())).normalize();
                Files.createDirectories(pasta);

                String nomeOriginal = StringUtils.cleanPath(Objects.requireNonNullElse(arquivo.getOriginalFilename(), "foto"));
                if (nomeOriginal.isBlank() || nomeOriginal.contains("..")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do arquivo inválido.");
                }

                String nomeFinal = UUID.randomUUID() + "_" + nomeOriginal;
                Path destino = pasta.resolve(nomeFinal).normalize();
                if (!destino.startsWith(pasta)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho de destino inválido.");
                }

                if (foto.getCaminho() != null) {
                    Path caminhoAnterior = Paths.get(foto.getCaminho());
                    if (Files.exists(caminhoAnterior)) {
                        Files.delete(caminhoAnterior);
                    }
                }

                arquivo.transferTo(destino);
                foto.setCaminho(destino.toString());
                foto.setNomeArquivo(nomeFinal);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erro ao atualizar a foto do imóvel: " + e.getMessage(), e);
            }
        }

        if (ordem != null) {
            foto.setOrdem(ordem);
        }
        if (capa != null) {
            marcarComoCapa(foto.getId(), capa);
        }

        return fotoImovelRepository.save(foto);
    }

    public FotoImovelModel marcarComoCapa(Integer fotoId, Boolean destaque) {
        FotoImovelModel foto = buscarPorId(fotoId);
        Integer imovelId = foto.getImovel().getId();

        List<FotoImovelModel> fotos = fotoImovelRepository.findByImovelId(imovelId);
        for (FotoImovelModel item : fotos) {
            item.setCapa(Boolean.FALSE);
        }
        foto.setCapa(Boolean.TRUE);
        fotoImovelRepository.saveAll(fotos);
        return fotoImovelRepository.save(foto);
    }

    public void excluir(Integer fotoId) {
        FotoImovelModel foto = buscarPorId(fotoId);

        try {
            if (foto.getCaminho() != null) {
                Path caminho = Paths.get(foto.getCaminho());
                if (Files.exists(caminho)) {
                    Files.delete(caminho);
                }
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao excluir a foto do imóvel: " + e.getMessage(), e);
        }

        fotoImovelRepository.delete(foto);
    }
}
