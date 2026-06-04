package academy.starci.sqlvsnosql.sql;

import academy.starci.sqlvsnosql.dto.CreateProductDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sql")
public class SqlController {

    private final SqlService sqlService;

    public SqlController(SqlService sqlService) {
        this.sqlService = sqlService;
    }

    @PostMapping("/products")
    public ResponseEntity<ProductEntity> create(@RequestBody CreateProductDto dto) {
        ProductEntity created = sqlService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/products")
    public List<ProductEntity> findAll() {
        return sqlService.findAll();
    }

    @GetMapping("/products/category/{cat}")
    public List<ProductEntity> findByCategory(@PathVariable("cat") String category) {
        return sqlService.findByCategory(category);
    }
}
