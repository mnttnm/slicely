# Implementation Plan: Elasticsearch Integration for Advanced Search

**Priority:** 🟠 HIGH
**Impact:** 85/100
**Effort:** Medium (3 weeks)
**Owner:** Backend Engineering
**Dependencies:** None (can run in parallel with API layer)

---

## 1. Overview

### Objective
Integrate Elasticsearch to provide enterprise-grade search capabilities including hybrid search (keyword + semantic), faceted search, autocomplete, fuzzy matching, and search analytics.

### Current Limitations
- ❌ No faceted search (can't filter by slicer, date, document type)
- ❌ No fuzzy matching or typo tolerance
- ❌ No autocomplete/suggestions
- ❌ No search analytics
- ❌ Limited relevance tuning
- ❌ No aggregations

### Success Criteria
- ✅ Hybrid search (Elasticsearch keyword + pgvector semantic)
- ✅ Faceted search (filter by slicer, date, document type)
- ✅ Autocomplete with 3-letter minimum
- ✅ Fuzzy matching (1-2 edit distance)
- ✅ Search analytics dashboard
- ✅ <200ms p95 search response time

---

## 2. Technical Architecture

### 2.1 Technology Stack

```yaml
Elasticsearch: 8.x (latest)
Deployment Options:
  - Self-hosted (Docker Compose) - $300/month
  - Elastic Cloud (managed) - $1000/month
  - AWS OpenSearch - $500/month

Node.js Client: @elastic/elasticsearch v8.x
Search UI: Custom React components
Analytics: Kibana (included with Elasticsearch)
```

### 2.2 Architecture Pattern

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
└─────────────┬───────────────────────────┘
              │
       ┌──────┴──────┐
       │  Search API │
       └──────┬──────┘
              │
    ┌─────────┴─────────┐
    │   Search Router   │
    │  (Query Parser)   │
    └─────────┬─────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼─────────┐   ┌─────▼──────────┐
│Elasticsearch│   │  PostgreSQL    │
│  (Keyword)  │   │  (Semantic)    │
└─────────────┘   └────────────────┘
         │                  │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │  Result Merger   │
         │  (Hybrid Score)  │
         └──────────────────┘
```

### 2.3 Document Schema

```typescript
// Elasticsearch document structure
interface SlicelyDocument {
  // Core fields
  id: string;                           // UUID
  content: string;                      // Full extracted text
  content_snippet: string;              // First 500 chars for previews

  // Metadata
  slicer_id: string;
  slicer_name: string;
  pdf_id: string;
  pdf_name: string;
  page_number: number;
  user_id: string;

  // Timestamps
  processed_at: Date;
  created_at: Date;

  // Classification (for facets)
  document_type?: string;               // 'invoice', 'contract', 'report', etc.
  tags: string[];                       // User-defined tags
  confidence?: number;                  // LLM confidence score

  // LLM outputs (searchable)
  llm_outputs?: Array<{
    prompt_id: string;
    prompt: string;
    output_type: 'single_value' | 'chart' | 'table' | 'text';
    output_value: any;
  }>;

  // Searchable nested fields
  section_info?: {
    annotation_id?: string;
    page_range?: [number, number];
  };
}

// Elasticsearch mapping
const indexMapping = {
  mappings: {
    properties: {
      content: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          suggest: {
            type: 'completion',               // For autocomplete
            analyzer: 'simple',
          },
        },
      },
      content_snippet: { type: 'text' },

      slicer_id: { type: 'keyword' },
      slicer_name: {
        type: 'text',
        fields: { keyword: { type: 'keyword' } },
      },

      pdf_id: { type: 'keyword' },
      pdf_name: {
        type: 'text',
        fields: { keyword: { type: 'keyword' } },
      },

      page_number: { type: 'integer' },
      user_id: { type: 'keyword' },

      processed_at: { type: 'date' },
      created_at: { type: 'date' },

      document_type: { type: 'keyword' },
      tags: { type: 'keyword' },
      confidence: { type: 'float' },

      llm_outputs: {
        type: 'nested',
        properties: {
          prompt_id: { type: 'keyword' },
          prompt: { type: 'text' },
          output_type: { type: 'keyword' },
          output_value: { type: 'text' },
        },
      },
    },
  },
  settings: {
    number_of_shards: 3,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        autocomplete_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'autocomplete_filter'],
        },
      },
      filter: {
        autocomplete_filter: {
          type: 'edge_ngram',
          min_gram: 3,
          max_gram: 20,
        },
      },
    },
  },
};
```

---

## 3. Implementation Details

### 3.1 Elasticsearch Client Setup

```typescript
// src/lib/elasticsearch/client.ts

