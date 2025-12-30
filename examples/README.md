# nosql-file Examples

This directory contains comprehensive examples demonstrating all features of nosql-file.

## Running Examples

### Prerequisites

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Run an Example

```bash
# Using ts-node (recommended for development)
npx ts-node examples/01-basic-collection.ts

# Or compile and run with node
npm run build
node dist/examples/01-basic-collection.js
```

## Examples Overview

### 1. Basic Collection (01-basic-collection.ts)
Learn the fundamentals of Collection (array-based storage):
- Insert, find, update, delete operations
- Query documents
- Count and clear operations

**Run:** `npx ts-node examples/01-basic-collection.ts`

### 2. Basic Dictionary (02-basic-dictionary.ts)
Learn key-value storage with Dictionary:
- Set and get key-value pairs
- Check key existence
- List keys and values
- Delete and clear operations

**Run:** `npx ts-node examples/02-basic-dictionary.ts`

### 3. Write Modes (03-write-modes.ts)
Understand the three write modes:
- **Async mode**: Wait for write completion (safest)
- **Fast mode**: Fire and forget (background write)
- **Memory mode**: No disk write (great for batch operations)

**Run:** `npx ts-node examples/03-write-modes.ts`

### 4. JSON Format (04-json-format.ts)
Use JSON instead of YAML:
- Configure JSON format
- Compare with YAML
- Performance considerations

**Run:** `npx ts-node examples/04-json-format.ts`

### 5. Splited Dictionary (05-splited-dictionary.ts)
Store each key in a separate file:
- Efficient for large datasets
- Partial updates
- Better performance with many keys

**Run:** `npx ts-node examples/05-splited-dictionary.ts`

### 6. Event Emitters (06-events.ts)
Listen to write and error events:
- `written` event - successful writes
- `error` event - write failures
- One-time listeners with `once()`

**Run:** `npx ts-node examples/06-events.ts`

### 7. Metadata (07-metadata.ts)
Store metadata separately from data:
- Automatic timestamps (createdAt, updatedAt)
- Version tracking
- Tags and custom fields
- Keep data files clean

**Run:** `npx ts-node examples/07-metadata.ts`

### 8. Schema Migration (08-schema-migration.ts)
Manage schema changes with metadata versions:
- Track schema versions
- Perform automated migrations
- Maintain backward compatibility

**Run:** `npx ts-node examples/08-schema-migration.ts`  
**Note:** Run multiple times to see migrations in action!

### 9. Query Operations (09-query-operations.ts)
Advanced querying and filtering:
- Simple and complex queries
- Filter by multiple properties
- Work with nested objects
- Sort and aggregate results

**Run:** `npx ts-node examples/09-query-operations.ts`

### 10. Error Handling (10-error-handling.ts)
Best practices for error handling:
- Try-catch patterns
- Event-based error handling
- Validation before write
- Graceful shutdown
- Recovery strategies

**Run:** `npx ts-node examples/10-error-handling.ts`

## File Structure After Running Examples

```
data/
  ├── users.yaml                    # From example 1
  ├── config.yaml                   # From example 2
  ├── tasks.yaml                    # From example 3
  ├── products.json                 # From example 4
  ├── store-config.json             # From example 4
  ├── user-cache/                   # From example 5 (splited)
  │   ├── user:1001.yaml
  │   └── user:1002.yaml
  ├── app-logs.yaml                 # From example 6
  ├── users-with-meta.yaml          # From example 7
  ├── users-with-meta.meta.yaml     # Metadata file
  ├── migration-demo.yaml           # From example 8
  ├── migration-demo.meta.yaml      # Migration metadata
  └── ...
```

## Clean Up

To remove all generated data files:

```bash
rm -rf data/
```

## Next Steps

- Read the [main README](../README.md) for API documentation
- Check [METADATA.md](../docs/METADATA.md) for metadata details
- Review [SPECIFICATIONS.md](../docs/SPECIFICATIONS.md) for technical specs
- Explore the [test files](../tests/) for more usage patterns

## Tips

1. **Start with basics**: Run examples 1-2 first to understand core concepts
2. **Experiment**: Modify the examples to match your use case
3. **Check the data folder**: Inspect generated YAML/JSON files to see the structure
4. **Read the comments**: Each example has detailed inline documentation
5. **Combine features**: Mix and match features from different examples

## Need Help?

- GitHub Issues: [Report bugs or request features](https://github.com/nmeunier/nosql-file/issues)
- Documentation: [Full API docs](../README.md)

## License

MIT License - See [LICENSE](../LICENSE) file for details
