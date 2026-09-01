package com.shiptrack.quote.service.impl;

import com.shiptrack.common.exception.ResourceNotFoundException;
import com.shiptrack.quote.client.CountryInfoDto;
import com.shiptrack.quote.dto.QuoteRequest;
import com.shiptrack.quote.entity.Quote;
import com.shiptrack.quote.repository.QuoteRepository;
import com.shiptrack.quote.service.CountryLookupService;
import com.shiptrack.quote.service.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    private static final BigDecimal BASE_FEE = BigDecimal.valueOf(10.00);
    private static final BigDecimal RATE_PER_KG = BigDecimal.valueOf(5.00);
    private static final BigDecimal INTERNATIONAL_SURCHARGE = BigDecimal.valueOf(20.00);

    private final QuoteRepository quoteRepository;
    private final CountryLookupService countryLookupService;

    @Override
    public Quote createQuote(QuoteRequest request, Long requestedByUserId) {
        CountryInfoDto origin = countryLookupService.lookup(request.originCountryCode());
        CountryInfoDto destination = countryLookupService.lookup(request.destinationCountryCode());

        BigDecimal amount = BASE_FEE.add(RATE_PER_KG.multiply(BigDecimal.valueOf(request.weightKg())));
        if (!origin.region().equals(destination.region())) {
            amount = amount.add(INTERNATIONAL_SURCHARGE);
        }
        amount = amount.setScale(2, RoundingMode.HALF_UP);

        Quote quote = new Quote();
        quote.setOriginCountryCode(request.originCountryCode());
        quote.setDestinationCountryCode(request.destinationCountryCode());
        quote.setWeightKg(request.weightKg());
        quote.setCarrierName(request.carrierName() != null ? request.carrierName() : "ShipTrack Standard");
        quote.setAmount(amount);
        quote.setCurrency(destination.currencyCode());
        quote.setRequestedByUserId(requestedByUserId);

        return quoteRepository.save(quote);
    }

    @Override
    public Quote findById(Long id) {
        return quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote " + id + " not found"));
    }

    @Override
    public Page<Quote> list(Pageable pageable) {
        return quoteRepository.findAll(pageable);
    }
}
