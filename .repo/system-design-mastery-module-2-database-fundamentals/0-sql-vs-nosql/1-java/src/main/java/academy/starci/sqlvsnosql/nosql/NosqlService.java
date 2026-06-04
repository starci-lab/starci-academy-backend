package academy.starci.sqlvsnosql.nosql;

import academy.starci.sqlvsnosql.dto.CreateProductDto;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NosqlService {

    private final ProductMongoRepository repository;

    public NosqlService(ProductMongoRepository repository) {
        this.repository = repository;
    }

    public ProductDocument create(CreateProductDto dto) {
        ProductDocument doc = new ProductDocument();
        doc.setName(dto.name());
        doc.setPrice(dto.price());
        doc.setCategory(dto.category());
        doc.setMetadata(dto.metadata());
        return repository.save(doc);
    }

    public void createMany(List<CreateProductDto> dtos) {
        List<ProductDocument> docs = dtos.stream().map(dto -> {
            ProductDocument doc = new ProductDocument();
            doc.setName(dto.name());
            doc.setPrice(dto.price());
            doc.setCategory(dto.category());
            doc.setMetadata(dto.metadata());
            return doc;
        }).toList();
        repository.saveAll(docs);
    }

    public List<ProductDocument> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public List<ProductDocument> findByCategory(String category) {
        return repository.findByCategoryOrderByCreatedAtDesc(category);
    }

    public List<ProductDocument> search(String keyword) {
        return repository.findByNameContainingIgnoreCaseOrderByCreatedAtDesc(keyword);
    }

    public void deleteAll() {
        repository.deleteAll();
    }

    public long count() {
        return repository.count();
    }
}
