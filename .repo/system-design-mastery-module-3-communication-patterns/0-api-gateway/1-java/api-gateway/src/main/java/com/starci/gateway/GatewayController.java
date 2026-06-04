package com.starci.gateway;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
public class GatewayController {

    private final RestTemplate restTemplate = new RestTemplate();

    @RequestMapping(value = {
        "/users", "/users/**",
        "/products", "/products/**",
        "/orders", "/orders/**"
    })
    public ResponseEntity<byte[]> proxy(
            @RequestBody(required = false) byte[] body,
            HttpMethod method,
            HttpServletRequest request) {

        String path = request.getRequestURI();
        String targetUri;
        if (path.startsWith("/users")) {
            targetUri = "http://localhost:3001" + path;
        } else if (path.startsWith("/products")) {
            targetUri = "http://localhost:3002" + path;
        } else if (path.startsWith("/orders")) {
            targetUri = "http://localhost:3003" + path;
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"message\":\"No route for %s\"}", path).getBytes());
        }

        if (request.getQueryString() != null) {
            targetUri += "?" + request.getQueryString();
        }

        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).forEach(headerName -> {
            Collections.list(request.getHeaders(headerName)).forEach(headerValue -> {
                headers.add(headerName, headerValue);
            });
        });

        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);
        try {
            return restTemplate.exchange(targetUri, method, entity, byte[].class);
        } catch (HttpStatusCodeException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .headers(ex.getResponseHeaders())
                    .body(ex.getResponseBodyAsByteArray());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(String.format("{\"message\":\"Bad Gateway: %s\"}", ex.getMessage()).getBytes());
        }
    }

    @RequestMapping(value = "/**")
    public ResponseEntity<String> handleNotFound(HttpServletRequest request) {
        String path = request.getRequestURI();
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.APPLICATION_JSON)
                .body(String.format("{\"message\":\"No route for %s\"}", path));
    }
}
