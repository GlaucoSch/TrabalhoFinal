package com.example.demo.services;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dtos.UserDTO;
import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Service
public class UserService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserModel> getAllUsers() {
        return repository.findAll();
    }

    public UserModel find(Integer id) {
        Optional<UserModel> user = repository.findById(id);
        return user.orElse(null);
    }

    public UserModel insert(UserModel user) {
        validateNewUser(user);
        user.setTipo(normalizeRole(user.getTipo()));
        user.setSenha(passwordEncoder.encode(user.getSenha()));
        return repository.save(user);
    }

    public UserModel registerPublic(UserModel user) {
        validateNewUser(user);
        user.setTipo("USER");
        user.setSenha(passwordEncoder.encode(user.getSenha()));
        return repository.save(user);
    }

    private void validateNewUser(UserModel user) {
        if (user.getEmail() == null || user.getEmail().isBlank()
                || user.getSenha() == null || user.getSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email e senha são obrigatórios");
        }
        if (repository.existsByEmail(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um usuário com este email");
        }
        user.setId(null);
    }

    public UserModel update(UserModel user) {
        UserModel existingUser = repository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        if (user.getNome() != null) {
            existingUser.setNome(user.getNome());
        }
        if (user.getEmail() != null) {
            if (!Objects.equals(existingUser.getEmail(), user.getEmail())
                    && repository.existsByEmail(user.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um usuário com este email");
            }
            existingUser.setEmail(user.getEmail());
        }
        if (user.getSenha() != null && !user.getSenha().isBlank()) {
            existingUser.setSenha(passwordEncoder.encode(user.getSenha()));
        }
        if (user.getTipo() != null) {
            existingUser.setTipo(normalizeRole(user.getTipo()));
        }
        return repository.save(existingUser);
    }

    public UserModel update(UserDTO dto) {
        UserModel model = repository.findById(dto.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        if (dto.getNome() != null) {
            model.setNome(dto.getNome());
        }
        if (dto.getEmail() != null) {
            if (!Objects.equals(model.getEmail(), dto.getEmail()) && repository.existsByEmail(dto.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um usuário com este email");
            }
            model.setEmail(dto.getEmail());
        }
        if (dto.getTipo() != null) {
            model.setTipo(normalizeRole(dto.getTipo()));
        }
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            model.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        return repository.save(model);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private String normalizeRole(String tipo) {
        String role = tipo == null || tipo.isBlank()
                ? "USER"
                : tipo.trim().toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "");
        if (!role.equals("ADMIN") && !role.equals("USER")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O papel deve ser ADMIN ou USER");
        }
        return role;
    }
}
