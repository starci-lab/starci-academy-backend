package academy.starci.sqlvsnosql.dto;

import java.util.Map;

public record CreateProductDto(
    String name,
    Double price,
    String category,
    Map<String, Object> metadata
) {}
