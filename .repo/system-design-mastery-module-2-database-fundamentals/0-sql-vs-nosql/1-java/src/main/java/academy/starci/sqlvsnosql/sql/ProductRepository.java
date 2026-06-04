package academy.starci.sqlvsnosql.sql;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {
    List<ProductEntity> findByCategoryOrderByCreatedAtDesc(String category);
    List<ProductEntity> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);
    List<ProductEntity> findAllByOrderByCreatedAtDesc();
}
