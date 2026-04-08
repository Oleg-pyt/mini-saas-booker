package com.benatti.backend.security;

import com.benatti.backend.repository.UsersDAO;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UsersDAO usersDAO;
    private final RevokedTokenService revokedTokenService;

    public JwtAuthenticationFilter(JwtService jwtService, UsersDAO usersDAO, RevokedTokenService revokedTokenService) {
        this.jwtService = jwtService;
        this.usersDAO = usersDAO;
        this.revokedTokenService = revokedTokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        if (revokedTokenService.isRevoked(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String login;

        try {
            login = jwtService.extractLogin(token);
        } catch (Exception ex) {
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            usersDAO.findByLogin(login).ifPresent(user -> {
                if (jwtService.isTokenValid(token, user.getLogin())) {
                    String roleName = user.getRole() == null ? "USER" : user.getRole().name();
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            user.getLogin(),
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            });
        }

        filterChain.doFilter(request, response);
    }
}
