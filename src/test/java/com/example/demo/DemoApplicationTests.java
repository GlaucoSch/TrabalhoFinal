package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.jwt.secret=bG9jYWwtZGV2LW9ubHktcmVwbGFjZS10aGlzLXNlY3JldC1rZXk=")
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
