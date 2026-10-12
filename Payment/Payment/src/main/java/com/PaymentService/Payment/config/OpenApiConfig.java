package com.PaymentService.Payment.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI paymentServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Payment Service API")
                        .description("Microservice for Billing calculation, Payment Gateway capture, Provider Payouts, Commissions, and Receipts")
                        .version("v1.0.0")
                        .contact(new Contact().name("Luggage Storage Marketplace Engineering")));
    }
}
