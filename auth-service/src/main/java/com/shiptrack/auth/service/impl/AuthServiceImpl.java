package com.shiptrack.auth.service.impl;

import com.shiptrack.auth.dto.*;
import com.shiptrack.auth.entity.Role;
import com.shiptrack.auth.entity.User;
import com.shiptrack.auth.mapper.UserMapper;
import com.shiptrack.auth.repository.RoleRepository;
import com.shiptrack.auth.repository.UserRepository;
import com.shiptrack.auth.security.JwtService;
import com.shiptrack.auth.security.UserPrincipal;
import com.shiptrack.auth.service.AuthService;
import com.shiptrack.common.exception.ConflictException;
import com.shiptrack.common.exception.ResourceNotFoundException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("A user with email " + request.email() + " already exists");
        }
        Set<Role> roles = request.roles().stream()
                .map(name -> roleRepository.findByName(name.toUpperCase())
                        .orElseThrow(() -> new ResourceNotFoundException("Unknown role: " + name)))
                .collect(Collectors.toSet());

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRoles(roles);

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (org.springframework.security.core.AuthenticationException ex) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs(), user.getId(), user.getEmail(),
                principal.getRoleNames());
    }

    @Override
    public ValidateResponse validate(String token) {
        try {
            Claims claims = jwtService.parseClaims(token);
            Set<String> roles = jwtService.extractRoles(claims);
            Long userId = claims.get("userId", Long.class);
            return new ValidateResponse(true, userId, claims.getSubject(), roles);
        } catch (JwtException | IllegalArgumentException ex) {
            return new ValidateResponse(false, null, null, Set.of());
        }
    }

    @Override
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toResponse);
    }
}
