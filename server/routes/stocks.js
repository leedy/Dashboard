const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Cache for stock quotes (5 minute cache)
let quotesCache = {
  data: null,
  lastFetch: null,
  cacheDuration: 5 * 60 * 1000 // 5 minutes
};

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

    // Check cache
    if (quotesCache.data && quotesCache.lastFetch && (now - quotesCache.lastFetch) < quotesCache.cacheDuration) {
      console.log('Returning cached stock quotes');
      return res.json(quotesCache.data);
    }

    console.log('Fetching fresh stock quotes from Yahoo Finance');

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
