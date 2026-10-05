import { BookmarkItem, OrganizationPlan, OrganizationChange, PageMetadata, LiveInspectionResult } from '../types/bookmark';
import { BookmarkService } from './bookmarks';
import { BackupService } from './backup';

export interface ClassificationResult {
  category: string;
  suggestedFolder: string;
  confidence: number;
  matchedRule: string;
}

export interface IClassifier {
  classify(item: BookmarkItem, metadata?: PageMetadata): ClassificationResult | null;
}

// 1. Local Domain & Substring Rule Classifier (Consolidated Single Root Folders)
export class LocalRuleClassifier implements IClassifier {
  private static DOMAIN_MAP: Record<string, { category: string; folder: string; confidence: number }> = {
    // AI & Machine Learning -> Folder: 'AI'
    'openai.com': { category: 'AI', folder: 'AI', confidence: 99 },
    'chatgpt.com': { category: 'AI', folder: 'AI', confidence: 99 },
    'claude.ai': { category: 'AI', folder: 'AI', confidence: 99 },
    'anthropic.com': { category: 'AI', folder: 'AI', confidence: 98 },
    'huggingface.co': { category: 'AI', folder: 'AI', confidence: 96 },
    'midjourney.com': { category: 'AI', folder: 'AI', confidence: 96 },
    'perplexity.ai': { category: 'AI', folder: 'AI', confidence: 98 },
    'replicate.com': { category: 'AI', folder: 'AI', confidence: 95 },
    'deepmind.google': { category: 'AI', folder: 'AI', confidence: 96 },
    'cohere.com': { category: 'AI', folder: 'AI', confidence: 95 },
    'mistral.ai': { category: 'AI', folder: 'AI', confidence: 96 },
    'groq.com': { category: 'AI', folder: 'AI', confidence: 95 },
    'poe.com': { category: 'AI', folder: 'AI', confidence: 95 },
    'v0.dev': { category: 'AI', folder: 'AI', confidence: 96 },
    'cursor.com': { category: 'AI', folder: 'AI', confidence: 96 },
    'stability.ai': { category: 'AI', folder: 'AI', confidence: 95 },
    'deepseek.com': { category: 'AI', folder: 'AI', confidence: 96 },
    'civitai.com': { category: 'AI', folder: 'AI', confidence: 94 },
    'elevenlabs.io': { category: 'AI', folder: 'AI', confidence: 96 },
    'runwayml.com': { category: 'AI', folder: 'AI', confidence: 95 },

    // Development & Engineering -> Folder: 'Development' (Single unified folder)
    'github.com': { category: 'Development', folder: 'Development', confidence: 99 },
    'gitlab.com': { category: 'Development', folder: 'Development', confidence: 99 },
    'bitbucket.org': { category: 'Development', folder: 'Development', confidence: 98 },
    'stackoverflow.com': { category: 'Development', folder: 'Development', confidence: 98 },
    'stackexchange.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'npmjs.com': { category: 'Development', folder: 'Development', confidence: 98 },
    'pypi.org': { category: 'Development', folder: 'Development', confidence: 98 },
    'crates.io': { category: 'Development', folder: 'Development', confidence: 97 },
    'vitejs.dev': { category: 'Development', folder: 'Development', confidence: 97 },
    'react.dev': { category: 'Development', folder: 'Development', confidence: 99 },
    'vuejs.org': { category: 'Development', folder: 'Development', confidence: 98 },
    'angular.io': { category: 'Development', folder: 'Development', confidence: 98 },
    'svelte.dev': { category: 'Development', folder: 'Development', confidence: 98 },
    'nextjs.org': { category: 'Development', folder: 'Development', confidence: 98 },
    'astro.build': { category: 'Development', folder: 'Development', confidence: 96 },
    'tailwindcss.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'typescriptlang.org': { category: 'Development', folder: 'Development', confidence: 98 },
    'developer.mozilla.org': { category: 'Development', folder: 'Development', confidence: 98 },
    'docker.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'kubernetes.io': { category: 'Development', folder: 'Development', confidence: 97 },
    'terraform.io': { category: 'Development', folder: 'Development', confidence: 96 },
    'aws.amazon.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'azure.microsoft.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'cloud.google.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'digitalocean.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'vercel.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'netlify.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'render.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'supabase.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'firebase.google.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'cloudflare.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'postman.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'regex101.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'w3schools.com': { category: 'Development', folder: 'Development', confidence: 96 },
    'geeksforgeeks.org': { category: 'Development', folder: 'Development', confidence: 95 },
    'leetcode.com': { category: 'Development', folder: 'Development', confidence: 97 },
    'codepen.io': { category: 'Development', folder: 'Development', confidence: 95 },
    'codesandbox.io': { category: 'Development', folder: 'Development', confidence: 95 },
    'stackblitz.com': { category: 'Development', folder: 'Development', confidence: 95 },
    'replit.com': { category: 'Development', folder: 'Development', confidence: 95 },
    'dev.to': { category: 'Development', folder: 'Development', confidence: 94 },

    // Design & Creative -> Folder: 'Design'
    'figma.com': { category: 'Design', folder: 'Design', confidence: 99 },
    'dribbble.com': { category: 'Design', folder: 'Design', confidence: 98 },
    'behance.net': { category: 'Design', folder: 'Design', confidence: 98 },
    'canva.com': { category: 'Design', folder: 'Design', confidence: 97 },
    'unsplash.com': { category: 'Design', folder: 'Design', confidence: 97 },
    'pexels.com': { category: 'Design', folder: 'Design', confidence: 96 },
    'pixabay.com': { category: 'Design', folder: 'Design', confidence: 96 },
    'fontshare.com': { category: 'Design', folder: 'Design', confidence: 97 },
    'fonts.google.com': { category: 'Design', folder: 'Design', confidence: 98 },
    'coolors.co': { category: 'Design', folder: 'Design', confidence: 97 },
    'lucide.dev': { category: 'Design', folder: 'Design', confidence: 97 },
    'heroicons.com': { category: 'Design', folder: 'Design', confidence: 97 },
    'tabler.io': { category: 'Design', folder: 'Design', confidence: 96 },
    'iconify.design': { category: 'Design', folder: 'Design', confidence: 96 },
    'freepik.com': { category: 'Design', folder: 'Design', confidence: 96 },
    'flaticon.com': { category: 'Design', folder: 'Design', confidence: 96 },
    'blender.org': { category: 'Design', folder: 'Design', confidence: 97 },
    'lottiefiles.com': { category: 'Design', folder: 'Design', confidence: 96 },
    'awwwards.com': { category: 'Design', folder: 'Design', confidence: 97 },
    'mobbin.com': { category: 'Design', folder: 'Design', confidence: 97 },

    // SEO & Search -> Folder: 'SEO'
    'ahrefs.com': { category: 'SEO', folder: 'SEO', confidence: 99 },
    'semrush.com': { category: 'SEO', folder: 'SEO', confidence: 99 },
    'moz.com': { category: 'SEO', folder: 'SEO', confidence: 97 },
    'search.google.com': { category: 'SEO', folder: 'SEO', confidence: 98 },
    'screamingfrog.co.uk': { category: 'SEO', folder: 'SEO', confidence: 97 },
    'spyfu.com': { category: 'SEO', folder: 'SEO', confidence: 95 },
    'ubersuggest.com': { category: 'SEO', folder: 'SEO', confidence: 95 },
    'seranking.com': { category: 'SEO', folder: 'SEO', confidence: 95 },

    // Marketing & CRM -> Folder: 'Marketing'
    'hubspot.com': { category: 'Marketing', folder: 'Marketing', confidence: 97 },
    'mailchimp.com': { category: 'Marketing', folder: 'Marketing', confidence: 97 },
    'analytics.google.com': { category: 'Marketing', folder: 'Marketing', confidence: 98 },
    'buffer.com': { category: 'Marketing', folder: 'Marketing', confidence: 95 },
    'hootsuite.com': { category: 'Marketing', folder: 'Marketing', confidence: 95 },
    'brevo.com': { category: 'Marketing', folder: 'Marketing', confidence: 95 },
    'convertkit.com': { category: 'Marketing', folder: 'Marketing', confidence: 95 },
    'zapier.com': { category: 'Marketing', folder: 'Marketing', confidence: 96 },
    'make.com': { category: 'Marketing', folder: 'Marketing', confidence: 96 },

    // Business & Careers -> Folder: 'Business'
    'crunchbase.com': { category: 'Business', folder: 'Business', confidence: 96 },
    'forbes.com': { category: 'Business', folder: 'Business', confidence: 96 },
    'inc.com': { category: 'Business', folder: 'Business', confidence: 95 },
    'entrepreneur.com': { category: 'Business', folder: 'Business', confidence: 95 },
    'glassdoor.com': { category: 'Business', folder: 'Business', confidence: 96 },

    // Finance & Crypto -> Folder: 'Finance'
    'stripe.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'paypal.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'coinbase.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'binance.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'kraken.com': { category: 'Finance', folder: 'Finance', confidence: 96 },
    'tradingview.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'investopedia.com': { category: 'Finance', folder: 'Finance', confidence: 96 },
    'bloomberg.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'marketwatch.com': { category: 'Finance', folder: 'Finance', confidence: 96 },
    'finance.yahoo.com': { category: 'Finance', folder: 'Finance', confidence: 97 },
    'wise.com': { category: 'Finance', folder: 'Finance', confidence: 96 },
    'revolut.com': { category: 'Finance', folder: 'Finance', confidence: 96 },
    'coingecko.com': { category: 'Finance', folder: 'Finance', confidence: 96 },
    'coinmarketcap.com': { category: 'Finance', folder: 'Finance', confidence: 96 },

    // Productivity & Collaboration -> Folder: 'Productivity'
    'notion.so': { category: 'Productivity', folder: 'Productivity', confidence: 98 },
    'linear.app': { category: 'Productivity', folder: 'Productivity', confidence: 98 },
    'slack.com': { category: 'Productivity', folder: 'Productivity', confidence: 98 },
    'trello.com': { category: 'Productivity', folder: 'Productivity', confidence: 97 },
    'asana.com': { category: 'Productivity', folder: 'Productivity', confidence: 97 },
    'loom.com': { category: 'Productivity', folder: 'Productivity', confidence: 96 },
    'clickup.com': { category: 'Productivity', folder: 'Productivity', confidence: 96 },
    'monday.com': { category: 'Productivity', folder: 'Productivity', confidence: 96 },
    'miro.com': { category: 'Productivity', folder: 'Productivity', confidence: 96 },
    'obsidian.md': { category: 'Productivity', folder: 'Productivity', confidence: 97 },
    'todoist.com': { category: 'Productivity', folder: 'Productivity', confidence: 96 },
    'drive.google.com': { category: 'Productivity', folder: 'Productivity', confidence: 98 },
    'dropbox.com': { category: 'Productivity', folder: 'Productivity', confidence: 96 },
    'calendar.google.com': { category: 'Productivity', folder: 'Productivity', confidence: 98 },
    'airtable.com': { category: 'Productivity', folder: 'Productivity', confidence: 97 },

    // Social Media -> Folder: 'Social Media' (Single unified folder)
    'twitter.com': { category: 'Social', folder: 'Social Media', confidence: 99 },
    'x.com': { category: 'Social', folder: 'Social Media', confidence: 99 },
    'linkedin.com': { category: 'Social', folder: 'Social Media', confidence: 99 },
    'reddit.com': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'bsky.app': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'threads.net': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'facebook.com': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'instagram.com': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'tiktok.com': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'pinterest.com': { category: 'Social', folder: 'Social Media', confidence: 97 },
    'discord.com': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'discord.gg': { category: 'Social', folder: 'Social Media', confidence: 98 },
    'telegram.org': { category: 'Social', folder: 'Social Media', confidence: 97 },
    't.me': { category: 'Social', folder: 'Social Media', confidence: 97 },

    // Entertainment, Streaming & Gaming -> Folder: 'Entertainment'
    'youtube.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 99 },
    'youtu.be': { category: 'Entertainment', folder: 'Entertainment', confidence: 99 },
    'netflix.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 99 },
    'spotify.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 99 },
    'twitch.tv': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'soundcloud.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 97 },
    'bandcamp.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 96 },
    'vimeo.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 97 },
    'crunchyroll.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'disneyplus.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'primevideo.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'imdb.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 97 },
    'letterboxd.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 97 },
    'steampowered.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'steamcommunity.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'epicgames.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 98 },
    'ign.com': { category: 'Entertainment', folder: 'Entertainment', confidence: 96 },

