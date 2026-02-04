# Wikipedia Link Lookup Guide

## Overview
Some asteroids don't have Wikipedia articles under their simple name or ID. This guide explains how to add custom mappings to fix broken links.

## How It Works

The game uses a lookup table in `src/data/WikipediaLinks.ts` to map asteroid IDs/names to their correct Wikipedia article URLs.

### Lookup Process:
1. Check if asteroid ID exists in `WIKIPEDIA_LOOKUP` table → use that
2. Check if asteroid name exists in `WIKIPEDIA_LOOKUP` table → use that
3. Fallback: use asteroid name with spaces converted to underscores

## Adding New Mappings

### Step 1: Find the Broken Link
When you discover a broken Wikipedia link:
1. Note the asteroid ID (e.g., "433953")
2. Note the asteroid name (e.g., "1997 XR2")
3. Search Wikipedia for the correct article

### Step 2: Find the Correct Article Name
The article URL will be like:
```
https://en.wikipedia.org/wiki/(433953)_1997_XR2
```

The part after `/wiki/` is what you need: `(433953)_1997_XR2`

### Step 3: Add to Lookup Table
Edit `src/data/WikipediaLinks.ts`:

```typescript
export const WIKIPEDIA_LOOKUP: Record<string, string> = {
  // Existing entries...
  '433953': '(433953)_1997_XR2',

  // Add your new entry:
  'YOUR_ASTEROID_ID': 'Wikipedia_Article_Name',
};
```

### Examples

**Asteroid with designation in parentheses:**
```typescript
'433953': '(433953)_1997_XR2',
```
→ Links to: https://en.wikipedia.org/wiki/(433953)_1997_XR2

**Asteroid with special characters:**
```typescript
'2008 TC3': '2008_TC3',
```
→ Links to: https://en.wikipedia.org/wiki/2008_TC3

**Asteroid with proper name:**
```typescript
'433': '433_Eros',
```
→ Links to: https://en.wikipedia.org/wiki/433_Eros

## Testing

After adding a mapping:
1. Restart the dev server (`npm run dev`)
2. Navigate to the asteroid in-game
3. Click the Wikipedia link
4. Verify it goes to the correct article

## Finding Wikipedia Articles

If you can't find the article by name:
1. Search Wikipedia for the asteroid ID number
2. Try variations:
   - `433 Eros`
   - `(433) Eros`
   - `433_Eros`
3. Check the NASA JPL page - it often has a Wikipedia link
4. Search for the full designation (e.g., "1997 XR2")

## Common Patterns

| Pattern | Example ID | Wikipedia Article | Lookup Entry |
|---------|-----------|------------------|--------------|
| Numbered with name | 433 | 433_Eros | `'433': '433_Eros'` |
| Provisional designation | 1997 XR2 | 1997_XR2 | `'1997 XR2': '1997_XR2'` |
| Numbered provisional | 433953 | (433953)_1997_XR2 | `'433953': '(433953)_1997_XR2'` |
| Special characters | 2008 TC³ | 2008_TC3 | `'2008 TC3': '2008_TC3'` |

## Notes

- Wikipedia uses underscores instead of spaces in URLs
- Special characters may be encoded
- Articles with parentheses need exact formatting
- The lookup table is case-sensitive
- You can add entries by ID or name (or both)

## Automated Discovery (Future Feature)

In the future, we could:
1. Detect 404 errors on Wikipedia links
2. Search Wikipedia API for alternative article names
3. Automatically populate the lookup table
4. Log suggestions for manual review

For now, manual additions work well.
