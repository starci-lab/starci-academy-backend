package academy.starci.indexing.products;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProductsController {

    private final ProductsService productsService;

    public ProductsController(ProductsService productsService) {
        this.productsService = productsService;
    }

    @PostMapping("/seed/{count}")
    public ResponseEntity<Map<String, Object>> seed(@PathVariable("count") int count) {
        Map<String, Object> result = productsService.seed(count);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/query/no-index")
    public ResponseEntity<Map<String, Object>> findWithoutIndex(@RequestParam("category") String category) {
        Map<String, Object> result = productsService.findWithoutIndex(category);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/query/with-index")
    public ResponseEntity<Map<String, Object>> findWithIndex(
            @RequestParam("category") String category,
            @RequestParam("minPrice") double minPrice) {
        Map<String, Object> result = productsService.findWithIndex(category, minPrice);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/explain")
    public ResponseEntity<Map<String, Object>> explainQuery(@RequestParam("sql") String sql) {
        Map<String, Object> result = productsService.explainQuery(sql);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareQueries() {
        Map<String, Object> result = productsService.compareQueries();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTableStats() {
        Map<String, Object> result = productsService.getTableStats();
        return ResponseEntity.ok(result);
    }
}
