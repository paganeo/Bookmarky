import { BookmarkItem } from '../types/bookmark';
import { extractDomain } from './bookmarks';

const SAMPLE_DOMAINS = [
  { domain: 'github.com', category: 'Development', titles: ['Repository', 'Documentation', 'Issue Tracker', 'Pull Request', 'Release Notes', 'Discussions'] },
  { domain: 'figma.com', category: 'Design', titles: ['Design System', 'Wireframes', 'UI Kit', 'Component Library', 'Design Tokens', 'Prototype'] },
  { domain: 'openai.com', category: 'AI', titles: ['API Reference', 'Prompt Engineering', 'ChatGPT Models', 'Playground', 'Fine-tuning Guide'] },
  { domain: 'ahrefs.com', category: 'SEO', titles: ['Site Explorer', 'Keywords Explorer', 'Backlink Checker', 'SERP Overview', 'SEO Audit'] },
  { domain: 'stripe.com', category: 'Finance', titles: ['Payment Gateway', 'API Keys', 'Webhook Config', 'Billing Portal', 'Invoicing'] },
  { domain: 'notion.so', category: 'Productivity', titles: ['Workspace Wiki', 'Roadmap 2026', 'Meeting Notes', 'Quarterly Goals', 'Knowledge Base'] },
  { domain: 'youtube.com', category: 'Entertainment', titles: ['Coding Tutorial', 'Design Conference', 'Podcast Episode', 'Product Review', 'Keynote'] },
  { domain: 'amazon.com', category: 'Shopping', titles: ['Ergonomic Keyboard', '4K Monitor', 'Standing Desk', 'Noise Cancelling Headphones'] },
  { domain: 'wikipedia.org', category: 'Reference', titles: ['Computer Science', 'Distributed Systems', 'Software Architecture', 'Information Theory'] },
  { domain: 'linear.app', category: 'Productivity', titles: ['Sprint Backlog', 'Active Cycle', 'Bug Triage', 'Feature Roadmap'] }
];

export class TestDataGenerator {
  /**
   * Generate realistic in-memory test bookmarks for performance and stress testing
   */
  static generateBookmarks(count: number): BookmarkItem[] {
    const items: BookmarkItem[] = [];
    const now = Date.now();

    for (let i = 1; i <= count; i++) {
      const sample = SAMPLE_DOMAINS[i % SAMPLE_DOMAINS.length];
      const titlePattern = sample.titles[i % sample.titles.length];
      const title = `${titlePattern} #${i} - ${sample.category}`;
      
      // Inject ~4% exact duplicates and ~4% normalized duplicates with UTM tracking params
      let url: string;
      if (i > 10 && i % 25 === 0) {
        // Exact duplicate of an earlier bookmark
        url = `https://${sample.domain}/item/${i % 10}`;
      } else if (i > 10 && i % 23 === 0) {
        // Normalized duplicate with query tracking
        url = `https://${sample.domain}/item/${i % 10}?utm_source=test&utm_medium=suite&ref=bookmark`;
      } else {
        url = `https://${sample.domain}/item/${i}`;
      }

      const domain = extractDomain(url);
      const folder = sample.category;
      const path = ['Bookmarks Bar', folder];

      items.push({
        id: `test_bm_${i}`,
        parentId: '1',
        index: i,
        url,
        title,
        dateAdded: now - (i * 3600 * 1000),
        path,
        pathString: path.join(' / '),
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        category: sample.category
      });
    }

    return items;
  }
}
