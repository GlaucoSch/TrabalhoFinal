package com.example.demo.dtos;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImovelRequestDTO {
    private String titulo;
    private String descricao;
    private BigDecimal precoVenda;
    private BigDecimal precoAluguel;
    private String finalidade;
    private String status;
    private Integer dormitorios;
    private Integer banheiros;
    private Integer garagem;
    private BigDecimal areaTotal;
    private BigDecimal areaConstruida;
    private String endereco;
    private String numero;
    private String complemento;
    private String cep;
    private String caracteristicas;
    private Boolean destaque;
    private IdReferenciaDTO tipoImovel;
    private IdReferenciaDTO bairro;

    @Getter
    @Setter
    public static class IdReferenciaDTO {
        private Integer id;
    }
}