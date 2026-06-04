package academy.starci.sharding.users;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UsersController {

    private final UsersService usersService;

    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }

    @PostMapping("/users")
    public ResponseEntity<UserDocument> createUser(@RequestBody UserDocument user) {
        UserDocument created = usersService.create(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDocument> findByUserId(@PathVariable("userId") String userId) {
        return usersService.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/country/{country}")
    public ResponseEntity<List<UserDocument>> findByCountry(@PathVariable("country") String country) {
        List<UserDocument> users = usersService.findByCountry(country);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/tier/{tier}")
    public ResponseEntity<List<UserDocument>> findByTier(@PathVariable("tier") String tier) {
        List<UserDocument> users = usersService.findByTier(tier);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/seed/{count}")
    public ResponseEntity<Map<String, Object>> seed(@PathVariable("count") int count) {
        Map<String, Object> result = usersService.seed(count);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/shards/distribution")
    public ResponseEntity<Map<String, Object>> getShardDistribution() {
        Map<String, Object> result = usersService.getShardDistribution();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/shards/status")
    public ResponseEntity<Map<String, Object>> getShardStatus() {
        Map<String, Object> result = usersService.getShardStatus();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/shards/explain")
    public ResponseEntity<Map<String, Object>> explainQuery(
            @RequestParam("field") String field,
            @RequestParam("value") String value) {
        Map<String, Object> result = usersService.explainQuery(field, value);
        return ResponseEntity.ok(result);
    }
}