    // Shopping & E-Commerce -> Folder: 'Shopping'
    'amazon.com': { category: 'Shopping', folder: 'Shopping', confidence: 99 },
    'amazon.es': { category: 'Shopping', folder: 'Shopping', confidence: 99 },
    'ebay.com': { category: 'Shopping', folder: 'Shopping', confidence: 98 },
    'aliexpress.com': { category: 'Shopping', folder: 'Shopping', confidence: 97 },
    'mercadolibre.com': { category: 'Shopping', folder: 'Shopping', confidence: 98 },
    'mercadolibre.com.mx': { category: 'Shopping', folder: 'Shopping', confidence: 98 },
    'mercadolibre.com.ar': { category: 'Shopping', folder: 'Shopping', confidence: 98 },
    'walmart.com': { category: 'Shopping', folder: 'Shopping', confidence: 97 },
    'target.com': { category: 'Shopping', folder: 'Shopping', confidence: 96 },
    'bestbuy.com': { category: 'Shopping', folder: 'Shopping', confidence: 97 },
    'etsy.com': { category: 'Shopping', folder: 'Shopping', confidence: 97 },
    'temu.com': { category: 'Shopping', folder: 'Shopping', confidence: 96 },
    'shein.com': { category: 'Shopping', folder: 'Shopping', confidence: 96 },
    'ikea.com': { category: 'Shopping', folder: 'Shopping', confidence: 97 },

