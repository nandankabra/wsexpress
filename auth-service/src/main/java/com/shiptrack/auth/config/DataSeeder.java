package com.shiptrack.auth.config;

import com.shiptrack.auth.entity.Role;
import com.shiptrack.auth.entity.User;
import com.shiptrack.auth.repository.RoleRepository;
import com.shiptrack.auth.repository.UserRepository;
import com.shiptrack.common.constants.SecurityConstants;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/** Seeds the three fixed roles and one demo admin account so the platform is usable on first boot. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_ADMIN_EMAIL = "admin@shiptrack.dev";
    private static final String DEMO_ADMIN_PASSWORD = "Admin@123";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        for (String roleName : List.of(SecurityConstants.ROLE_ADMIN, SecurityConstants.ROLE_MANAGER,
                SecurityConstants.ROLE_VIEWER)) {
            roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)));
        }

        if (!userRepository.existsByEmail(DEMO_ADMIN_EMAIL)) {
            Role adminRole = roleRepository.findByName(SecurityConstants.ROLE_ADMIN).orElseThrow();
            User admin = new User();
            admin.setEmail(DEMO_ADMIN_EMAIL);
            admin.setPassword(passwordEncoder.encode(DEMO_ADMIN_PASSWORD));
            admin.setFullName("ShipTrack Administrator");
            admin.setRoles(Set.of(adminRole));
            userRepository.save(admin);
            log.info("Seeded demo admin account: {} / {}", DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD);
        }
    }
}
