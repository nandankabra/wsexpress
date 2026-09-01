package com.shiptrack.quote.controller;

import com.shiptrack.common.constants.SecurityConstants;
import com.shiptrack.quote.dto.QuoteRequest;
import com.shiptrack.quote.dto.QuoteResponse;
import com.shiptrack.quote.mapper.QuoteMapper;
import com.shiptrack.quote.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Tag(name = "Quotes", description = "Carrier shipping quotes enriched via Country Service")
public class QuoteController {

    private final QuoteService quoteService;
    private final QuoteMapper quoteMapper;

    @PostMapping
    @Operation(summary = "Request a carrier quote")
    public ResponseEntity<QuoteResponse> create(
            @Valid @RequestBody QuoteRequest request,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, required = false) Long userId) {
        var quote = quoteService.createQuote(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(quoteMapper.toResponse(quote));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a quote by id")
    public ResponseEntity<QuoteResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(quoteMapper.toResponse(quoteService.findById(id)));
    }

    @GetMapping
    @Operation(summary = "List quotes (paginated)")
    public ResponseEntity<Page<QuoteResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(quoteService.list(pageable).map(quoteMapper::toResponse));
    }
}
