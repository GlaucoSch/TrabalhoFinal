package com.example.demo.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.services.UserService;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping(value = "/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping()
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserModel> listaNormal = userService.getAllUsers();
        List<UserDTO> listaDtos = listaNormal.stream().map(usuario -> new UserDTO(usuario))
				.collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.OK).body(listaDtos);
    }

    @PostMapping()
    public ResponseEntity<UserModel> createUser(@RequestBody UserModel user) {
        UserModel savedUser = userService.insert(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

 
    @GetMapping(value = "/{id}")
    public ResponseEntity<UserDTO> find(@PathVariable Integer id) {
        UserModel model = userService.find(id);
        UserDTO dto = new UserDTO(model);
        return ResponseEntity.status(HttpStatus.OK).body(dto);
    }

    public ResponseEntity<UserDTO> getUserById(int id) {
        return find(id);
    }

    @PutMapping(value = "/{id}")
    public ResponseEntity<Void> update(@RequestBody UserDTO dto, @PathVariable Integer id) {
        dto.setId(id);
        userService.update(dto);
        return ResponseEntity.noContent().build();
    }


     @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable int id) {
        UserModel usuario = userService.find(id);

        if (usuario != null) {
            userService.delete(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }   
    }
}