import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY,
    // OR username/password
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

// Index management
export async function createIndex(indexName: string) {
  const exists = await esClient.indices.exists({ index: indexName });

  if (!exists) {
    await esClient.indices.create({
      index: indexName,
      body: indexMapping,
    });
  }
}

// Get user-specific index name
export function getUserIndexName(userId: string): string {
  return `slicely_${userId.replace(/-/g, '_')}`;
}
```

### 3.2 Document Indexing

```typescript
// src/lib/elasticsearch/indexing.ts

export async function indexOutput(output: Output): Promise<void> {
  const indexName = getUserIndexName(output.user_id);

  await esClient.index({
    index: indexName,
    id: output.id,
    document: {
      id: output.id,
      content: output.text_content,
      content_snippet: output.text_content.substring(0, 500),
      slicer_id: output.slicer_id,
      slicer_name: output.slicer?.name,
      pdf_id: output.pdf_id,
      pdf_name: output.pdf?.file_name,
      page_number: output.page_number,
      user_id: output.user_id,
      processed_at: output.created_at,
      created_at: output.created_at,
      document_type: await classifyDocumentType(output),
      tags: [],
      llm_outputs: await getLLMOutputsForOutput(output),
    },
    refresh: 'wait_for', // Make immediately searchable
  });
}

// Bulk indexing for performance
export async function bulkIndexOutputs(outputs: Output[]): Promise<void> {
  if (outputs.length === 0) return;

  const userId = outputs[0].user_id;
  const indexName = getUserIndexName(userId);

  const operations = outputs.flatMap((output) => [
    { index: { _index: indexName, _id: output.id } },
    {
      id: output.id,
      content: output.text_content,
      content_snippet: output.text_content.substring(0, 500),
      // ... rest of fields
    },
  ]);

  await esClient.bulk({
    operations,
    refresh: true,
  });
}

// Delete from index
export async function deleteOutput(userId: string, outputId: string): Promise<void> {
  const indexName = getUserIndexName(userId);

  await esClient.delete({
    index: indexName,
    id: outputId,
  });
}

// Sync existing data (one-time migration)
export async function syncAllOutputsToElasticsearch(userId: string): Promise<void> {
  const outputs = await supabase
    .from('outputs')
    .select('*, slicer:slicers(*), pdf:pdfs(*)')
    .eq('user_id', userId);

  const BATCH_SIZE = 1000;

  for (let i = 0; i < outputs.data.length; i += BATCH_SIZE) {
    const batch = outputs.data.slice(i, i + BATCH_SIZE);
    await bulkIndexOutputs(batch);
  }
}
```

### 3.3 Hybrid Search Implementation

```typescript
// src/lib/elasticsearch/search.ts

interface SearchRequest {
  query: string;
  userId: string;
  searchType?: 'keyword' | 'semantic' | 'hybrid';
  filters?: {
    slicerIds?: string[];
    pdfIds?: string[];
    documentTypes?: string[];
    dateRange?: { from: Date; to: Date };
  };
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  content: string;
  snippet: string;
  slicer: { id: string; name: string };
  pdf: { id: string; name: string };
  pageNumber: number;
  score: number;
  highlights?: string[];
}

