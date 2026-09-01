package com.shiptrack.graphql.dto;

import java.util.List;

/** Mirrors just the fields we need from Spring Data's Page<T> JSON representation. */
public record PageResponseDto<T>(List<T> content) {
}
