package com.example.demo.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;

public record PublicRegisterRequestDTO(
        String nome,
        String email,
        @JsonAlias("senha") String password,
        @JsonAlias("tipo") String role) {
}
