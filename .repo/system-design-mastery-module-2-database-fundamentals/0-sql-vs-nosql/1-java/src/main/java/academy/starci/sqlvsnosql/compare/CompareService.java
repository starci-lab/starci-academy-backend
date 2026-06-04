package academy.starci.sqlvsnosql.compare;

import academy.starci.sqlvsnosql.dto.CreateProductDto;
import academy.starci.sqlvsnosql.nosql.NosqlService;
import academy.starci.sqlvsnosql.sql.SqlService;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CompareService {

    private static final String[] CATEGORIES = {
        "Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys", "Food", "Automotive"
    };

    private final SqlService sqlService;
    private final NosqlService nosqlService;

    public CompareService(SqlService sqlService, NosqlService nosqlService) {
        this.sqlService = sqlService;
        this.nosqlService = nosqlService;
    }

    public Map<String, Object> seed(int count) {
        List<CreateProductDto> dtos = new ArrayList<>(count);
        Random rand = new Random();

        for (int i = 0; i < count; i++) {
            String name = "Product-" + (i + 1);
            double price = Math.round((rand.nextDouble() * 500.0 + 1.0) * 100.0) / 100.0;
            String category = CATEGORIES[rand.nextInt(CATEGORIES.length)];
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("sku", String.format("SKU-%06d", i + 1));
            metadata.put("weight", Math.round((rand.nextDouble() * 10.0) * 100.0) / 100.0);
            metadata.put("inStock", rand.nextDouble() > 0.2);

            dtos.add(new CreateProductDto(name, price, category, metadata));
        }

        // Clear existing
        sqlService.deleteAll();
        nosqlService.deleteAll();

        // Seed
        sqlService.createMany(dtos);
        nosqlService.createMany(dtos);

        Map<String, Object> res = new HashMap<>();
        res.put("seeded", count);
        return res;
    }

    public Map<String, Object> compare(String category) {
        // SQL Category query timing
        long start = System.nanoTime();
        var sqlCatRes = sqlService.findByCategory(category);
        double sqlCatMs = (System.nanoTime() - start) / 1_000_000.0;

        // NoSQL Category query timing
        start = System.nanoTime();
        var nosqlCatRes = nosqlService.findByCategory(category);
        double nosqlCatMs = (System.nanoTime() - start) / 1_000_000.0;

        // SQL Search query timing
        String keyword = "Product-1";
        start = System.nanoTime();
        var sqlSearchRes = sqlService.search(keyword);
        double sqlSearchMs = (System.nanoTime() - start) / 1_000_000.0;

        // NoSQL Search query timing
        start = System.nanoTime();
        var nosqlSearchRes = nosqlService.search(keyword);
        double nosqlSearchMs = (System.nanoTime() - start) / 1_000_000.0;

        Map<String, Object> response = new LinkedHashMap<>();

        Map<String, Object> findByCategory = new LinkedHashMap<>();
        findByCategory.put("sqlMs", Math.round(sqlCatMs * 100.0) / 100.0);
        findByCategory.put("nosqlMs", Math.round(nosqlCatMs * 100.0) / 100.0);
        findByCategory.put("sqlCount", sqlCatRes.size());
        findByCategory.put("nosqlCount", nosqlCatRes.size());

        Map<String, Object> search = new LinkedHashMap<>();
        search.put("sqlMs", Math.round(sqlSearchMs * 100.0) / 100.0);
        search.put("nosqlMs", Math.round(nosqlSearchMs * 100.0) / 100.0);
        search.put("sqlCount", sqlSearchRes.size());
        search.put("nosqlCount", nosqlSearchRes.size());

        response.put("findByCategory", findByCategory);
        response.put("search", search);

        return response;
    }
}
