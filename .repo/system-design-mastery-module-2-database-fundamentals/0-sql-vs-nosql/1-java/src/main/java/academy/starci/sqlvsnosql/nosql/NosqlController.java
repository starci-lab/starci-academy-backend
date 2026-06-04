package academy.starci.sqlvsnosql.nosql;

import academy.starci.sqlvsnosql.dto.CreateProductDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/nosql")
public class NosqlController {

    private final NosqlService nosqlService;

    public NosqlController(NosqlService nosqlService) {
        this.nosqlService = nosqlService;
    }

    @PostMapping("/products")
    public ResponseEntity<ProductDocument> create(@RequestBody CreateProductDto dto) {
        ProductDocument created = nosqlService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/products")
    public List<ProductDocument> findAll() {
        return nosqlService.findAll();
    }

    @GetMapping("/products/category/{cat}")
    public List<ProductDocument> findByCategory(@PathVariable("cat") String category) {
        return nosqlService.findByCategory(category);
    }
}
