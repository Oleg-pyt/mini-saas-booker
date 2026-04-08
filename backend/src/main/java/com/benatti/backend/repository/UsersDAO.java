package com.benatti.backend.repository;

import com.benatti.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsersDAO extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByLogin(String login);
    java.util.List<UserEntity> findTop20ByLoginContainingIgnoreCaseOrderByLoginAsc(String query);
    boolean existsByLogin(String login);
    boolean existsByEmail(String email);
}
