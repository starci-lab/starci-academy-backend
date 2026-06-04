package com.example.event;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.logging.Logger;

@RestController
@RequestMapping("/events")
@Validated
public class EventController {
    private static final Logger logger = Logger.getLogger(EventController.class.getName());

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String topic;

    public EventController(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${app.topic}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    @PostMapping
    public ResponseEntity<PublishEventResponse> publish(@Valid @RequestBody PublishEventRequest request) {
        String partitionKey = request.partitionKey();
        
        Envelope envelope = new Envelope(
            request.type(),
            request.payload(),
            partitionKey,
            Instant.now().toString()
        );

        kafkaTemplate.send(topic, partitionKey, envelope);
        logger.info("Produced to " + topic + " key=" + partitionKey);

        PublishEventResponse response = new PublishEventResponse(
            "queued",
            topic,
            partitionKey
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
