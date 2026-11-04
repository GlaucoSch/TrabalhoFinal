package com.example.demo.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Component
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository userRepository;
    private final UserService userService;
    private final String email;
    private final String password;

    public AdminBootstrap(
            UserRepository userRepository,
            UserService userService,
            @Value("${app.bootstrap-admin.email:}") String email,
            @Value("${app.bootstrap-admin.password:}") String password) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(email) && !StringUtils.hasText(password)) {
            return;
        }
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD devem ser informados juntos");
        }
        if (userRepository.existsByEmail(email)) {
            return;
        }

        UserModel admin = new UserModel();
        admin.setNome("Administrador");
        admin.setEmail(email);
        admin.setSenha(password);
        admin.setTipo("ADMIN");
        userService.insert(admin);
    }
}
