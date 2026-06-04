package com.example.event;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

@Component
@ConditionalOnExpression("!'${spring.kafka.consumer.group-id:}'.isEmpty()")
public class EventConsumer {
    private static final Logger logger = Logger.getLogger(EventConsumer.class.getName());
    private final AtomicInteger processed = new AtomicInteger(0);

    @Value("${app.client-id:consumer-fast}")
    private String clientId;

    @Value("${app.consumer-delay-ms:0}")
    private long consumerDelayMs;

    @KafkaListener(topics = "${app.topic}")
    public void listen(Envelope data) throws InterruptedException {
        if (consumerDelayMs > 0) {
            Thread.sleep(consumerDelayMs);
        }
        int count = processed.incrementAndGet();
        String partitionKey = data.partitionKey() != null ? data.partitionKey() : "?";
        String type = data.type() != null ? data.type() : "?";
        logger.info("[" + clientId + "] #" + count + " partitionKey=" + partitionKey + " type=" + type);
    }
}
