package com.example.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record PublishEventRequest(
    String partitionKey,
    @NotBlank(message = "type must be a string") String type,
    @NotNull(message = "payload must be an object") Map<String, Object> payload
) {}
