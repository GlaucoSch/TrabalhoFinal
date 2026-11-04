package com.example.demo.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import com.example.demo.services.JwtTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.jwt.secret=bG9jYWwtZGV2LW9ubHktcmVwbGFjZS10aGlzLXNlY3JldC1rZXk=")
@AutoConfigureMockMvc
class SecurityAuthorizationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Test
    void shouldRequireAuthenticationForPropertyManagement() throws Exception {
        mockMvc.perform(post("/imovel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUserRoleForAdminRoutesAndAllowStatusUpdate() throws Exception {
        String token = tokenFor("user@example.com", "ROLE_USER");

        mockMvc.perform(post("/imovel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/imovel/999999/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"DISPONIVEL"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldAllowPublicPropertyQueries() throws Exception {
        mockMvc.perform(get("/imovel/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldExposePublicRegistrationWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/public/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldAllowAdminRoleToReachUserManagement() throws Exception {
        mockMvc.perform(post("/users")
                        .header("Authorization", "Bearer " + tokenFor("admin@example.com", "ROLE_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    private String tokenFor(String email, String role) {
        var authentication = new UsernamePasswordAuthenticationToken(
                email, "not-used", List.of(new SimpleGrantedAuthority(role)));
        return jwtTokenService.generateToken(authentication);
    }
}
