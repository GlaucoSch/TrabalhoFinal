package com.example.demo.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;

class UserModelTest {

    @Test
    void shouldCreateUserAndExposeIdAndName() {
        UserModel user = new UserModel(1, "Ana", "ana@example.com", "secret", "ADMIN");

        assertEquals(1, user.getId());
        assertEquals("Ana", user.getNome());
    }

    @Test
    void shouldUpdateIdAndName() {
        UserModel user = new UserModel();

        user.setId(2);
        user.setNome("Bruno");

        assertEquals(2, user.getId());
        assertEquals("Bruno", user.getNome());
    }

    @Test
    void shouldCompareUsersByIdAndName() {
        UserModel first = new UserModel(1, "Ana", "first@example.com", "one", "USER");
        UserModel equal = new UserModel(1, "Ana", "second@example.com", "two", "ADMIN");
        UserModel differentName = new UserModel(1, "Bruno", "first@example.com", "one", "USER");

        assertEquals(first, equal);
        assertEquals(first.hashCode(), equal.hashCode());
        assertNotEquals(first, differentName);
        assertNotEquals(first, null);
        assertNotEquals(first, "not a user");
    }
}