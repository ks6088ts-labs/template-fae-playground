# Using Biome

This template uses [Biome](https://biomejs.dev/) for both linting and formatting. The base config in [biome.json](../biome.json) is intentionally lightweight so the template stays easy to understand and customize.

For why Biome is used here, see [Tech Stack → Biome](./tech-stack.md#biome).

## Available commands

```bash
pnpm lint    # Run Biome's linter only
pnpm check   # Run Biome's linter and formatting checks
pnpm format  # Rewrite files to match the configured style
```

`make ci-test` uses `pnpm check`, so CI fails when code is either invalid or unformatted.

## Adjust formatter settings

The default formatter keeps the repository's current style:

- 2-space indentation
- single quotes
- semicolons only when required

Update the `formatter` or `javascript.formatter` sections in [biome.json](../biome.json) if you want a different style.

## Add file-specific overrides

Biome supports per-file overrides when some files need different behavior:

```json
{
  "overrides": [
    {
      "includes": ["scripts/*.ts"],
      "javascript": {
        "formatter": {
          "quoteStyle": "double"
        }
      }
    }
  ]
}
```

## Tune lint rules

The template enables Biome's recommended rules by default. You can selectively disable or change rules in `biome.json`:

```json
{
  "linter": {
    "rules": {
      "preset": "recommended",
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  }
}
```
