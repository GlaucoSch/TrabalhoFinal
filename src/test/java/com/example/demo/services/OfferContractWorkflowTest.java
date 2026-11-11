package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dtos.OfertaRequestDTO;
import com.example.demo.models.BairroModel;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.TipoImovelModel;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.BairroRepository;
import com.example.demo.repositories.ContratoRepository;
import com.example.demo.repositories.ImovelRepository;
import com.example.demo.repositories.OfertaRepository;
import com.example.demo.repositories.TipoImovelRepository;
import com.example.demo.repositories.UserRepository;

@SpringBootTest(properties = "app.jwt.secret=bG9jYWwtZGV2LW9ubHktcmVwbGFjZS10aGlzLXNlY3JldC1rZXk=")
@Transactional
class OfferContractWorkflowTest {
    @Autowired private OfertaService ofertaService;
    @Autowired private ContratoService contratoService;
    @Autowired private UserRepository userRepository;
    @Autowired private ImovelRepository imovelRepository;
    @Autowired private OfertaRepository ofertaRepository;
    @Autowired private ContratoRepository contratoRepository;
    @Autowired private BairroRepository bairroRepository;
    @Autowired private TipoImovelRepository tipoImovelRepository;

    @Test
    void preventsDuplicatePendingOffersButAllowsDifferentCustomers() {
        UserModel first = createUser();
        UserModel second = createUser();
        ImovelModel imovel = createProperty();

        OfertaModel firstOffer = createOffer(first, imovel, "venda");
        OfertaModel secondOffer = createOffer(second, imovel, "venda");

        assertEquals("pendente", secondOffer.getStatus());
        assertThrows(ResponseStatusException.class, () -> createOffer(first, imovel, "venda"));
        assertEquals(2, ofertaRepository.findAllByImovel_IdAndStatusIgnoreCase(imovel.getId(), "pendente").size());
    }

    @Test
    void acceptingOfferReservesPropertyAndMovesOtherPendingOffersToWaiting() {
        UserModel first = createUser();
        UserModel second = createUser();
        ImovelModel imovel = createProperty();
        OfertaModel accepted = createOffer(first, imovel, "venda");
        OfertaModel waiting = createOffer(second, imovel, "aluguel");

        ofertaService.accept(accepted.getId());

        assertEquals("reservado", imovelRepository.findById(imovel.getId()).orElseThrow().getStatus());
        assertEquals("aceita", ofertaRepository.findById(accepted.getId()).orElseThrow().getStatus());
        assertEquals("em_espera", ofertaRepository.findById(waiting.getId()).orElseThrow().getStatus());
        assertEquals("aguardando_assinatura", contratoRepository.findByOfertaId(accepted.getId()).orElseThrow().getStatus());
    }

    @Test
    void signingFinalizesPropertyAndRefusesOtherOffers() {
        UserModel first = createUser();
        UserModel second = createUser();
        ImovelModel imovel = createProperty();
        OfertaModel accepted = createOffer(first, imovel, "venda");
        OfertaModel waiting = createOffer(second, imovel, "aluguel");
        ofertaService.accept(accepted.getId());
        ContratoModel contrato = contratoRepository.findByOfertaId(accepted.getId()).orElseThrow();

        contratoService.sign(contrato.getId(), first.getEmail());

        assertEquals("vendido", imovelRepository.findById(imovel.getId()).orElseThrow().getStatus());
        assertEquals("assinado", contratoRepository.findById(contrato.getId()).orElseThrow().getStatus());
        assertEquals("recusada", ofertaRepository.findById(waiting.getId()).orElseThrow().getStatus());
    }

    @Test
    void cancellingContractReopensPropertyAndReactivatesWaitingOffers() {
        UserModel first = createUser();
        UserModel second = createUser();
        ImovelModel imovel = createProperty();
        OfertaModel accepted = createOffer(first, imovel, "aluguel");
        OfertaModel waiting = createOffer(second, imovel, "venda");
        ofertaService.accept(accepted.getId());
        ContratoModel contrato = contratoRepository.findByOfertaId(accepted.getId()).orElseThrow();

        contratoService.cancel(contrato.getId());

        assertEquals("disponivel", imovelRepository.findById(imovel.getId()).orElseThrow().getStatus());
        assertEquals("cancelada", ofertaRepository.findById(accepted.getId()).orElseThrow().getStatus());
        assertEquals("pendente", ofertaRepository.findById(waiting.getId()).orElseThrow().getStatus());
    }

    private UserModel createUser() {
        UserModel user = new UserModel();
        user.setNome("Workflow test");
        user.setEmail("workflow-" + UUID.randomUUID() + "@example.com");
        user.setSenha("not-used");
        user.setTipo("USER");
        return userRepository.save(user);
    }

    private ImovelModel createProperty() {
        BairroModel bairro = bairroRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Nenhum bairro cadastrado"));
        TipoImovelModel tipo = tipoImovelRepository.findAll().stream()
                .filter(item -> item.getNome() != null && !item.getNome().isBlank())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Nenhum tipo válido cadastrado"));

        ImovelModel imovel = new ImovelModel();
        imovel.setTitulo("Workflow test " + UUID.randomUUID());
        imovel.setFinalidade("ambos");
        imovel.setStatus("disponivel");
        imovel.setPrecoVenda(new BigDecimal("250000.00"));
        imovel.setPrecoAluguel(new BigDecimal("1500.00"));
        imovel.setBairro(bairro);
        imovel.setTipoImovel(tipo);
        return imovelRepository.save(imovel);
    }

    private OfertaModel createOffer(UserModel user, ImovelModel imovel, String tipo) {
        return ofertaService.create(user.getEmail(), new OfertaRequestDTO(
                imovel.getId(), tipo, new BigDecimal("200000.00"), "Proposta de teste"));
    }
}