    // Education, Courses & Science -> Folder: 'Education'
    'coursera.org': { category: 'Education', folder: 'Education', confidence: 98 },
    'udemy.com': { category: 'Education', folder: 'Education', confidence: 98 },
    'platzi.com': { category: 'Education', folder: 'Education', confidence: 98 },
    'edx.org': { category: 'Education', folder: 'Education', confidence: 98 },
    'khanacademy.org': { category: 'Education', folder: 'Education', confidence: 98 },
    'duolingo.com': { category: 'Education', folder: 'Education', confidence: 98 },
    'codecademy.com': { category: 'Education', folder: 'Education', confidence: 97 },
    'freecodecamp.org': { category: 'Education', folder: 'Education', confidence: 98 },
    'brilliant.org': { category: 'Education', folder: 'Education', confidence: 97 },
    'domestika.org': { category: 'Education', folder: 'Education', confidence: 97 },
    'arxiv.org': { category: 'Education', folder: 'Education', confidence: 98 },

    // News & Media -> Folder: 'News'
    'elpais.com': { category: 'News', folder: 'News', confidence: 98 },
    'elmundo.es': { category: 'News', folder: 'News', confidence: 98 },
    'lavanguardia.com': { category: 'News', folder: 'News', confidence: 97 },
    'infobae.com': { category: 'News', folder: 'News', confidence: 98 },
    'clarin.com': { category: 'News', folder: 'News', confidence: 97 },
    'lanacion.com.ar': { category: 'News', folder: 'News', confidence: 97 },
    'xataka.com': { category: 'News', folder: 'News', confidence: 98 },
    'genbeta.com': { category: 'News', folder: 'News', confidence: 97 },
    'theverge.com': { category: 'News', folder: 'News', confidence: 98 },
    'techcrunch.com': { category: 'News', folder: 'News', confidence: 98 },
    'wired.com': { category: 'News', folder: 'News', confidence: 97 },
    'bbc.com': { category: 'News', folder: 'News', confidence: 98 },
    'nytimes.com': { category: 'News', folder: 'News', confidence: 98 },
    'reuters.com': { category: 'News', folder: 'News', confidence: 98 },
    'marca.com': { category: 'News', folder: 'News', confidence: 97 },
    'as.com': { category: 'News', folder: 'News', confidence: 97 },

