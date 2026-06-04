package com.example.event;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record PublishEventRequest(
    @NotBlank(message = "clientMessageId must be a string") String clientMessageId,
    @NotBlank(message = "type must be a string") String type,
    Map<String, Object> payload,
    Boolean simulateFailure
) {}