export async function hybridSearch(request: SearchRequest): Promise<{
  results: SearchResult[];
  total: number;
  took: number;
  facets: SearchFacets;
}> {
  const { query, userId, searchType = 'hybrid', filters, limit = 50, offset = 0 } = request;

  // Step 1: Keyword search (Elasticsearch)
  const keywordResults = await keywordSearch(query, userId, filters, limit * 2);

  // Step 2: Semantic search (pgvector)
  const semanticResults = searchType === 'keyword'
    ? []
    : await semanticSearch(query, userId, filters, limit * 2);

  // Step 3: Merge and re-rank
  const mergedResults = mergeAndRank(keywordResults, semanticResults, searchType);

  // Step 4: Pagination
  const paginatedResults = mergedResults.slice(offset, offset + limit);

  // Step 5: Get facets
  const facets = await getFacets(query, userId, filters);

  return {
    results: paginatedResults,
    total: mergedResults.length,
    took: Date.now() - startTime,
    facets,
  };
}

async function keywordSearch(
  query: string,
  userId: string,
  filters: any,
  limit: number
): Promise<Array<SearchResult & { keywordScore: number }>> {
  const indexName = getUserIndexName(userId);

  // Build Elasticsearch query
  const esQuery: any = {
    bool: {
      must: [
        {
          multi_match: {
            query,
            fields: ['content^3', 'slicer_name^2', 'pdf_name', 'llm_outputs.output_value'],
            type: 'best_fields',
            fuzziness: 'AUTO',  // Fuzzy matching
            prefix_length: 2,
          },
        },
      ],
      filter: [],
    },
  };

  // Apply filters
  if (filters?.slicerIds) {
    esQuery.bool.filter.push({ terms: { slicer_id: filters.slicerIds } });
  }

  if (filters?.pdfIds) {
    esQuery.bool.filter.push({ terms: { pdf_id: filters.pdfIds } });
  }

  if (filters?.documentTypes) {
    esQuery.bool.filter.push({ terms: { document_type: filters.documentTypes } });
  }

  if (filters?.dateRange) {
    esQuery.bool.filter.push({
      range: {
        processed_at: {
          gte: filters.dateRange.from.toISOString(),
          lte: filters.dateRange.to.toISOString(),
        },
      },
    });
  }

  // Execute search with highlighting
  const response = await esClient.search({
    index: indexName,
    body: {
      query: esQuery,
      size: limit,
      highlight: {
        fields: {
          content: {
            fragment_size: 150,
            number_of_fragments: 3,
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
          },
        },
      },
      _source: ['id', 'content', 'content_snippet', 'slicer_id', 'slicer_name', 'pdf_id', 'pdf_name', 'page_number'],
    },
  });

  return response.hits.hits.map((hit: any) => ({
    id: hit._source.id,
    content: hit._source.content,
    snippet: hit._source.content_snippet,
    slicer: { id: hit._source.slicer_id, name: hit._source.slicer_name },
    pdf: { id: hit._source.pdf_id, name: hit._source.pdf_name },
    pageNumber: hit._source.page_number,
    keywordScore: hit._score,
    score: 0, // Will be set in merge step
    highlights: hit.highlight?.content || [],
  }));
}

async function semanticSearch(
  query: string,
  userId: string,
  filters: any,
  limit: number
): Promise<Array<SearchResult & { semanticScore: number }>> {
  // Generate embedding for query
  const embedding = await generateEmbedding(query);

  // Query pgvector
  const { data: results } = await supabase.rpc('match_outputs', {
    query_embedding: embedding,
    p_user_id: userId,
    p_slicer_ids: filters?.slicerIds || null,
    match_threshold: 0.3,
    match_count: limit,
  });

  return results.map((result: any) => ({
    id: result.id,
    content: result.text_content,
    snippet: result.text_content.substring(0, 500),
    slicer: { id: result.slicer_id, name: result.slicer_name },
    pdf: { id: result.pdf_id, name: result.pdf_name },
    pageNumber: result.page_number,
    semanticScore: result.similarity,
    score: 0, // Will be set in merge step
  }));
}

