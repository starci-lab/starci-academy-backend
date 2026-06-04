package academy.starci.sqlvsnosql.sql;

import academy.starci.sqlvsnosql.dto.CreateProductDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class SqlService {

    private final ProductRepository productRepository;

    public SqlService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductEntity create(CreateProductDto dto) {
        ProductEntity entity = new ProductEntity();
        entity.setName(dto.name());
        entity.setPrice(BigDecimal.valueOf(dto.price()));
        entity.setCategory(dto.category());
        entity.setMetadata(dto.metadata());
        return productRepository.save(entity);
    }

    public void createMany(List<CreateProductDto> dtos) {
        List<ProductEntity> entities = dtos.stream().map(dto -> {
            ProductEntity entity = new ProductEntity();
            entity.setName(dto.name());
            entity.setPrice(BigDecimal.valueOf(dto.price()));
            entity.setCategory(dto.category());
            entity.setMetadata(dto.metadata());
            return entity;
        }).toList();
        productRepository.saveAll(entities);
    }

    @Transactional(readOnly = true)
    public List<ProductEntity> findAll() {
        return productRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ProductEntity> findByCategory(String category) {
        return productRepository.findByCategoryOrderByCreatedAtDesc(category);
    }

    @Transactional(readOnly = true)
    public List<ProductEntity> search(String keyword) {
        return productRepository.findByNameContainingIgnoreCaseOrderByCreatedAtDesc(keyword);
    }

    public void deleteAll() {
        productRepository.deleteAllInBatch();
    }

    @Transactional(readOnly = true)
    public long count() {
        return productRepository.count();
    }
}
