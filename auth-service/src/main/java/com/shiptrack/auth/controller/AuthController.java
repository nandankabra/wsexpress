package com.shiptrack.auth.controller;

import com.shiptrack.auth.dto.*;
import com.shiptrack.auth.service.AuthService;
import com.shiptrack.common.constants.SecurityConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Registration, login, token validation and user administration")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user with one or more roles")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive a JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate a bearer token (used by the API Gateway)")
    public ResponseEntity<ValidateResponse> validate(
            @RequestHeader(value = SecurityConstants.AUTHORIZATION_HEADER, required = false) String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ValidateResponse(false, null, null, java.util.Set.of()));
        }
        String token = authorizationHeader.startsWith(SecurityConstants.BEARER_PREFIX)
                ? authorizationHeader.substring(SecurityConstants.BEARER_PREFIX.length())
                : authorizationHeader;
        ValidateResponse result = authService.validate(token);
        return result.valid() ? ResponseEntity.ok(result) : ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (ADMIN only)")
    public ResponseEntity<Page<UserResponse>> listUsers(Pageable pageable) {
        return ResponseEntity.ok(authService.listUsers(pageable));
    }
}
