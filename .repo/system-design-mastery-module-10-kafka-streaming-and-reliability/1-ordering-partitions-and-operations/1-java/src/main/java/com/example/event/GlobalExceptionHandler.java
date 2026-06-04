package com.example.event;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> {
                    if ("partitionKey".equals(err.getField())) {
                        return "partitionKey must be a string";
                    }
                    return err.getDefaultMessage();
                })
                .collect(Collectors.toList());

        Map<String, Object> body = Map.of(
            "statusCode", 400,
            "message", errors,
            "error", "Bad Request"
        );
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
}
