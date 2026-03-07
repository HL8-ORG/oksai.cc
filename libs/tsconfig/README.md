# @oksai/tsconfig

Shared TypeScript configurations for oksai.cc monorepo.

**Location**: `libs/tsconfig/`

## Overview

This package provides reusable TypeScript configurations aligned with Novu's best practices.

## Available Configurations

### `base.json`

The foundational configuration with strict type checking enabled.

**Features**:

- Strict mode enabled
- Modern ES2022 target
- Unused locals/parameters checking
- Decorator metadata support (for NestJS)

### `nestjs.json`

Configuration for NestJS applications.

**Extends**: `base.json`

**Additional Features**:

- CommonJS module system
- Node module resolution
- Decorator metadata enabled
- Source maps enabled

**Usage**:

```json
{
  "extends": "@oksai/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./"
  }
}
```

### `node-library.json`

Configuration for Node.js libraries.

**Extends**: `base.json`

**Additional Features**:

- Node16 module system
- Composite project references
- Declaration files generation
- Vitest types included

**Usage**:

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### `react-library.json`

Configuration for React libraries.

**Extends**: `base.json`

**Additional Features**:

- React JSX transform
- DOM types included
- ESNext modules
- Bundler resolution
- Vitest types included

**Usage**:

```json
{
  "extends": "@oksai/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### `tanstack-start.json`

Configuration for TanStack Start applications.

**Extends**: `base.json`

**Additional Features**:

- React JSX transform
- Modern ES2022 target
- Bundler module resolution
- Allow importing `.ts` extensions

**Usage**:

```json
{
  "extends": "@oksai/tsconfig/tanstack-start.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

### `build.json`

Configuration for production builds (used with other configs).

**Features**:

- Disabled composite mode
- Declaration files generation
- Source maps enabled
- Exclude test files

**Usage**:

```json
// tsconfig.build.json
{
  "extends": [
    "@oksai/tsconfig/node-library.json",
    "@oksai/tsconfig/build.json"
  ],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

## Migration Guide

### From tsconfig.base.json

**Before** (old way):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**After** (new way):

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Benefits

1. ✅ **Aligned with Novu**: Same configuration pattern as Novu
2. ✅ **Easier migration**: Direct reference when importing Novu modules
3. ✅ **Type safety**: JSON Schema validation in IDE
4. ✅ **Maintainability**: Centralized configuration updates
5. ✅ **Flexibility**: Multiple presets for different project types

## Configuration Comparison

| Feature               | base.json | nestjs.json | node-library.json | react-library.json |
| --------------------- | --------- | ----------- | ----------------- | ------------------ |
| strict                | ✅        | ✅          | ✅                | ✅                 |
| module                | -         | CommonJS    | Node16            | ESNext             |
| moduleResolution      | node      | Node        | Node16            | Bundler            |
| composite             | false     | -           | true              | -                  |
| jsx                   | -         | -           | -                 | react-jsx          |
| emitDecoratorMetadata | true      | true        | -                 | -                  |

## Best Practices

### 1. Use Appropriate Preset

- **NestJS apps**: `nestjs.json`
- **Node.js libraries**: `node-library.json`
- **React libraries**: `react-library.json`
- **TanStack Start apps**: `tanstack-start.json`

### 2. Dual Configuration

For libraries, use dual configuration:

```json
// tsconfig.json (development)
{
  "extends": "@oksai/tsconfig/node-library.json"
}

// tsconfig.build.json (production)
{
  "extends": ["@oksai/tsconfig/node-library.json", "@oksai/tsconfig/build.json"]
}
```

### 3. Project References

Enable project references for better performance:

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "composite": true
  },
  "references": [{ "path": "../logger" }, { "path": "../config" }]
}
```

## Troubleshooting

### Issue: Cannot find module '@oksai/tsconfig'

**Solution**: Run `pnpm install` to link workspace packages.

### Issue: Configuration not applied

**Solution**: Check that you're extending the correct file and your IDE has reloaded.

### Issue: Build cache issues

**Solution**: Clear TypeScript build cache:

```bash
find . -name "*.tsbuildinfo" -delete
pnpm nx reset
```

## References

- [Novu tsconfig](https://github.com/novuhq/novu/tree/next/libs/maily-tsconfig)
- [TypeScript tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [JSON Schema Store](https://json.schemastore.org/tsconfig)
