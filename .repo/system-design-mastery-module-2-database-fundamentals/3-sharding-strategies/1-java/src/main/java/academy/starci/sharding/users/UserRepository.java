package academy.starci.sharding.users;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByUserId(String userId);
    List<UserDocument> findByCountry(String country);
    List<UserDocument> findByTier(String tier);
}
