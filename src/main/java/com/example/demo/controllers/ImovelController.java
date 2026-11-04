package com.example.demo.controllers;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.demo.dtos.ImovelRequestDTO;
import com.example.demo.dtos.ImovelStatusDTO;
import com.example.demo.dtos.SolicitacaoInformacoesImovelDTO;
import com.example.demo.models.ImovelModel;
import com.example.demo.services.EmailService;
import com.example.demo.services.ImovelService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
public class ImovelController {

    private final ImovelService service;
    private final EmailService emailService;
    private final String destinatarioImobiliaria;
    private final String nomeImobiliaria;

    public ImovelController(ImovelService service, EmailService emailService,
            @Value("${app.email.destinatario:${spring.mail.username}}") String destinatarioImobiliaria,
            @Value("${app.imobiliaria.nome:Schneider Imóveis}") String nomeImobiliaria) {
        this.service = service;
        this.emailService = emailService;
        this.destinatarioImobiliaria = destinatarioImobiliaria;
        this.nomeImobiliaria = nomeImobiliaria;
    }

     @GetMapping("/imovel")
    public ResponseEntity<List<ImovelModel>> getAll() {
        List<ImovelModel> list = service.getAll();
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }

    @GetMapping(value = "/imovel/{id}")
        public ResponseEntity<ImovelModel> find(@PathVariable Integer id) {
        ImovelModel model = service.find(id);
        if(model!=null){
            return ResponseEntity.status(HttpStatus.OK).body(model);
        }
        else{
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/imovel")
    public ResponseEntity<Void> insert(@RequestBody ImovelRequestDTO request) {
        ImovelModel model = service.insert(request);
        // return new ResponseEntity(model, HttpStatus.CREATED);
        URI uri =
        ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(model.getId()).toUri();
        return ResponseEntity.created(uri).build();
        }

    @PutMapping(value = "/imovel/{id}")
    public ResponseEntity<Void> update(@RequestBody ImovelModel model, @PathVariable Integer id) {
        try {
             model.setId(id);
             model = service.update(model);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
       
    }

    @DeleteMapping(value = "/imovel/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/imovel/{id}/status")
    public ResponseEntity<ImovelModel> updateStatus(
            @PathVariable Integer id, @RequestBody ImovelStatusDTO request) {
        if (request == null || !StringUtils.hasText(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status é obrigatório");
        }
        return ResponseEntity.ok(service.updateStatus(id, request.status()));
    }

    @PostMapping("/imoveis/sabermais/{id}")
    public ResponseEntity<String> solicitarInformacoes(@PathVariable Integer id,
            @RequestBody SolicitacaoInformacoesImovelDTO solicitacao) throws MessagingException {
        validarSolicitacao(solicitacao);

        ImovelModel imovel = service.findWithDetails(id);
        if (imovel == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado");
        }

        String tituloImovel = StringUtils.hasText(imovel.getTitulo())
                ? imovel.getTitulo()
                : "Imóvel #" + imovel.getId();
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("nomeCliente", solicitacao.getNome());
        variaveis.put("telefoneCliente", solicitacao.getTelefone());
        variaveis.put("emailCliente", solicitacao.getEmail());
        variaveis.put("mensagemCliente", solicitacao.getMensagem());
        variaveis.put("nomeImobiliaria", nomeImobiliaria);
        variaveis.put("mensagemImobiliaria", "Olá, " + solicitacao.getNome()
                + "! A equipe da " + nomeImobiliaria + " recebeu seu interesse em "
                + tituloImovel + " e entrará em contato em breve pelos dados informados.");
        variaveis.put("imovel", imovel);

        emailService.enviarEmailComTemplate(
                destinatarioImobiliaria,
                "Interesse no imóvel #" + imovel.getId() + " - " + tituloImovel,
                "email/interesse-imovel",
                variaveis);

        return ResponseEntity.ok("Solicitação enviada com sucesso");
    }

    private void validarSolicitacao(SolicitacaoInformacoesImovelDTO solicitacao) {
        if (solicitacao == null
                || !StringUtils.hasText(solicitacao.getNome())
                || !StringUtils.hasText(solicitacao.getTelefone())
                || !StringUtils.hasText(solicitacao.getEmail())
                || !StringUtils.hasText(solicitacao.getMensagem())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nome, telefone, email e mensagem são obrigatórios");
        }

        try {
            new InternetAddress(solicitacao.getEmail(), true).validate();
        } catch (AddressException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email inválido", exception);
        }
    }
}