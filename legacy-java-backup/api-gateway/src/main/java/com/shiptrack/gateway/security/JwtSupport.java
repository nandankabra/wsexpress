package com.shiptrack.gateway.security;

import com.shiptrack.common.constants.SecurityConstants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Verifies JWTs signed by Auth Service using the shared HS256 secret sourced from Config Server. */
@Component
public class JwtSupport {

    private final SecretKey signingKey;

    public JwtSupport(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
    }

    @SuppressWarnings("unchecked")
    public Set<String> roles(Claims claims) {
        List<String> roles = claims.get(SecurityConstants.CLAIM_ROLES, List.class);
        return roles == null ? Set.of() : roles.stream().collect(Collectors.toSet());
    }
}
