package academy.starci.sqlvsnosql.compare;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CompareController {

    private final CompareService compareService;

    public CompareController(CompareService compareService) {
        this.compareService = compareService;
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seed(@RequestParam(value = "count", defaultValue = "1000") int count) {
        Map<String, Object> result = compareService.seed(count);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compare(@RequestParam(value = "category", defaultValue = "Electronics") String category) {
        Map<String, Object> result = compareService.compare(category);
        return ResponseEntity.ok(result);
    }
}
