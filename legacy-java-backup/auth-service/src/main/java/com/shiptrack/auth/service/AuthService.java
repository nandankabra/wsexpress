package com.shiptrack.auth.service;

import com.shiptrack.auth.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuthService {
    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    ValidateResponse validate(String token);

    Page<UserResponse> listUsers(Pageable pageable);
}