function mergeAndRank(
  keywordResults: any[],
  semanticResults: any[],
  searchType: 'keyword' | 'semantic' | 'hybrid'
): SearchResult[] {
  if (searchType === 'keyword') {
    return keywordResults.map((r) => ({ ...r, score: r.keywordScore }));
  }

  if (searchType === 'semantic') {
    return semanticResults.map((r) => ({ ...r, score: r.semanticScore }));
  }

  // Hybrid: Reciprocal Rank Fusion (RRF)
  const k = 60; // RRF constant

  const scoresById = new Map<string, { keyword: number; semantic: number }>();

  keywordResults.forEach((result, index) => {
    const currentScores = scoresById.get(result.id) || { keyword: 0, semantic: 0 };
    currentScores.keyword = 1 / (k + index + 1);
    scoresById.set(result.id, currentScores);
  });

  semanticResults.forEach((result, index) => {
    const currentScores = scoresById.get(result.id) || { keyword: 0, semantic: 0 };
    currentScores.semantic = 1 / (k + index + 1);
    scoresById.set(result.id, currentScores);
  });

  // Combine all results
  const allResults = [
    ...keywordResults.map((r) => ({ ...r, source: 'keyword' as const })),
    ...semanticResults.map((r) => ({ ...r, source: 'semantic' as const })),
  ];

  // Deduplicate and calculate hybrid scores
  const uniqueResults = new Map<string, SearchResult>();

  allResults.forEach((result) => {
    if (!uniqueResults.has(result.id)) {
      const scores = scoresById.get(result.id)!;
      const hybridScore = scores.keyword * 0.6 + scores.semantic * 0.4; // 60% keyword, 40% semantic

      uniqueResults.set(result.id, {
        ...result,
        score: hybridScore,
      });
    }
  });

  // Sort by hybrid score
  return Array.from(uniqueResults.values()).sort((a, b) => b.score - a.score);
}
```

### 3.4 Faceted Search

```typescript
// Get facets (aggregations)
async function getFacets(
  query: string,
  userId: string,
  filters: any
): Promise<SearchFacets> {
  const indexName = getUserIndexName(userId);

  const response = await esClient.search({
    index: indexName,
    body: {
      query: {
        multi_match: {
          query,
          fields: ['content', 'slicer_name', 'pdf_name'],
        },
      },
      size: 0, // Don't return documents, only aggregations
      aggs: {
        slicers: {
          terms: { field: 'slicer_name.keyword', size: 20 },
        },
        document_types: {
          terms: { field: 'document_type', size: 20 },
        },
        date_histogram: {
          date_histogram: {
            field: 'processed_at',
            calendar_interval: 'day',
            min_doc_count: 1,
          },
        },
      },
    },
  });

  return {
    slicers: response.aggregations.slicers.buckets.map((b: any) => ({
      name: b.key,
      count: b.doc_count,
    })),
    documentTypes: response.aggregations.document_types.buckets.map((b: any) => ({
      name: b.key,
      count: b.doc_count,
    })),
    dateHistogram: response.aggregations.date_histogram.buckets.map((b: any) => ({
      date: b.key_as_string,
      count: b.doc_count,
    })),
  };
}
```

### 3.5 Autocomplete

```typescript
// Autocomplete suggestions
export async function autocomplete(
  query: string,
  userId: string,
  limit: number = 10
): Promise<string[]> {
  const indexName = getUserIndexName(userId);

  const response = await esClient.search({
    index: indexName,
    body: {
      suggest: {
        text: query,
        content_suggest: {
          completion: {
            field: 'content.suggest',
            size: limit,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: 'AUTO',
            },
          },
        },
      },
      size: 0,
    },
  });

  return response.suggest.content_suggest[0].options.map((opt: any) => opt.text);
}
```

---

## 4. UI Components

### 4.1 Enhanced Search Interface

```typescript
// components/search/SearchWithFacets.tsx

