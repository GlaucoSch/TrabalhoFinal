package com.example.demo.controllers;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.demo.models.ImovelModel;
import com.example.demo.services.EmailService;
import com.example.demo.services.ImovelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ImovelControllerTest {
    private ImovelService imovelService;
    private EmailService emailService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        imovelService = mock(ImovelService.class);
        emailService = mock(EmailService.class);
        ImovelController controller = new ImovelController(
                imovelService, emailService, "imobiliaria@example.com", "Imobiliária Exemplo");
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void shouldSendPropertyInterestEmail() throws Exception {
        ImovelModel imovel = new ImovelModel();
        imovel.setId(42);
        imovel.setTitulo("Casa com jardim");
        when(imovelService.findWithDetails(42)).thenReturn(imovel);

        mockMvc.perform(post("/imoveis/sabermais/42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Ana Souza",
                                  "telefone": "(11) 99999-1111",
                                  "email": "ana@example.com",
                                  "mensagem": "Gostaria de agendar uma visita."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().string("Solicitação enviada com sucesso"));

        verify(emailService).enviarEmailComTemplate(
                eq("imobiliaria@example.com"),
                eq("Interesse no imóvel #42 - Casa com jardim"),
                eq("email/interesse-imovel"),
                argThat(variaveis -> "Ana Souza".equals(variaveis.get("nomeCliente"))
                        && "ana@example.com".equals(variaveis.get("emailCliente"))
                        && ((ImovelModel) variaveis.get("imovel")).getId().equals(42)));
    }

    @Test
    void shouldRejectInvalidEmailWithoutSendingMessage() throws Exception {
        mockMvc.perform(post("/imoveis/sabermais/42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Ana Souza",
                                  "telefone": "11999991111",
                                  "email": "invalido",
                                  "mensagem": "Tenho interesse."
                                }
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(imovelService, emailService);
    }

    @Test
    void shouldReturnNotFoundWhenPropertyDoesNotExist() throws Exception {
        when(imovelService.findWithDetails(404)).thenReturn(null);

        mockMvc.perform(post("/imoveis/sabermais/404")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Ana Souza",
                                  "telefone": "11999991111",
                                  "email": "ana@example.com",
                                  "mensagem": "Tenho interesse."
                                }
                                """))
                .andExpect(status().isNotFound());

        verifyNoInteractions(emailService);
    }
}
