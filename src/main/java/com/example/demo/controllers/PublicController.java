package com.example.demo.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.PublicRegisterRequestDTO;
import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.services.UserService;

@RestController
@RequestMapping("/public")
public class PublicController {
    private final UserService userService;

    public PublicController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@RequestBody PublicRegisterRequestDTO request) {
        UserModel user = new UserModel();
        user.setNome(request.nome());
        user.setEmail(request.email());
        user.setSenha(request.password());

        UserModel registeredUser = userService.registerPublic(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UserDTO(registeredUser));
    }
}