    // Reference & Knowledge -> Folder: 'Reference'
    'wikipedia.org': { category: 'Reference', folder: 'Reference', confidence: 99 },
    'wikimedia.org': { category: 'Reference', folder: 'Reference', confidence: 98 },
    'wiktionary.org': { category: 'Reference', folder: 'Reference', confidence: 98 },
    'wikihow.com': { category: 'Reference', folder: 'Reference', confidence: 97 },
    'britannica.com': { category: 'Reference', folder: 'Reference', confidence: 98 },
    'wolframalpha.com': { category: 'Reference', folder: 'Reference', confidence: 98 },
    'archive.org': { category: 'Reference', folder: 'Reference', confidence: 98 },
    'goodreads.com': { category: 'Reference', folder: 'Reference', confidence: 97 },
    'quora.com': { category: 'Reference', folder: 'Reference', confidence: 95 }
  };

  classify(item: BookmarkItem): ClassificationResult | null {
    const domain = item.domain.toLowerCase();

    for (const [ruleDomain, target] of Object.entries(LocalRuleClassifier.DOMAIN_MAP)) {
      if (domain === ruleDomain || domain.endsWith('.' + ruleDomain)) {
        return {
          category: target.category,
          suggestedFolder: target.folder,
          confidence: target.confidence,
          matchedRule: `Domain match: ${ruleDomain}`
        };
      }
    }

    return null;
  }
}

// 2. URL Path & Slug Pattern Classifier -> Consolidated Single Root Folders
export class UrlPatternClassifier implements IClassifier {
  private static URL_PATTERNS: {
    pattern: RegExp;
    category: string;
    folder: string;
    confidence: number;
    ruleName: string;
  }[] = [
    {
      pattern: /\/(docs|documentation|api|sdk|reference|manual|guide|apidocs)\b/i,
      category: 'Development',
      folder: 'Development',
      confidence: 90,
      ruleName: 'URL Documentation slug'
    },
    {
      pattern: /\/(tutorial|course|courses|curso|cursos|clase|lesson|learn)\b/i,
      category: 'Education',
      folder: 'Education',
      confidence: 88,
      ruleName: 'URL Education slug'
    },
    {
      pattern: /\/(shop|tienda|store|cart|carrito|checkout|product|producto|item)\b/i,
      category: 'Shopping',
      folder: 'Shopping',
      confidence: 88,
      ruleName: 'URL E-Commerce slug'
    },
    {
      pattern: /\/(watch|video|podcast|episode|stream|trailers)\b/i,
      category: 'Entertainment',
      folder: 'Entertainment',
      confidence: 88,
      ruleName: 'URL Media slug'
    },
    {
      pattern: /\/(blog|noticia|noticias|news|article|articulo|entry|journal)\b/i,
      category: 'News',
      folder: 'News',
      confidence: 85,
      ruleName: 'URL News/Blog slug'
    },
    {
      pattern: /\/(pricing|tarifa|precios|billing|plans|planes)\b/i,
      category: 'Business',
      folder: 'Business',
      confidence: 84,
      ruleName: 'URL Business/Pricing slug'
    }
  ];

  classify(item: BookmarkItem): ClassificationResult | null {
    const url = item.url.toLowerCase();
    for (const p of UrlPatternClassifier.URL_PATTERNS) {
      if (p.pattern.test(url)) {
        return {
          category: p.category,
          suggestedFolder: p.folder,
          confidence: p.confidence,
          matchedRule: p.ruleName
        };
      }
    }
    return null;
  }
}

