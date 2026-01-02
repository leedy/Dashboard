const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Cache for stock quotes
let quotesCache = {
  data: null,
  lastFetch: null
};

// Cache durations based on market state
const CACHE_DURATIONS = {
  regular: 5 * 60 * 1000,      // 5 minutes during market hours
  extended: 15 * 60 * 1000,    // 15 minutes during pre/post market
  closed: 60 * 60 * 1000       // 1 hour when market is closed
};

// Determine current market state based on ET timezone
function getMarketState() {
  const now = new Date();

  // Convert to ET (handles DST automatically)
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = etTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Weekend - market closed
  if (day === 0 || day === 6) {
    return 'closed';
  }

  // Market hours (all in ET):
  // Pre-market: 4:00 AM - 9:30 AM (240 - 570 minutes)
  // Regular: 9:30 AM - 4:00 PM (570 - 960 minutes)
  // After-hours: 4:00 PM - 8:00 PM (960 - 1200 minutes)
  // Closed: 8:00 PM - 4:00 AM

  if (timeInMinutes >= 570 && timeInMinutes < 960) {
    return 'regular';
  } else if ((timeInMinutes >= 240 && timeInMinutes < 570) ||
             (timeInMinutes >= 960 && timeInMinutes < 1200)) {
    return 'extended';
  } else {
    return 'closed';
  }
}

function getCacheDuration() {
  const state = getMarketState();
  return CACHE_DURATIONS[state];
}

// Major indices symbols
const INDICES = [
  '^GSPC',  // S&P 500
  '^DJI',   // Dow Jones Industrial Average
  '^IXIC',  // Nasdaq Composite
  '^RUT'    // Russell 2000
];

// Get stock quotes for major indices
router.get('/quotes', async (req, res) => {
  try {
    const now = Date.now();
    const cacheDuration = getCacheDuration();
    const marketState = getMarketState();

    // Check cache
    if (quotesCache.data && quotesCache.lastFetch && (now - quotesCache.lastFetch) < cacheDuration) {
      console.log(`Returning cached stock quotes (market: ${marketState}, cache: ${cacheDuration / 60000}min)`);
      return res.json(quotesCache.data);
    }

    console.log(`Fetching fresh stock quotes (market: ${marketState}, cache: ${cacheDuration / 60000}min)`);

    // Fetch quotes for all indices
    const quotes = await yahooFinance.quote(INDICES);

    // Transform the data to a simpler format
    const transformedQuotes = INDICES.map(symbol => {
      const quote = Array.isArray(quotes) ? quotes.find(q => q.symbol === symbol) : quotes;

      if (!quote) {
        return {
          symbol,
          name: getIndexName(symbol),
          price: null,
          change: null,
          changePercent: null,
          error: 'Quote not found'
        };
      }

      return {
        symbol: quote.symbol,
        name: getIndexName(quote.symbol),
        price: quote.regularMarketPrice || null,
        change: quote.regularMarketChange || null,
        changePercent: quote.regularMarketChangePercent || null,
        previousClose: quote.regularMarketPreviousClose || null,
        marketState: quote.marketState || 'UNKNOWN'
      };
    });

    // Update cache
    quotesCache.data = transformedQuotes;
    quotesCache.lastFetch = now;

    res.json(transformedQuotes);
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    res.status(500).json({ error: 'Failed to fetch stock quotes', details: error.message });
  }
});

// Helper function to get friendly index names
function getIndexName(symbol) {
  const names = {
    '^GSPC': 'S&P 500',
    '^DJI': 'Dow Jones',
    '^IXIC': 'Nasdaq',
    '^RUT': 'Russell 2000'
  };
  return names[symbol] || symbol;
}

module.exports = router;
