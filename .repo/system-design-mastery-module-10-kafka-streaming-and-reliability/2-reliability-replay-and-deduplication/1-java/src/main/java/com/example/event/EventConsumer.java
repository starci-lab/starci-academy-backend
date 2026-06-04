package com.example.event;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.util.logging.Logger;

@Component
@ConditionalOnExpression("!'${spring.kafka.consumer.group-id:}'.isEmpty()")
public class EventConsumer {
    private static final Logger logger = Logger.getLogger(EventConsumer.class.getName());

    private final StringRedisTemplate redisTemplate;
    private final ProcessedEventRepository processedEventRepository;

    @Value("${app.topic:reliability-events}")
    private String topicName;

    public EventConsumer(StringRedisTemplate redisTemplate, ProcessedEventRepository processedEventRepository) {
        this.redisTemplate = redisTemplate;
        this.processedEventRepository = processedEventRepository;
    }

    @KafkaListener(topics = "${app.topic}")
    public void listen(Envelope data) {
        String clientMessageId = data.clientMessageId();
        if (clientMessageId == null) {
            clientMessageId = "<unknown>";
        }

        try {
            // Redis SETNX
            String dedupKey = "dedup:event:" + clientMessageId;
            Boolean isNew = redisTemplate.opsForValue().setIfAbsent(dedupKey, "1", Duration.ofSeconds(3600));
            if (isNew == null || !isNew) {
                logger.info("Duplicate skipped clientMessageId=" + clientMessageId);
                return;
            }

            // Simulate Failure
            if (Boolean.TRUE.equals(data.simulateFailure())) {
                throw new RuntimeException("Simulated processing failure for DLQ demo");
            }

            // Redis INCR sequence
            Long seq = redisTemplate.opsForValue().increment("reliability:sequence");
            if (seq == null) {
                seq = 1L;
            }

            // Postgres save
            ProcessedEvent entity = new ProcessedEvent();
            entity.setClientMessageId(clientMessageId);
            entity.setEventType(data.type());
            entity.setSequence(seq);
            processedEventRepository.save(entity);

            logger.info("Processed " + clientMessageId + " seq=" + seq + " topic=" + topicName);

        } catch (DataIntegrityViolationException e) {
            // Postgres unique constraint violation
            logger.info("Duplicate skipped clientMessageId=" + clientMessageId);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Simulated processing failure")) {
                logger.severe("Failed: Simulated processing failure for DLQ demo — will retry / DLQ via Kafka");
            } else {
                logger.severe("Failed: " + e.getMessage() + " — will retry / DLQ via Kafka");
            }
            throw e;
        }
    }
}