// 3. Keyword & Semantic Content Classifier -> Consolidated Single Root Folders
export class KeywordClassifier implements IClassifier {
  private static KEYWORD_RULES: {
    category: string;
    folder: string;
    keywords: string[];
    weight: number;
  }[] = [
    {
      category: 'AI',
      folder: 'AI',
      keywords: [
        'artificial intelligence', 'machine learning', 'deep learning', 'prompt', 'llm', 'gpt',
        'neural', 'openai', 'diffusion', 'inteligencia artificial', 'modelo de lenguaje',
        'redes neuronales', 'embeddings', 'chatbot', 'transformers', 'stable diffusion', 'langchain'
      ],
      weight: 90
    },
    {
      category: 'Development',
      folder: 'Development',
      keywords: [
        'repository', 'documentation', 'api reference', 'sdk', 'framework', 'compile', 'javascript',
        'typescript', 'python', 'golang', 'rust', 'git', 'coding', 'fullstack', 'backend', 'frontend',
        'programacion', 'desarrollo', 'desarrollador', 'codigo', 'libreria', 'database', 'base de datos',
        'docker', 'kubernetes', 'servidor', 'algoritmo', 'debug', 'webdev', 'devops', 'open source'
      ],
      weight: 88
    },
    {
      category: 'Design',
      folder: 'Design',
      keywords: [
        'wireframe', 'palette', 'mockup', 'typography', 'typeface', 'svg icons', 'illustration',
        'ui kit', 'ux design', 'css styling', 'diseno grafico', 'tipografia', 'iconos', 'vectores',
        'colores', 'interfaz', 'disenador', 'branding', 'figma template', 'pantone', 'logotipo'
      ],
      weight: 88
    },
    {
      category: 'SEO',
      folder: 'SEO',
      keywords: [
        'backlinks', 'keyword research', 'serp', 'ranking', 'search console', 'crawl', 'indexing',
        'technical seo', 'posicionamiento web', 'palabras clave', 'optimizacion seo', 'link building'
      ],
      weight: 89
    },
    {
      category: 'Marketing',
      folder: 'Marketing',
      keywords: [
        'email marketing', 'newsletter', 'crm', 'leads', 'conversion rate', 'funnel', 'landing page',
        'social media marketing', 'publicidad', 'campana', 'anuncios', 'copywriting', 'estrategia'
      ],
      weight: 86
    },
    {
      category: 'Business',
      folder: 'Business',
      keywords: [
        'startup', 'venture capital', 'enterprise', 'management', 'business plan', 'negocios',
        'emprendimiento', 'inversion', 'empresa', 'financiacion', 'b2b', 'saas business', 'roi'
      ],
      weight: 85
    },
    {
      category: 'Finance',
      folder: 'Finance',
      keywords: [
        'cryptocurrency', 'bitcoin', 'ethereum', 'stock portfolio', 'investing', 'dividends',
        'banking', 'fintech', 'criptomonedas', 'bolsa de valores', 'acciones', 'finanzas',
        'banco', 'prestamos', 'tarjeta de credito', 'inversiones', 'mercado bursatil'
      ],
      weight: 87
    },
    {
      category: 'Productivity',
      folder: 'Productivity',
      keywords: [
        'calendar', 'task manager', 'project management', 'notes', 'workflow', 'kanban', 'todo',
        'productividad', 'tareas', 'calendario', 'organizacion', 'apuntes', 'gestion del tiempo',
        'pomodoro', 'checklist', 'colaboracion'
      ],
      weight: 85
    },
    {
      category: 'Education',
      folder: 'Education',
      keywords: [
        'course', 'university', 'lecture', 'academy', 'curriculum', 'diploma', 'tutorial',
        'curso', 'universidad', 'educacion', 'aprendizaje', 'aprender', 'certificacion',
        'tutoriales', 'tesis', 'guia de estudio', 'masterclass', 'escuela'
      ],
      weight: 88
    },
    {
      category: 'Shopping',
      folder: 'Shopping',
      keywords: [
        'discount', 'store', 'checkout', 'ecommerce', 'cart', 'buy online', 'tienda', 'comprar',
        'oferta', 'descuento', 'catalogo', 'precio', 'carrito de compras', 'envio gratis'
      ],
      weight: 86
    },
    {
      category: 'News',
      folder: 'News',
      keywords: [
        'breaking news', 'journal', 'gazette', 'newspaper', 'daily digest', 'editorial',
        'ultimas noticias', 'periodico', 'diario', 'prensa', 'titulares', 'actualidad', 'internacional'
      ],
      weight: 86
    },
    {
      category: 'Social',
      folder: 'Social Media',
      keywords: [
        'community', 'forum', 'discussion', 'social network', 'feed', 'timeline', 'followers',
        'red social', 'comunidad', 'foro', 'perfil', 'mensajeria', 'seguidores', 'compartir'
      ],
      weight: 85
    },
    {
      category: 'Entertainment',
      folder: 'Entertainment',
      keywords: [
        'movies', 'series', 'cinema', 'soundtrack', 'videogames', 'gaming', 'pelicula', 'musica',
        'videojuegos', 'canciones', 'streaming', 'anime', 'manga', 'entretenimiento', 'juegos'
      ],
      weight: 87
    },
    {
      category: 'Reference',
      folder: 'Reference',
      keywords: [
        'encyclopedia', 'dictionary', 'archive', 'glossary', 'bibliography', 'citation',
        'enciclopedia', 'diccionario', 'definicion', 'referencia', 'archivo historico', 'glosario'
      ],
      weight: 85
    }
  ];

