package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class UserServiceTest {

    @Test
    void publicRegistrationAlwaysCreatesUserRoleAndEncodesPassword() {
        UserRepository repository = mock(UserRepository.class);
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        UserService service = new UserService(repository, passwordEncoder);
        when(repository.existsByEmail("ana@example.com")).thenReturn(false);
        when(repository.save(org.mockito.ArgumentMatchers.any(UserModel.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserModel request = new UserModel();
        request.setNome("Ana");
        request.setEmail("ana@example.com");
        request.setSenha("secret");
        request.setTipo("ADMIN");

        UserModel created = service.registerPublic(request);

        assertEquals("USER", created.getTipo());
        assertTrue(passwordEncoder.matches("secret", created.getSenha()));
    }
}
