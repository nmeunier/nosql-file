# Release Notes - v1.2.1

## Bug Fix Release

### Overview

This is a minor bug fix release that addresses an issue with YAML metadata file formatting.

### What's Fixed

#### YAML Anchor References in Metadata Files

**Problem**: Metadata files were generating YAML anchor references (`&a1`, `*a1`) when `createdAt` and `updatedAt` timestamps had the same value, making the files harder to read and edit manually.

**Before:**
```yaml
Collection:
  name: MyCollection
  displayName: My collection
  createdAt: &a1 2026-02-07T11:48:47.394Z
  updatedAt: *a1
```

**After:**
```yaml
Collection:
  name: MyCollection
  displayName: My collection
  createdAt: 2026-02-07T11:48:47.394Z
  updatedAt: 2026-02-07T11:48:47.394Z
```

### Technical Changes

**Modified Files:**

1. **src/utils/YamlHandler.ts**
   - Added `aliasDuplicateObjects: false` option to both `write()` and `writeSync()` methods
   - Prevents YAML serializer from creating anchor references for duplicate objects

2. **src/utils/MetadataManager.ts**
   - Modified `touch()` method to create distinct string instances for timestamps
   - Uses `.slice()` to ensure `createdAt` and `updatedAt` are separate string objects

### Impact

- **Backward Compatible**: 100% compatible with v1.2.0
- **No Breaking Changes**: All existing functionality remains unchanged
- **Automatic Fix**: Metadata files will be updated to the new format on next write
- **Performance**: No performance impact

### Upgrade Guide

Simply upgrade to the latest version:

```bash
npm install nosql-file@^1.2.1
```

No code changes required. Existing metadata files will be automatically updated to the new format when they are next modified.

### Testing

- All 267 tests passing
- 96.31% code coverage maintained
- Build successful

### Files Changed

- `src/utils/YamlHandler.ts` - Added YAML serialization option
- `src/utils/MetadataManager.ts` - Modified timestamp creation
- `package.json` - Version bump to 1.2.1
- `CHANGELOG.md` - Added v1.2.1 entry

---

**Full Changelog**: [v1.2.0...v1.2.1](https://github.com/nmeunier/nosql-file/compare/v1.2.0...v1.2.1)

**Questions?** Open an issue on [GitHub](https://github.com/nmeunier/nosql-file/issues)
