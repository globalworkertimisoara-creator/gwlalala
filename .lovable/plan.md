

# Compact Pipeline with Filters

## Overview

This plan redesigns the Pipeline page to be more compact for better overview of the entire 15-stage process, and adds comprehensive filtering capabilities.

---

## Current Issues

1. **Cards are too large** - Each card takes significant vertical space with avatar, email, location, days in stage, and update time
2. **Columns are too wide** - min-width of 280px makes it hard to see all 14 active stages at once
3. **No filters** - Cannot filter by nationality, country, job, or search terms on the pipeline view

---

## Solution

### 1. Compact Card Design

Create a new compact card variant that shows essential info in a condensed format:

```text
Current Card (~120px height):
+---------------------------+
| [Avatar] Name       🇷🇴   |
|          email@example.com|
| 📍 Romania   📅 5d in stage|
| Updated 3 days ago        |
+---------------------------+

Compact Card (~48px height):
+---------------------------+
| 🇷🇴 Name              5d  |
+---------------------------+
```

- Single row with flag, name, and days in stage
- Hover tooltip shows full details
- Click still opens detail view

### 2. Narrower Columns

Reduce column widths to fit more stages on screen:

| Property | Current | Compact |
|----------|---------|---------|
| min-width | 280px | 160px |
| max-width | 320px | 200px |
| gap | 16px (gap-4) | 8px (gap-2) |
| padding | p-3 | p-2 |

### 3. Filter Bar

Add a collapsible filter section above the pipeline:

```text
+--------------------------------------------------+
| 🔍 Search...    | Stage ▼ | Nationality ▼ | Country ▼ |
+--------------------------------------------------+
```

Filters:
- **Search**: Text search by name
- **Nationality**: Dropdown with unique nationalities from candidates
- **Country**: Dropdown with unique current countries
- **View toggle**: Compact/Expanded view switch

### 4. View Mode Toggle

Add toggle to switch between:
- **Compact view** (default) - Small cards for overview
- **Detailed view** - Current larger cards

---

## Technical Changes

### Files to Modify

**src/pages/Pipeline.tsx**
- Add filter state (search, nationality, country)
- Add view mode toggle (compact/detailed)
- Add filter bar UI with dropdowns
- Pass filtered candidates to columns
- Pass compact prop to columns

**src/components/pipeline/PipelineColumn.tsx**
- Accept `compact` prop
- Reduce column widths when compact
- Reduce card spacing when compact

**src/components/pipeline/CandidateCard.tsx**
- Accept `compact` prop  
- Render condensed single-line version when compact
- Add hover tooltip with full details in compact mode

**src/index.css**
- Add `.candidate-card-compact` style variant
- Add `.pipeline-column-compact` style variant

---

## UI Components Used

- `Input` for search field
- `Select` for filter dropdowns (nationality, country)
- `ToggleGroup` for view mode toggle
- `Tooltip` for compact card hover details
- Existing filter pattern from Candidates page

---

## Filter Logic

```typescript
// Filter candidates client-side
const filteredCandidates = useMemo(() => {
  return (candidates || []).filter(c => {
    if (searchTerm && !c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (nationalityFilter && c.nationality !== nationalityFilter) {
      return false;
    }
    if (countryFilter && c.current_country !== countryFilter) {
      return false;
    }
    return true;
  });
}, [candidates, searchTerm, nationalityFilter, countryFilter]);
```

---

## Visual Result

Before (14 stages require significant scrolling):
```text
[Sourced][Contacted][Application][Screening] →→→ scroll →→→
```

After (more stages visible at once):
```text
[Sourced][Contacted][Application][Screening][Shortlisted][Submitted][Feedback][Interview]...
```

---

## Implementation Steps

1. Update `src/index.css` with compact style variants
2. Update `CandidateCard.tsx` to support compact mode with tooltip
3. Update `PipelineColumn.tsx` to support compact mode and narrower widths
4. Update `Pipeline.tsx` with filter bar and view toggle
5. Extract unique nationalities/countries from candidates for dropdowns

