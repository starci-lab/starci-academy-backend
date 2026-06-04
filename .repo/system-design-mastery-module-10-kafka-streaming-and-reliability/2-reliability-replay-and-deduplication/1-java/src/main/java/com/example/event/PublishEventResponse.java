package com.example.event;

public record PublishEventResponse(
    String status,
    String topic,
    String key
) {}