  classify(item: BookmarkItem, metadata?: PageMetadata): ClassificationResult | null {
    const metadataKeywords = (metadata?.keywords || []).join(' ');
    const combinedText = `
      ${item.title}
      ${metadata?.title || ''}
      ${metadata?.description || ''}
      ${metadata?.ogTitle || ''}
      ${metadata?.ogDescription || ''}
      ${metadataKeywords}
      ${item.url}
      ${item.pathString}
    `.toLowerCase();

    let bestMatch: ClassificationResult | null = null;
    let highestScore = 0;

    for (const rule of KeywordClassifier.KEYWORD_RULES) {
      let matchCount = 0;
      let matchedWord = '';

      for (const kw of rule.keywords) {
        if (combinedText.includes(kw)) {
          matchCount++;
          matchedWord = kw;
        }
      }

      if (matchCount > 0) {
        const liveMetaBonus = (metadata?.description || metadata?.ogDescription) ? 6 : 0;
        const confidence = Math.min(97, rule.weight + (matchCount - 1) * 3 + liveMetaBonus);

        if (confidence > highestScore) {
          highestScore = confidence;
          bestMatch = {
            category: rule.category,
            suggestedFolder: rule.folder,
            confidence,
            matchedRule: `Keyword match: "${matchedWord}"${liveMetaBonus ? ' (Live metadata verified)' : ''}`
          };
        }
      }
    }

    return bestMatch;
  }
}

// 4. Optional future AI Classifier interface stub
export class OptionalAIClassifier implements IClassifier {
  classify(_item: BookmarkItem, _metadata?: PageMetadata): ClassificationResult | null {
    return null;
  }
}

// Master Orchestrator
export class BookmarkOrganizer {
  private static classifiers: IClassifier[] = [
    new LocalRuleClassifier(),
    new UrlPatternClassifier(),
    new KeywordClassifier(),
    new OptionalAIClassifier()
  ];

  /**
   * Classify an individual bookmark, with optional live page metadata
   */
  static classifyBookmark(item: BookmarkItem, metadata?: PageMetadata): ClassificationResult {
    for (const classifier of this.classifiers) {
      const result = classifier.classify(item, metadata);
      if (result) return result;
    }

    // Heuristics based on domain extension & semantic patterns:
    const domain = (item.domain || '').toLowerCase();
    const url = (item.url || '').toLowerCase();
    const title = (item.title || '').toLowerCase();

    // 1. AI & Machine Learning
    if (
      domain.includes('ai') || domain.endsWith('.ai') || domain.includes('gpt') || domain.includes('llm') || domain.includes('bot') ||
      title.includes(' ai') || title.includes('artificial intelligence') || title.includes('inteligencia artificial')
    ) {
      return { category: 'AI', suggestedFolder: 'AI', confidence: 88, matchedRule: 'AI domain/keyword heuristic' };
    }

    // 2. Development, Engineering, Tech
    if (
      domain.includes('dev') || domain.includes('code') || domain.includes('git') || domain.includes('stack') ||
      domain.includes('api') || domain.includes('tech') || domain.includes('soft') || domain.includes('repo') ||
      domain.endsWith('.dev') || domain.endsWith('.io') || domain.endsWith('.tech') || domain.endsWith('.app') ||
      url.includes('/dev') || url.includes('/api') || url.includes('/docs') ||
      title.includes('developer') || title.includes('programming') || title.includes('programacion') || title.includes('desarrollo') || title.includes('codigo')
    ) {
      return { category: 'Development', suggestedFolder: 'Development', confidence: 86, matchedRule: 'Development domain/slug heuristic' };
    }

    // 3. Social Media & Communities
    if (
      domain.includes('social') || domain.includes('chat') || domain.includes('forum') || domain.includes('foro') ||
      domain.includes('community') || domain.includes('meet') || domain.includes('disc') ||
      title.includes('comunidad') || title.includes('foro') || title.includes('chat')
    ) {
      return { category: 'Social', suggestedFolder: 'Social Media', confidence: 86, matchedRule: 'Social/Community heuristic' };
    }

    // 4. Shopping & E-Commerce
    if (
      domain.includes('shop') || domain.includes('store') || domain.includes('buy') || domain.includes('cart') ||
      domain.includes('market') || domain.includes('deal') || domain.includes('tienda') || domain.includes('precio') ||
      domain.endsWith('.shop') || domain.endsWith('.store') ||
      url.includes('cart') || url.includes('tienda') ||
      title.includes('tienda') || title.includes('comprar') || title.includes('precio') || title.includes('oferta')
    ) {
      return { category: 'Shopping', suggestedFolder: 'Shopping', confidence: 86, matchedRule: 'Shopping/E-Commerce heuristic' };
    }

    // 5. Entertainment, Video, Audio, Gaming
    if (
      domain.includes('game') || domain.includes('play') || domain.includes('music') || domain.includes('video') ||
      domain.includes('stream') || domain.includes('movie') || domain.includes('tv') || domain.includes('cine') ||
      domain.includes('pelis') || domain.includes('song') || domain.includes('sound') || domain.includes('anime') ||
      title.includes('video') || title.includes('pelicula') || title.includes('juego') || title.includes('musica')
    ) {
      return { category: 'Entertainment', suggestedFolder: 'Entertainment', confidence: 86, matchedRule: 'Entertainment/Media heuristic' };
    }

    // 6. Education & Learning
    if (
      domain.includes('edu') || domain.includes('academy') || domain.includes('learn') || domain.includes('course') ||
      domain.includes('school') || domain.includes('study') || domain.includes('curso') || domain.endsWith('.edu') ||
      title.includes('curso') || title.includes('aprender') || title.includes('tutorial') || title.includes('universidad')
    ) {
      return { category: 'Education', suggestedFolder: 'Education', confidence: 86, matchedRule: 'Education/Courses heuristic' };
    }

    // 7. Finance, Banking, Crypto
    if (
      domain.includes('bank') || domain.includes('pay') || domain.includes('crypto') || domain.includes('finance') ||
      domain.includes('money') || domain.includes('coin') || domain.includes('wallet') || domain.includes('bolsa') ||
      title.includes('banco') || title.includes('inversion') || title.includes('finanzas') || title.includes('cripto')
    ) {
      return { category: 'Finance', suggestedFolder: 'Finance', confidence: 86, matchedRule: 'Finance heuristic' };
    }

    // 8. News & Press
    if (
      domain.includes('news') || domain.includes('press') || domain.includes('journal') || domain.includes('daily') ||
      domain.includes('post') || domain.includes('diario') || domain.includes('noticia') ||
      title.includes('noticias') || title.includes('diario') || title.includes('periodico')
    ) {
      return { category: 'News', suggestedFolder: 'News', confidence: 86, matchedRule: 'News/Media heuristic' };
    }

    // 9. Design & Creative
    if (
      domain.includes('design') || domain.includes('art') || domain.includes('photo') || domain.includes('font') ||
      domain.includes('icon') || domain.includes('draw') || domain.includes('color') || domain.includes('ui') ||
      domain.includes('ux') || domain.includes('canvas') || title.includes('diseño') || title.includes('design')
    ) {
      return { category: 'Design', suggestedFolder: 'Design', confidence: 86, matchedRule: 'Design/Creative heuristic' };
    }

    // 10. Tools & Utilities
    if (
      domain.includes('tool') || domain.includes('util') || domain.includes('calc') || domain.includes('convert') ||
      domain.includes('speed') || domain.includes('test') || domain.includes('check') || domain.includes('generator') ||
      title.includes('herramienta') || title.includes('tool') || title.includes('calculadora') || title.includes('convertidor')
    ) {
      return { category: 'Tools', suggestedFolder: 'Tools', confidence: 86, matchedRule: 'Online Tools heuristic' };
    }

    // 11. Productivity & Office
    if (
      domain.includes('mail') || domain.includes('calendar') || domain.includes('office') || domain.includes('task') ||
      domain.includes('notes') || domain.includes('agenda') || domain.includes('organizer')
    ) {
      return { category: 'Productivity', suggestedFolder: 'Productivity', confidence: 85, matchedRule: 'Productivity heuristic' };
    }

    // Intelligent default fallback: Reference (suggestedFolder: Reference, confidence: 80)
    // No more "Other" dumping ground!
    return {
      category: 'Reference',
      suggestedFolder: 'Reference',
      confidence: 80,
      matchedRule: 'General Reference & Resources'
    };
  }

