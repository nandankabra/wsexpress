package com.shiptrack.auth.mapper;

import com.shiptrack.auth.dto.UserResponse;
import com.shiptrack.auth.entity.Role;
import com.shiptrack.auth.entity.User;
import org.mapstruct.Mapper;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    default UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.isEnabled(),
                toRoleNames(user.getRoles()),
                user.getCreatedAt()
        );
    }

    default Set<String> toRoleNames(Set<Role> roles) {
        return roles.stream().map(Role::getName).collect(Collectors.toSet());
    }
}
