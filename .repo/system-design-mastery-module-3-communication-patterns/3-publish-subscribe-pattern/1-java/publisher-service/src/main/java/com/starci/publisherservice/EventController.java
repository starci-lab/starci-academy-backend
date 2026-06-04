package com.starci.publisherservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.nats.client.Connection;
import io.nats.client.Nats;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/events")
public class EventController {

      private Connection natsConnection;

      @Autowired
      private ObjectMapper objectMapper;

      @PostConstruct
      public void init() {
          try {
              natsConnection = Nats.connect("nats://localhost:4222");
          } catch (Exception e) {
              System.err.println("NATS Connection failed: " + e.getMessage());
          }
      }

      @PreDestroy
      public void cleanup() {
          if (natsConnection != null) {
              try {
                  natsConnection.close();
              } catch (Exception e) {
                  // Ignore
              }
          }
      }

      @PostMapping
      public ResponseEntity<Map<String, Object>> publishEvent(@RequestBody Map<String, Object> body) {
          try {
              String type = (String) body.get("type");
              Object payload = body.get("payload");

              Map<String, Object> event = new LinkedHashMap<>();
              event.put("type", type);
              event.put("payload", payload);
              event.put("timestamp", Instant.now().toString());

              String json = objectMapper.writeValueAsString(event);
              if (natsConnection != null) {
                  natsConnection.publish("app.events", json.getBytes(StandardCharsets.UTF_8));
              }

              Map<String, Object> response = new LinkedHashMap<>();
              response.put("status", "published");
              response.put("subject", "app.events");
              response.put("event", event);

              return ResponseEntity.status(HttpStatus.CREATED).body(response);
          } catch (Exception e) {
              Map<String, Object> error = new HashMap<>();
              error.put("error", e.getMessage());
              return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
          }
      }
}
