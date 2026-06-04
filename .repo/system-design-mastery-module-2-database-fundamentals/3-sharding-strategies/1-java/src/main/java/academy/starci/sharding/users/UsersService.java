package academy.starci.sharding.users;

import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

@Service
public class UsersService {

    private static final String[] COUNTRIES = {
        "US", "UK", "DE", "FR", "JP", "KR", "IN", "BR", "AU", "CA",
        "SG", "VN", "TH", "ID", "MX", "ES", "IT", "NL", "SE", "PL"
    };

    private static final String[] TIERS = {"free", "pro", "enterprise"};

    private static final String[] FIRST_NAMES = {
        "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace",
        "Henry", "Iris", "Jack", "Karen", "Leo", "Mia", "Noah", "Olivia"
    };

    private static final String[] LAST_NAMES = {
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
        "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"
    };

    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public UsersService(UserRepository userRepository, MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public UserDocument create(UserDocument user) {
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(Instant.now());
        }
        return userRepository.save(user);
    }

    public Optional<UserDocument> findByUserId(String userId) {
        return userRepository.findByUserId(userId);
    }

    public List<UserDocument> findByCountry(String country) {
        return userRepository.findByCountry(country);
    }

    public List<UserDocument> findByTier(String tier) {
        return userRepository.findByTier(tier);
    }

    public Map<String, Object> seed(int count) {
        Random rand = new Random();
        List<UserDocument> users = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            String firstName = FIRST_NAMES[rand.nextInt(FIRST_NAMES.length)];
            String lastName = LAST_NAMES[rand.nextInt(LAST_NAMES.length)];
            String suffix = Long.toString(System.currentTimeMillis(), 36) + Integer.toString(rand.nextInt(100000), 36);

            UserDocument user = new UserDocument();
            user.setUserId(String.format("user-%s-%d", suffix, i));
            user.setEmail(String.format("%s.%s.%s@example.com", firstName.toLowerCase(), lastName.toLowerCase(), suffix));
            user.setName(firstName + " " + lastName);
            user.setCountry(COUNTRIES[rand.nextInt(COUNTRIES.length)]);
            user.setTier(TIERS[rand.nextInt(TIERS.length)]);
            user.setLoginCount(rand.nextInt(500));
            user.setLastLoginAt(Instant.now().minusSeconds(rand.nextInt(30 * 24 * 3600)));
            user.setCreatedAt(Instant.now().minusSeconds(rand.nextInt(365 * 24 * 3600)));
            users.add(user);
        }

        userRepository.saveAll(users);

        Map<String, Object> result = new HashMap<>();
        result.put("inserted", users.size());
        return result;
    }

    public Map<String, Object> getShardDistribution() {
        Document command = new Document("collStats", "users");
        Document stats = mongoTemplate.executeCommand(command);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ns", stats.get("ns"));
        result.put("sharded", stats.get("sharded"));
        result.put("count", stats.get("count"));
        result.put("size", stats.get("size"));
        result.put("storageSize", stats.get("storageSize"));
        result.put("nchunks", stats.get("nchunks"));
        result.put("shards", stats.get("shards"));
        return result;
    }

    public Map<String, Object> getShardStatus() {
        MongoDatabase adminDb = mongoTemplate.getMongoDatabaseFactory().getMongoDatabase("admin");
        Document shardsDoc = adminDb.runCommand(new Document("listShards", 1));
        Document databasesDoc = adminDb.runCommand(new Document("listDatabases", 1));

        MongoDatabase configDb = mongoTemplate.getMongoDatabaseFactory().getMongoDatabase("config");
        
        List<Map<String, Object>> chunksList = new ArrayList<>();
        configDb.getCollection("chunks")
                .find(new Document("ns", "app.users"))
                .forEach(doc -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("shard", doc.get("shard"));
                    map.put("min", doc.get("min"));
                    map.put("max", doc.get("max"));
                    chunksList.add(map);
                });

        List<Map<String, Object>> collectionsList = new ArrayList<>();
        configDb.getCollection("collections")
                .find()
                .forEach(doc -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("ns", doc.get("_id"));
                    map.put("key", doc.get("key"));
                    map.put("unique", doc.get("unique"));
                    collectionsList.add(map);
                });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shards", shardsDoc.get("shards"));
        result.put("databases", databasesDoc.get("databases"));
        result.put("chunks", chunksList);
        result.put("shardedCollections", collectionsList);
        return result;
    }

    public Map<String, Object> explainQuery(String field, String value) {
        Document query = new Document("find", "users")
                .append("filter", new Document(field, value));
        Document explainCmd = new Document("explain", query)
                .append("verbosity", "executionStats");
        return mongoTemplate.executeCommand(explainCmd);
    }
}
