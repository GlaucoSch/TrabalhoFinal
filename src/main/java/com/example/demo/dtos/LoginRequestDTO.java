package com.example.demo.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;

public record LoginRequestDTO(String email, @JsonAlias("password") String senha) {
}