export function SearchWithFacets() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'hybrid' | 'keyword' | 'semantic'>('hybrid');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounced autocomplete
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <div className="flex gap-6">
      {/* Sidebar with facets */}
      <aside className="w-64 space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Search Type</h3>
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
              <SelectItem value="keyword">Keyword Only</SelectItem>
              <SelectItem value="semantic">Semantic Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {facets && (
          <>
            <div>
              <h3 className="font-semibold mb-3">Slicers</h3>
              <div className="space-y-2">
                {facets.slicers.map((slicer) => (
                  <label key={slicer.name} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.slicerNames?.includes(slicer.name)}
                      onCheckedChange={(checked) => {
                        toggleFilter('slicerNames', slicer.name, checked);
                      }}
                    />
                    <span className="text-sm">
                      {slicer.name} ({slicer.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Document Types</h3>
              <div className="space-y-2">
                {facets.documentTypes.map((type) => (
                  <label key={type.name} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.documentTypes?.includes(type.name)}
                      onCheckedChange={(checked) => {
                        toggleFilter('documentTypes', type.name, checked);
                      }}
                    />
                    <span className="text-sm capitalize">
                      {type.name} ({type.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Date Range</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      `${format(filters.dateRange.from, 'PP')} - ${format(filters.dateRange.to, 'PP')}`
                    ) : (
                      'Select date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="range"
                    selected={filters.dateRange}
                    onSelect={(range) => setFilters({ ...filters, dateRange: range })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </aside>

      {/* Main search area */}
      <main className="flex-1">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="pr-10"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-1">
              <CardContent className="p-0">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="block w-full text-left px-4 py-2 hover:bg-muted"
                    onClick={() => {
                      setQuery(suggestion);
                      setSuggestions([]);
                      handleSearch();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {results.length} results ({took}ms)
            </p>

            {filters && Object.keys(filters).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## 5. Deployment

### 5.1 Docker Compose (Development)

```yaml
# docker-compose.elasticsearch.yml

version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: slicely-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: slicely-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

### 5.2 Production Deployment (Elastic Cloud)

```bash
# Sign up at https://cloud.elastic.co

# Get connection details:
# - Cloud ID
# - API Key

# Set environment variables
ELASTICSEARCH_CLOUD_ID=your-cloud-id
ELASTICSEARCH_API_KEY=your-api-key
```

---

## 6. Rollout Plan

### Week 1: Setup & Indexing
- ✅ Deploy Elasticsearch (Docker or Elastic Cloud)
- ✅ Create index mappings
- ✅ Implement indexing service
- ✅ Migrate existing outputs (one-time sync)
- ✅ Set up CDC (change data capture) for real-time indexing

### Week 2: Search Implementation
- ✅ Implement keyword search
- ✅ Implement hybrid search (keyword + semantic)
- ✅ Implement faceted search
- ✅ Implement autocomplete
- ✅ Add highlighting

### Week 3: UI & Polish
- ✅ Build SearchWithFacets component
- ✅ Add search analytics (Kibana dashboard)
- ✅ Performance optimization
- ✅ Testing & bug fixes

---

## 7. Success Metrics

- **Search Speed:** <200ms p95
- **Relevance:** >80% user satisfaction
- **Adoption:** 60%+ of users use advanced search features
- **Autocomplete Usage:** 40%+ of searches use suggestions

---

## 8. Next Steps

1. ✅ Review and approve this plan
2. ✅ Provision Elasticsearch (Elastic Cloud recommended)
3. ✅ Begin Week 1 implementation
4. ✅ Schedule weekly demos

---

**Document Owner:** Backend Engineering Team
**Last Updated:** November 5, 2025
**Status:** Ready for Implementation
