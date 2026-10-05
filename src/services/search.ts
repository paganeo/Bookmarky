import { BookmarkItem, SearchOperatorFilter, SearchResultItem } from '../types/bookmark';

export class SearchEngine {
  /**
   * Parse query into structured operator filters, quoted phrases, exclusions, and terms
   */
  static parseQuery(query: string): SearchOperatorFilter {
    const raw = query.trim();
    const filter: SearchOperatorFilter = {
      excludedTerms: [],
      phrases: [],
      keywords: [],
      rawQuery: raw
    };

    if (!raw) return filter;

    // 1. Extract quoted phrases first: "google search console"
    const phraseRegex = /"([^"]+)"/g;
    let match: RegExpExecArray | null;
    let remaining = raw;

    while ((match = phraseRegex.exec(raw)) !== null) {
      if (match[1].trim()) {
        filter.phrases.push(match[1].toLowerCase().trim());
      }
    }
    remaining = remaining.replace(phraseRegex, ' ');

    // 2. Tokenize by whitespace
    const tokens = remaining.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      const lower = token.toLowerCase();

      // Check operators
      if (lower.startsWith('domain:')) {
        filter.domain = lower.substring('domain:'.length).replace(/^https?:\/\//, '').replace(/^www\./, '');
      } else if (lower.startsWith('folder:')) {
        filter.folder = lower.substring('folder:'.length);
      } else if (lower.startsWith('title:')) {
        filter.title = lower.substring('title:'.length);
      } else if (lower.startsWith('url:')) {
        filter.url = lower.substring('url:'.length);
      } else if (lower.startsWith('category:')) {
        filter.category = lower.substring('category:'.length);
      } else if (lower.startsWith('-') && lower.length > 1) {
        filter.excludedTerms.push(lower.substring(1));
      } else {
        filter.keywords.push(lower);
      }
    }

    return filter;
  }

  /**
   * Search and rank bookmark items against the query
   */
  static search(items: BookmarkItem[], query: string): SearchResultItem[] {
    if (!query || !query.trim()) {
      return items.map((b) => ({
        bookmark: b,
        score: 0,
        matches: []
      }));
    }

    const filter = this.parseQuery(query);
    const results: SearchResultItem[] = [];

    for (const item of items) {
      const titleLower = item.title.toLowerCase();
      const urlLower = item.url.toLowerCase();
      const domainLower = item.domain.toLowerCase();
      const pathLower = item.pathString.toLowerCase();

      // Exclusions check (-term)
      let excluded = false;
      for (const ex of filter.excludedTerms) {
        if (
          titleLower.includes(ex) ||
          urlLower.includes(ex) ||
          domainLower.includes(ex) ||
          pathLower.includes(ex)
        ) {
          excluded = true;
          break;
        }
      }
      if (excluded) continue;

      // Operator domain: check
      if (filter.domain && !domainLower.includes(filter.domain)) {
        continue;
      }

      // Operator folder: check
      if (filter.folder && !pathLower.includes(filter.folder)) {
        continue;
      }

      // Operator title: check
      if (filter.title && !titleLower.includes(filter.title)) {
        continue;
      }

      // Operator url: check
      if (filter.url && !urlLower.includes(filter.url)) {
        continue;
      }

      // Quoted phrases check
      let allPhrasesMatch = true;
      for (const phrase of filter.phrases) {
        if (
          !titleLower.includes(phrase) &&
          !urlLower.includes(phrase) &&
          !pathLower.includes(phrase)
        ) {
          allPhrasesMatch = false;
          break;
        }
      }
      if (!allPhrasesMatch) continue;

      // Keywords matching & scoring
      let score = 0;
      const matches: SearchResultItem['matches'] = [];

      if (filter.keywords.length === 0) {
        // Matched solely on operators/phrases
        score = 100;
      } else {
        let allKeywordsMatch = true;

        for (const kw of filter.keywords) {
          let kwScore = 0;

          // 1. Exact title match
          if (titleLower === kw) {
            kwScore += 1000;
            matches.push({ field: 'title', matchType: 'exact' });
          }
          // 2. Title prefix match
          else if (titleLower.startsWith(kw) || titleLower.includes(' ' + kw)) {
            kwScore += 500;
            matches.push({ field: 'title', matchType: 'prefix' });
          }
          // 3. Title substring match
          else if (titleLower.includes(kw)) {
            kwScore += 300;
            matches.push({ field: 'title', matchType: 'substring' });
          }

          // 4. Domain match
          if (domainLower.startsWith(kw)) {
            kwScore += 250;
            matches.push({ field: 'domain', matchType: 'prefix' });
          } else if (domainLower.includes(kw)) {
            kwScore += 200;
            matches.push({ field: 'domain', matchType: 'substring' });
          }

          // 5. URL match
          if (urlLower.includes(kw)) {
            kwScore += 100;
            matches.push({ field: 'url', matchType: 'substring' });
          }

          // 6. Folder match
          if (pathLower.includes(kw)) {
            kwScore += 50;
            matches.push({ field: 'folder', matchType: 'substring' });
          }

          if (kwScore === 0) {
            allKeywordsMatch = false;
            break;
          }

          score += kwScore;
        }

        if (!allKeywordsMatch) continue;
      }

      // Bonus for recent bookmarks if dates exist
      if (item.dateAdded) {
        const ageInDays = (Date.now() - item.dateAdded) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) score += 20;
        else if (ageInDays < 30) score += 10;
      }

      results.push({
        bookmark: item,
        score,
        matches
      });
    }

    // Rank descending by score
    return results.sort((a, b) => b.score - a.score);
  }
}
