package com.shiptrack.quote.service;

import com.shiptrack.quote.dto.QuoteRequest;
import com.shiptrack.quote.entity.Quote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface QuoteService {
    Quote createQuote(QuoteRequest request, Long requestedByUserId);

    Quote findById(Long id);

    Page<Quote> list(Pageable pageable);
}
