package com.Api_gateway.ApiGateWay.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import reactor.core.publisher.Mono;

/**
 * Spring Cloud Gateway routing configuration.
 * Routes are defined in application.yml under spring.cloud.gateway.routes.
 * This class is reserved for any programmatic route definitions or
 * filter bean declarations.
 */
@Configuration
public class GatewayConfig {
    @Bean
    public KeyResolver clientKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                return Mono.just("user:" + userId);
            }

            var remoteAddress = exchange.getRequest().getRemoteAddress();
            String clientAddress = remoteAddress == null
                    ? "unknown"
                    : remoteAddress.getAddress() == null
                            ? remoteAddress.getHostString()
                            : remoteAddress.getAddress().getHostAddress();
            return Mono.just("ip:" + clientAddress);
        };
    }
}
