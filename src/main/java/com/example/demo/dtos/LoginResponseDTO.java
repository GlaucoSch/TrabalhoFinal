package com.example.demo.dtos;

public record LoginResponseDTO(String token, String tipo, long expiresIn) {
}
