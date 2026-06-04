package com.starci.subscribernotification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nats.client.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class NotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}

@Component
class NatsSubscriberRunner implements CommandLineRunner {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        try {
            Connection nc = Nats.connect("nats://localhost:4222");
            Dispatcher d = nc.createDispatcher((msg) -> {
                try {
                    String str = new String(msg.getData(), StandardCharsets.UTF_8);
                    JsonNode event = objectMapper.readTree(str);
                    String type = event.get("type").asText();
                    JsonNode payload = event.get("payload");

                    // Print NestJS-like standard log prefix
                    System.out.println("notification: " + str);

                    // Print the required event log format
                    System.out.println("{ \"service\": \"notification\", \"received\": { \"type\": \"" + type + "\", \"payload\": " + payload.toString() + " } }");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
            d.subscribe("app.events");
            System.out.println("NATS subscriber-notification connected and subscribed to app.events");
            Thread.currentThread().join();
        } catch (Exception e) {
            System.err.println("NATS Subscriber error: " + e.getMessage());
        }
    }
}
