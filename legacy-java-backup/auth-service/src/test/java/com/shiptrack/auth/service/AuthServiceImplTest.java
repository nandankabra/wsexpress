package com.shiptrack.auth.service;

import com.shiptrack.auth.dto.RegisterRequest;
import com.shiptrack.auth.entity.Role;
import com.shiptrack.auth.mapper.UserMapper;
import com.shiptrack.auth.repository.RoleRepository;
import com.shiptrack.auth.repository.UserRepository;
import com.shiptrack.auth.security.JwtService;
import com.shiptrack.auth.service.impl.AuthServiceImpl;
import com.shiptrack.common.exception.ConflictException;
import com.shiptrack.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest request;

    @BeforeEach
    void setUp() {
        request = new RegisterRequest("new.user@shiptrack.dev", "Password@123", "New User", Set.of("VIEWER"));
    }

    @Test
    void register_throwsConflict_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining(request.email());
    }

    @Test
    void register_throwsNotFound_whenRoleUnknown() {
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(roleRepository.findByName("VIEWER")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void register_savesUser_whenRoleExistsAndEmailIsFree() {
        Role viewerRole = new Role("VIEWER");
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(roleRepository.findByName("VIEWER")).thenReturn(Optional.of(viewerRole));
        when(passwordEncoder.encode(request.password())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any())).thenReturn(
                new com.shiptrack.auth.dto.UserResponse(1L, request.email(), request.fullName(), true,
                        Set.of("VIEWER"), java.time.Instant.now()));

        var response = authService.register(request);

        assertThat(response.email()).isEqualTo(request.email());
        assertThat(response.roles()).containsExactly("VIEWER");
    }
}
