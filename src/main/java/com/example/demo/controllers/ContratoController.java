package com.example.demo.controllers;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.models.ContratoModel;
import com.example.demo.services.ContratoService;

import jakarta.mail.MessagingException;

@RestController
@RequestMapping("/contratos")
public class ContratoController {
    private final ContratoService service;
    private final Path uploadDirectory;

    public ContratoController(ContratoService service, @Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.service = service;
        this.uploadDirectory = Paths.get(uploadDir, "contratos").toAbsolutePath().normalize();
    }

    @GetMapping
    public List<ContratoModel> findAll() {
        return service.findAll();
    }

    @GetMapping("/minhas")
    public List<ContratoModel> findMine(Principal principal) {
        return service.findMine(principal.getName());
    }

    @PostMapping("/{id}/assinar")
    public ContratoModel sign(Principal principal, @PathVariable Integer id) {
        return service.sign(id, principal.getName());
    }

    @PatchMapping("/{id}/aprovar")
    public ContratoModel approve(@PathVariable Integer id) {
        return service.approve(id);
    }

    @PatchMapping("/{id}/recusar")
    public ContratoModel refuse(@PathVariable Integer id) {
        return service.refuse(id);
    }

    @PatchMapping("/{id}/cancelar")
    public ContratoModel cancel(@PathVariable Integer id) {
        return service.cancel(id);
    }

    @PostMapping("/{id}/enviar")
    public ContratoModel send(@PathVariable Integer id) throws MessagingException {
        return service.markSent(id);
    }

    @PostMapping(value = "/{id}/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ContratoModel uploadPdf(@PathVariable Integer id, @RequestParam("arquivo") MultipartFile arquivo) {
        String originalName = StringUtils.cleanPath(arquivo.getOriginalFilename() == null
                ? "" : arquivo.getOriginalFilename());
        if (arquivo.isEmpty() || !originalName.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie um arquivo PDF válido");
        }

        try {
            Files.createDirectories(uploadDirectory);
            String filename = "contrato-" + id + "-" + UUID.randomUUID() + ".pdf";
            Path destination = uploadDirectory.resolve(filename).normalize();
            if (!destination.startsWith(uploadDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome de arquivo inválido");
            }
            arquivo.transferTo(destination);
            return service.setPdfPath(id, destination.toString());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível salvar o PDF do contrato", exception);
        }
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<Resource> downloadPdf(@PathVariable Integer id) {
        File file = service.pdfFile(id);
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.getName()).build().toString())
                .body(resource);
    }
}