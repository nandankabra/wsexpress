package com.shiptrack.graphql.resolver;

import com.shiptrack.graphql.client.QuoteClient;
import com.shiptrack.graphql.dto.QuoteDto;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class QuoteGraphQLController {

    private final QuoteClient quoteClient;

    @QueryMapping
    public QuoteDto quote(@Argument Long id) {
        return quoteClient.getById(id);
    }
}
