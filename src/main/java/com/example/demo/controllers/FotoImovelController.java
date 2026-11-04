package com.example.demo.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.models.FotoImovelModel;
import com.example.demo.services.FotoImovelService;

@RestController
@RequestMapping("/fotos")
public class FotoImovelController {

    private final FotoImovelService fotoImovelService;

    public FotoImovelController(FotoImovelService fotoImovelService) {
        this.fotoImovelService = fotoImovelService;
    }

    @GetMapping
    public ResponseEntity<List<FotoImovelModel>> listar(@RequestParam Integer imovelId) {
        return ResponseEntity.ok(fotoImovelService.listarPorImovel(imovelId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FotoImovelModel> buscar(@PathVariable Integer id) {
        return ResponseEntity.ok(fotoImovelService.buscarPorId(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> salvarFoto(
        @RequestParam(value = "arquivo", required = false) MultipartFile arquivo,
        @RequestParam(value = "imovelId", required = false) Integer imovelId) {

        if (arquivo == null || arquivo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Envie o campo 'arquivo' como File."));
        }
        if (imovelId == null) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Informe o campo 'imovelId'."));
        }

        FotoImovelModel fotoImovelModel = fotoImovelService.salvar(arquivo, imovelId);
        return ResponseEntity.ok(fotoImovelModel);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> atualizarFoto(
        @PathVariable Integer id,
        @RequestParam(value = "arquivo", required = false) MultipartFile arquivo,
        @RequestParam(value = "ordem", required = false) Integer ordem,
        @RequestParam(value = "capa", required = false) Boolean capa) {

        FotoImovelModel fotoAtualizada = fotoImovelService.atualizar(id, arquivo, ordem, capa);
        return ResponseEntity.ok(fotoAtualizada);
    }

    @PutMapping("/{id}/capa")
    public ResponseEntity<FotoImovelModel> marcarComoCapa(@PathVariable Integer id) {
        FotoImovelModel foto = fotoImovelService.marcarComoCapa(id, Boolean.TRUE);
        return ResponseEntity.ok(foto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirFoto(@PathVariable Integer id) {
        fotoImovelService.excluir(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