  /**
   * Generate an organization preview plan without touching the bookmark tree
   */
  static generatePreview(
    items: BookmarkItem[],
    options: {
      minConfidence?: number;
      preserveExisting?: boolean;
      reorganizeExisting?: boolean;
      liveResultsMap?: Map<string, LiveInspectionResult>;
      exclude404Ids?: Set<string>;
    } = {}
  ): OrganizationPlan {
    const shouldReorganizeExisting = options.reorganizeExisting ?? true;
    const effectiveMinConfidence = shouldReorganizeExisting ? 0 : (options.minConfidence ?? 65);
    const liveMap = options.liveResultsMap;
    const exclude404Ids = options.exclude404Ids;

    const changes: OrganizationChange[] = [];
    const categoryCounts: Record<string, number> = {};

    let willMoveCount = 0;

    for (const item of items) {
      // If marked as 404 to be deleted, don't plan a move for it
      if (exclude404Ids && exclude404Ids.has(item.id)) {
        continue;
      }

      const liveData = liveMap?.get(item.id);
      const metadata = liveData?.metadata;

      const result = this.classifyBookmark(item, metadata);
      categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;

      // Current folder name
      const currentFolder = (item.path && item.path.length > 0)
        ? item.path[item.path.length - 1].trim()
        : '';
      const folderLower = currentFolder.toLowerCase();
      const targetFolderLower = result.suggestedFolder.trim().toLowerCase();

      // An item is considered ALREADY correctly organized in its target consolidated folder ONLY IF:
      // 1. It is inside a folder whose name matches result.suggestedFolder
      // 2. That folder is a direct child of the root Bookmarks Bar (i.e. item.path.length === 2)
      const isDirectlyInTarget =
        item.path.length === 2 &&
        folderLower === targetFolderLower;

      let isMoveWarranted = false;

      if (shouldReorganizeExisting) {
        // Move any bookmark that is not ALREADY directly in the single clean consolidated root folder!
        // This includes:
        // - Bookmarks sitting loose on the Bookmarks Bar (path.length <= 1)
        // - Bookmarks in "Other Bookmarks" / "Otros marcadores"
        // - Bookmarks in any existing old folders
        // - Bookmarks in nested subfolders
        // - Bookmarks in a folder whose category does not match their content
        isMoveWarranted = !isDirectlyInTarget && result.confidence >= effectiveMinConfidence;
      } else {
        // Only move loose bookmarks on the Bookmarks Bar or Root
        const isRootOrBar =
          item.path.length <= 1 ||
          item.parentId === '1' ||
          item.parentId === '2' ||
          item.parentId === '0' ||
          ['bookmarks bar', 'barra de marcadores', 'barra de favoritos', 'favoritos', 'other bookmarks', 'otros marcadores', 'root']
            .includes(folderLower);

        isMoveWarranted = isRootOrBar && !isDirectlyInTarget && result.confidence >= effectiveMinConfidence;
      }

      if (isMoveWarranted) {
        willMoveCount++;
        changes.push({
          bookmarkId: item.id,
          title: (metadata?.title && metadata.title.length > 3) ? metadata.title : item.title,
          url: item.url,
          currentPath: item.pathString,
          targetCategory: result.category,
          suggestedFolder: result.suggestedFolder,
          confidence: result.confidence,
          matchedRule: result.matchedRule
        });
      }
    }

    return {
      totalAnalyzed: items.length,
      willMoveCount,
      duplicateCount: 0,
      brokenCount: 0,
      categoryCounts,
      changes
    };
  }

