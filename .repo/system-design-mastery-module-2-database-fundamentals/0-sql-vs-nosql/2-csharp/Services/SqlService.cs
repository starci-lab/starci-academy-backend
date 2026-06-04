using Microsoft.EntityFrameworkCore;
using SqlVsNosql.Data;
using SqlVsNosql.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace SqlVsNosql.Services
{
    public class SqlService
    {
        private readonly SqlDbContext _context;

        public SqlService(SqlDbContext context)
        {
            _context = context;
        }

        public async Task<ProductEntity> CreateAsync(CreateProductDto dto)
        {
            var metadataDoc = dto.Metadata != null ? JsonDocument.Parse(dto.Metadata.ToJsonString()) : null;

            var entity = new ProductEntity
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Price = (decimal)dto.Price,
                Category = dto.Category,
                Metadata = metadataDoc,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task CreateManyAsync(List<CreateProductDto> dtos)
        {
            var entities = dtos.Select(dto => new ProductEntity
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Price = (decimal)dto.Price,
                Category = dto.Category,
                Metadata = dto.Metadata != null ? JsonDocument.Parse(dto.Metadata.ToJsonString()) : null,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.Products.AddRange(entities);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ProductEntity>> FindAllAsync()
        {
            return await _context.Products
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ProductEntity>> FindByCategoryAsync(string category)
        {
            return await _context.Products
                .Where(p => p.Category == category)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ProductEntity>> SearchAsync(string keyword)
        {
            return await _context.Products
                .Where(p => EF.Functions.Like(p.Name, $"%{keyword}%"))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task DeleteAllAsync()
        {
            // ExecuteDeleteAsync is very efficient in EF Core 7/8
            await _context.Products.ExecuteDeleteAsync();
        }

        public async Task<int> CountAsync()
        {
            return await _context.Products.CountAsync();
        }
    }
}
