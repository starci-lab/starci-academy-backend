package com.example.event;

import java.util.Map;

public record Envelope(
    String clientMessageId,
    String type,
    Map<String, Object> payload,
    Boolean simulateFailure
) {}
