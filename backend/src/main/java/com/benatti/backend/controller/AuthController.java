package com.benatti.backend.controller;

import com.benatti.api.AuthApi;
import com.benatti.api.model.AuthResponse;
import com.benatti.api.model.AuthUser;
import com.benatti.api.model.LoginRequest;
import com.benatti.api.model.RegisterRequest;
import com.benatti.backend.service.AuthApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController implements AuthApi {
    private final AuthApplicationService authApplicationService;
    private final HttpServletRequest request;

    public AuthController(AuthApplicationService authApplicationService, HttpServletRequest request) {
        this.authApplicationService = authApplicationService;
        this.request = request;
    }

    @Override
    public ResponseEntity<AuthResponse> login(LoginRequest loginRequest) {
        return ResponseEntity.ok(authApplicationService.login(loginRequest));
    }

    @Override
    public ResponseEntity<AuthResponse> register(RegisterRequest registerRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authApplicationService.register(registerRequest));
    }

    @Override
    public ResponseEntity<Void> logout() {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        authApplicationService.logout(header.substring(7));
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<AuthUser> validateToken() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(authApplicationService.validateToken(authentication.getName()));
    }
}
