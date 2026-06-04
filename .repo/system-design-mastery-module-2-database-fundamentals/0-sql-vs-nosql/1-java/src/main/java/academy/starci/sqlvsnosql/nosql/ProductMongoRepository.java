package academy.starci.sqlvsnosql.nosql;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductMongoRepository extends MongoRepository<ProductDocument, String> {
    List<ProductDocument> findByCategoryOrderByCreatedAtDesc(String category);
    List<ProductDocument> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);
    List<ProductDocument> findAllByOrderByCreatedAtDesc();
}
