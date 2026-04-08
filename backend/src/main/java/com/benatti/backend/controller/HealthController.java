package com.benatti.backend.controller;

import com.benatti.api.HealthApi;
import com.benatti.api.model.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Implements the generated HealthApi interface from api-java module.
 * The interface is generated from api/swagger.json by openapi-generator.
 * Override any default methods here to provide custom behavior.
 */
@RestController
public class HealthController implements HealthApi {

    @Override
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = new HealthResponse();
        response.setStatus("UP");
        return ResponseEntity.ok(response);
    }
}