  /**
   * Safely apply organization plan with automatic pre-operation safety backup
   */
  static async applyOrganization(
    plan: OrganizationPlan,
    options: {
      updateTitles?: boolean;
      delete404Ids?: string[];
      deleteEmptyFolders?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    movedCount: number;
    deleted404Count: number;
    deletedEmptyFoldersCount: number;
    backupId: string;
    errors: string[];
  }> {
    // 1. Create an automatic safety backup first!
    const safetyBackup = await BackupService.createBackup('Automatic Pre-Organization Safety Backup', true);

    const errors: string[] = [];
    let movedCount = 0;
    let deleted404Count = 0;
    let deletedEmptyFoldersCount = 0;

    // 2. Delete detected 404 URLs if requested
    if (options.delete404Ids && options.delete404Ids.length > 0) {
      for (const id of options.delete404Ids) {
        try {
          await BookmarkService.remove(id);
          deleted404Count++;
        } catch (err: any) {
          errors.push(`Failed deleting 404 bookmark ${id}: ${err.message || 'Unknown error'}`);
        }
      }
    }

    // 3. Locate the real Bookmarks Bar parent ID in Chromium across languages
    const tree = await BookmarkService.getTree();
    const rootChildren = tree[0]?.children || [];
    const barNode = rootChildren.find(
      (c) =>
        c.id === '1' ||
        c.title.toLowerCase().includes('bar') ||
        c.title.toLowerCase().includes('favorit') ||
        c.title.toLowerCase().includes('marcador')
    ) || rootChildren[0];
    const rootTargetParentId = barNode ? barNode.id : '1';

    // 4. Map consolidated folders that exist DIRECTLY under the Bookmarks Bar
    const consolidatedFolderMap: Record<string, string> = {};
    if (barNode && barNode.children) {
      for (const child of barNode.children) {
        if (!child.url && child.title) {
          consolidatedFolderMap[child.title.trim().toLowerCase()] = child.id;
        }
      }
    }

    // 5. Move bookmarks into single consolidated folders
    for (const change of plan.changes) {
      try {
        if (options.updateTitles && change.title) {
          try {
            await BookmarkService.update(change.bookmarkId, { title: change.title });
          } catch {
            // Non-critical if title update fails
          }
        }

        const folderName = change.suggestedFolder;
        let targetFolderId = consolidatedFolderMap[folderName.toLowerCase()];

        if (!targetFolderId) {
          // Create the single clean folder directly under the Bookmarks Bar
          const newFolder = await BookmarkService.createFolder(rootTargetParentId, folderName);
          targetFolderId = newFolder.id;
          consolidatedFolderMap[folderName.toLowerCase()] = targetFolderId;
        }

        // Avoid unnecessary move if already directly in targetFolderId
        const currentNode = await BookmarkService.get(change.bookmarkId).catch(() => null);
        if (currentNode && currentNode.parentId === targetFolderId) {
          continue;
        }

        // Move bookmark into destination folder
        await BookmarkService.move(change.bookmarkId, { parentId: targetFolderId });
        movedCount++;
      } catch (err: any) {
        errors.push(`Failed moving "${change.title}": ${err.message || 'Unknown error'}`);
      }
    }

    // 6. Clean up any empty folders resulting from the reorganization if requested
    if (options.deleteEmptyFolders) {
      try {
        // Multi-pass to handle nested folders that become empty
        for (let pass = 0; pass < 3; pass++) {
          const emptyFolders = await BookmarkService.findEmptyFolders();
          let passDeleted = 0;
          for (const ef of emptyFolders) {
            // Do not delete root categories, bookmarks bar, or newly created consolidated folders
            const isProtected =
              ef.id === '0' ||
              ef.id === '1' ||
              ef.id === '2' ||
              ef.id === '3' ||
              ef.id === rootTargetParentId ||
              Object.values(consolidatedFolderMap).includes(ef.id);

            if (!isProtected) {
              try {
                await BookmarkService.remove(ef.id);
                deletedEmptyFoldersCount++;
                passDeleted++;
              } catch {
                // Non-critical if already deleted
              }
            }
          }
          if (passDeleted === 0) break;
        }
      } catch (err: any) {
        errors.push(`Error while cleaning empty folders: ${err.message || 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      movedCount,
      deleted404Count,
      deletedEmptyFoldersCount,
      backupId: safetyBackup.id,
      errors
    };
  }
}
