package com.starci.inventoryservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryConsumer {

    @Autowired
    private ObjectMapper objectMapper;

    @KafkaListener(topics = "order-events", groupId = "inventory-consumer")
    public void consume(String message) {
        try {
            JsonNode payload = objectMapper.readTree(message);
            String eventType = payload.get("eventType").asText();
            if ("ORDER_CREATED".equals(eventType)) {
                int orderId = payload.get("orderId").asInt();
                String productName = payload.get("productName").asText();
                int quantity = payload.get("quantity").asInt();

                System.out.println("inventory-service  | Received ORDER_CREATED: order " + orderId + " (" + productName + " x" + quantity + ")");
                System.out.println("inventory-service  | Decrementing stock for \"" + productName + "\" by " + quantity + "...");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
