package com.benatti.backend.service;

import com.benatti.api.model.AuthResponse;
import com.benatti.api.model.AuthUser;
import com.benatti.api.model.LoginRequest;
import com.benatti.api.model.RegisterRequest;
import com.benatti.backend.entity.UserRole;
import com.benatti.backend.entity.UserEntity;
import com.benatti.backend.repository.UsersDAO;
import com.benatti.backend.security.JwtService;
import com.benatti.backend.security.RevokedTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class AuthApplicationService {
    private final UsersDAO usersDAO;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RevokedTokenService revokedTokenService;

    public AuthApplicationService(
            UsersDAO usersDAO,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RevokedTokenService revokedTokenService
    ) {
        this.usersDAO = usersDAO;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.revokedTokenService = revokedTokenService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (usersDAO.existsByLogin(request.getLogin())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Login already exists");
        }
        if (usersDAO.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        UserEntity user = new UserEntity();
        user.setName(request.getName());
        user.setLogin(request.getLogin());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);

        UserEntity saved = usersDAO.save(user);
        return buildAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        UserEntity user = usersDAO.findByLogin(request.getLogin())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return buildAuthResponse(user);
    }

    public AuthUser validateToken(String login) {
        UserEntity user = usersDAO.findByLogin(login)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token"));

        return new AuthUser()
                .id(user.getId())
                .name(user.getName())
                .login(user.getLogin())
            .email(user.getEmail())
            .role(user.getRole() == UserRole.BUSINESS_OWNER ? AuthUser.RoleEnum.BUSINESS_OWNER : AuthUser.RoleEnum.USER);
    }

    public void logout(String token) {
        revokedTokenService.revoke(token, jwtService.extractExpiration(token));
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        String token = jwtService.generateToken(
                user.getLogin(),
            Map.of(
                "uid", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole() == null ? UserRole.USER.name() : user.getRole().name()
            )
        );

        AuthUser authUser = new AuthUser()
                .id(user.getId())
                .name(user.getName())
                .login(user.getLogin())
            .email(user.getEmail())
            .role(user.getRole() == UserRole.BUSINESS_OWNER ? AuthUser.RoleEnum.BUSINESS_OWNER : AuthUser.RoleEnum.USER);

        return new AuthResponse()
                .accessToken(token)
                .tokenType("Bearer")
                .user(authUser);
    }
}
