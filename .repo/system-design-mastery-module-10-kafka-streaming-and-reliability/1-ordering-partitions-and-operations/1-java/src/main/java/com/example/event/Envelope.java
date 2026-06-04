package com.example.event;

import java.util.Map;

public record Envelope(
    String type,
    Map<String, Object> payload,
    String partitionKey,
    String timestamp
) {}
