package com.shiptrack.quote.mapper;

import com.shiptrack.quote.dto.QuoteResponse;
import com.shiptrack.quote.entity.Quote;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface QuoteMapper {
    QuoteResponse toResponse(Quote quote);
}
