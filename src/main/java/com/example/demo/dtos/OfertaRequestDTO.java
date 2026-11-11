package com.example.demo.dtos;

import java.math.BigDecimal;

public record OfertaRequestDTO(Integer imovelId, String tipo, BigDecimal valorProposto, String mensagem) {
}