# Enhanced Web Search with Rich Media and Citations

## Overview
Based on in-depth research of best practices from Perplexity, Claude, and ChatGPT, this architecture implements a comprehensive search results display system with proper citations, images, and source attribution.

## Key Features

### 1. Multi-Source Search (3-5 Sources)
- Tavily API configured to return 5 results by default
- Each source properly cited with numbered footnotes
- Sources displayed with thumbnails when available

### 2. Citation System (Perplexity-Style)
- **Inline Citations**: Superscript numbers [1] appear after claims
- **Source Cards**: Each source displayed with:
  - Title
  - Domain/Publisher
  - Published date
  - Thumbnail/favicon
  - Relevance score
  - Brief excerpt
- **Click-to-Verify**: All citations are clickable links

### 3. Rich Media Display
- **Images**: Displayed in a carousel (max 5 items)
  - Thumbnails with captions
  - Click to expand
  - Alt text for accessibility
- **Source Previews**: Visual thumbnails for each source
- **Mobile Optimized**: Swipe gestures for carousels

### 4. UI/UX Patterns
- **Clean Layout**: No clutter, focus on content
- **Progressive Disclosure**: Expand/collapse for details
- **Accessibility**: ARIA labels, keyboard navigation
- **Visual Hierarchy**: Clear distinction between AI response and sources

## Component Architecture

```
SearchResultsDisplay
├── AIResponseWithCitations
│   ├── FormattedText (with superscript citations)
│   └── InlineCitations
├── SourceCardsSection
│   ├── SourceCard [1]
│   ├── SourceCard [2]
│   ├── SourceCard [3]
│   ├── SourceCard [4]
│   └── SourceCard [5]
├── ImageCarousel (if images available)
│   ├── ThumbnailGrid
│   ├── NavigationControls
│   └── ImageModal
└── RelatedSearches
```

## Data Flow

1. **Search Request**
   ```typescript
   {
     query: string,
     search_depth: 'advanced',
     max_results: 5,
     include_images: true,
     include_image_descriptions: true
   }
   ```

2. **Enhanced Response**
   ```typescript
   {
     answer: string,
     results: SearchResult[],
     images: ImageResult[],
     citations: Citation[],
     formattedResponse: string // AI response with [1][2] citations
   }
   ```

3. **Citation Mapping**
   - Extract claims from AI response
   - Map to source results
   - Insert superscript numbers
   - Generate citation index

## Visual Design

### Source Card Layout
```
┌─────────────────────────────────┐
│ [Favicon] Domain.com        [1] │
│ ─────────────────────────────── │
│ **Article Title**               │
│ Brief excerpt of the content... │
│ 📅 Jan 15, 2024 | ⭐ 95%       │
└─────────────────────────────────┘
```

### Image Carousel
```
┌─────────────────────────────────┐
│  ◀  [Image 1] [Image 2] [Img3] ▶│
│     ●  ○  ○  ○  ○              │
└─────────────────────────────────┘
```

### Citation Display
```
According to recent studies[1], AI search engines
are improving rapidly[2][3]. The latest data shows
significant advancements in accuracy[4].
```

## Implementation Details

### 1. Citation Processing
- Parse AI response for factual claims
- Match claims to source content
- Generate citation markers
- Build citation index

### 2. Image Handling
- Request images via Tavily API
- Lazy load for performance
- Responsive image sizing
- Fallback for missing images

### 3. Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support

### 4. Performance
- Progressive loading of images
- Virtualized lists for many sources
- Cached search results
- Optimized re-renders

## Best Practices Applied

1. **Transparency**: Every claim is verifiable
2. **Usability**: Easy to scan and navigate
3. **Trust**: Clear source attribution
4. **Performance**: Fast initial load
5. **Accessibility**: WCAG 2.1 AA compliant