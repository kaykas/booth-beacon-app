/**
 * IndexNow API Client
 * Instantly notifies search engines (Bing, Yandex, Naver, Seznam) when URLs are updated
 * Documentation: https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = '8c1a37a40f220431fdb88003e96e9801';
const HOST = 'boothbeacon.org';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

// IndexNow endpoint (shared by all search engines)
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Alternative endpoints (optional - IndexNow automatically notifies all participating search engines)
const ENDPOINTS = {
  bing: 'https://www.bing.com/indexnow',
  yandex: 'https://yandex.com/indexnow',
  naver: 'https://searchadvisor.naver.com/indexnow',
  seznam: 'https://search.seznam.cz/indexnow',
};

export interface IndexNowSubmission {
  url: string;
  timestamp?: string;
}

export interface IndexNowBatchSubmission {
  urls: string[];
  timestamp?: string;
}

/**
 * Submit a single URL to IndexNow
 */
export async function submitUrl(url: string): Promise<boolean> {
  try {
    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: [url],
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`✅ IndexNow: Successfully submitted ${url}`);
      return true;
    } else {
      console.warn(`⚠️ IndexNow: Failed to submit ${url} - Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ IndexNow: Error submitting ${url}:`, error);
    return false;
  }
}

/**
 * Submit multiple URLs to IndexNow (batch submission)
 * Maximum 10,000 URLs per request
 */
export async function submitUrls(urls: string[]): Promise<boolean> {
  if (urls.length === 0) {
    console.warn('⚠️ IndexNow: No URLs provided');
    return false;
  }

  // IndexNow allows max 10,000 URLs per request
  const batchSize = 10000;
  const batches = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  let allSuccess = true;

  for (const batch of batches) {
    try {
      const payload = {
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      };

      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200 || response.status === 202) {
        console.log(`✅ IndexNow: Successfully submitted batch of ${batch.length} URLs`);
      } else {
        console.warn(`⚠️ IndexNow: Failed to submit batch - Status ${response.status}`);
        allSuccess = false;
      }
    } catch (error) {
      console.error('❌ IndexNow: Error submitting batch:', error);
      allSuccess = false;
    }
  }

  return allSuccess;
}

/**
 * Submit a booth page to IndexNow
 */
export async function submitBooth(slug: string): Promise<boolean> {
  const url = `https://${HOST}/booth/${slug}`;
  return submitUrl(url);
}

/**
 * Submit multiple booth pages to IndexNow
 */
export async function submitBooths(slugs: string[]): Promise<boolean> {
  const urls = slugs.map((slug) => `https://${HOST}/booth/${slug}`);
  return submitUrls(urls);
}

/**
 * Submit a collection or index page to IndexNow
 */
export async function submitPage(path: string): Promise<boolean> {
  const url = `https://${HOST}${path}`;
  return submitUrl(url);
}

/**
 * Helper: Submit booth and related pages (booth page + city page + country page)
 */
export async function submitBoothAndRelated(params: {
  slug: string;
  city?: string;
  state?: string;
  country?: string;
}): Promise<boolean> {
  const urls: string[] = [
    `https://${HOST}/booth/${params.slug}`,
  ];

  // Add related pages
  if (params.country) {
    const countrySlug = params.country.toLowerCase().replace(/\s+/g, '-');
    urls.push(`https://${HOST}/locations/${countrySlug}`);

    if (params.city) {
      const citySlug = params.city.toLowerCase().replace(/\s+/g, '-');
      if (params.state) {
        const stateSlug = params.state.toLowerCase().replace(/\s+/g, '-');
        urls.push(`https://${HOST}/locations/${countrySlug}/${stateSlug}/${citySlug}`);
      } else {
        urls.push(`https://${HOST}/locations/${countrySlug}/${citySlug}`);
      }
    }
  }

  return submitUrls(urls);
}
