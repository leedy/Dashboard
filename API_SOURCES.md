# External API Sources

This document details all external API data sources used in the Dashboard application. All external API requests are proxied through our backend server to avoid CORS issues and enable intelligent caching.

---

## Sports Data APIs

### 1. NHL API (Official)

**Base URL:** `https://api-web.nhle.com`
**Authentication:** None required
**Rate Limits:** Unknown (appears to be generous for reasonable use)
**Cost:** Free

**What we use:**
- Daily game scores and schedules
- Live game updates (scores, periods, game states)
- Team standings
- Season schedules
- Recent game history (last 10 games per team)

**Key Endpoints:**
```
GET /v1/score/{YYYY-MM-DD}
    Returns all NHL games for a specific date

GET /v1/standings/{YYYY-MM-DD}
    Returns current NHL standings

GET /v1/club-schedule-season/{teamAbbrev}/{seasonId}
    Returns full season schedule for a team
    Example: /v1/club-schedule-season/PHI/20242025
```

**Documentation:** No official public documentation. This is the undocumented API that powers NHL.com.

**Game States:**
- `LIVE` - Game in progress
- `CRIT` - Critical moments (final minutes, OT, shootout)
- `FINAL` - Game completed
- `OFF` - Game completed (legacy state)
- `FUT` - Game scheduled but not started

**Notes:**
- Uses Eastern Time for game scheduling
- Season ID format: `YYYYYYY` (start year + end year, e.g., `20242025`)
- Team abbreviations: PHI, NYR, PIT, WSH, etc.

---

### 2. ESPN API (NFL & MLB)

**Base URL:** `https://site.api.espn.com`
**Authentication:** None required
**Rate Limits:** Unknown (appears to be generous for reasonable use)
**Cost:** Free

**What we use:**
- NFL game scores and schedules (current week)
- MLB game scores and schedules (daily)
- Division standings for both sports
- Live game states and statistics

**Key Endpoints:**

**NFL:**
```
GET /apis/site/v2/sports/football/nfl/scoreboard
    Returns current week's NFL games
    No date parameter needed - automatically returns current week

GET /apis/v2/sports/football/nfl/standings?group={divisionId}
    Returns standings for a specific division
    Division IDs: 1, 3, 4, 6, 10, 11, 12, 13
```

**MLB:**
```
GET /apis/site/v2/sports/baseball/mlb/scoreboard?dates={YYYYMMDD}
    Returns MLB games for a specific date
    Example: dates=20241115

GET /apis/v2/sports/baseball/mlb/standings?group={divisionId}
    Returns standings for a specific division
    Division IDs: 5, 6, 7 (AL), 15, 16, 17 (NL)
```

**Documentation:** No official public documentation. This is ESPN's internal API.

**Game States:**
- `in` - Game in progress
- `pre` - Game scheduled but not started
- `post` - Game completed

**Notes:**
- MLB uses Eastern Time for game scheduling
- Date format for MLB: `YYYYMMDD` (e.g., `20241115`)
- NFL scoreboard returns the entire current week automatically

---

## Disney Theme Park APIs

### 3. Queue-Times API

**Base URL:** `https://queue-times.com`
**Authentication:** None required
**Rate Limits:** Unknown
**Cost:** Free

**What we use:**
- Real-time wait times for all Disney World rides and attractions
- Attraction names and locations (lands)
- Operating status (open, closed, down)

**Key Endpoints:**
```
GET /parks/{parkId}/queue_times.json
    Returns current wait times for all attractions in a park
    Park IDs:
        5 - Epcot
        6 - Magic Kingdom
        7 - Hollywood Studios
        8 - Animal Kingdom
```

**Response Structure:**
```json
{
  "lands": [
    {
      "name": "Tomorrowland",
      "rides": [
        {
          "id": 123,
          "name": "Space Mountain",
          "wait_time": 45,
          "is_open": true
        }
      ]
    }
  ]
}
```

**Website:** https://queue-times.com
**Documentation:** No official API documentation

**Notes:**
- Data updates approximately every 5-10 minutes
- Wait times in minutes
- `wait_time: 0` can mean either no wait or attraction is closed (check `is_open`)

---

### 4. ThemeParks.Wiki API

**Base URL:** `https://api.themeparks.wiki`
**Authentication:** None required
**Rate Limits:** Unknown
**Cost:** Free

**What we use:**
- Park operating hours and schedules
- Special event times (Extended Evening Hours, Early Entry, etc.)
- Park open/close times

**Key Endpoints:**
```
GET /v1/entity/{entityId}/schedule
    Returns schedule for a specific park entity

    Disney World Park Entity IDs:
        Magic Kingdom: 75ea578a-adc8-4116-a54d-dccb60765ef9
        Epcot: 47f90d2c-e191-4239-a466-5892ef59a88b
        Hollywood Studios: 288747d1-8b4f-4a64-867e-ea7c9b27bad8
        Animal Kingdom: 1c84a229-8862-4648-9c71-378ddd2c7693
```

**Response Structure:**
```json
{
  "schedule": [
    {
      "date": "2024-11-15",
      "type": "OPERATING",
      "openingTime": "2024-11-15T14:00:00.000Z",
      "closingTime": "2024-11-15T02:00:00.000Z"
    },
    {
      "date": "2024-11-15",
      "type": "TICKETED_EVENT",
      "openingTime": "2024-11-15T02:00:00.000Z",
      "closingTime": "2024-11-15T05:00:00.000Z",
      "description": "Extended Evening Hours"
    }
  ]
}
```

**Official Documentation:** https://api.themeparks.wiki/docs/v1/
**GitHub:** https://github.com/ThemeParks/parksapi

**Schedule Types:**
- `OPERATING` - Regular park hours
- `TICKETED_EVENT` - Special events (Extended Hours, After Hours, etc.)
- `EXTRA_HOURS` - Extra Magic Hours
- `CLOSED` - Park closed

**Notes:**
- Times are in UTC - convert to local time for display
- A single date can have multiple schedule entries (regular hours + special events)
- We use the earliest opening and latest closing across all entries

---

## Entertainment APIs

### 5. The Movie Database (TMDb) API

**Base URL:** `https://api.themoviedb.org/3`
**Authentication:** API key required (free)
**Rate Limits:** 40 requests per 10 seconds for free tier
**Cost:** Free for non-commercial use

**What we use:**
- Upcoming movie releases
- Movie posters
- Movie metadata (titles, release dates, descriptions)

**Key Endpoints:**
```
GET /movie/upcoming?api_key={key}&language=en-US&page=1&region=US
    Returns upcoming movies releasing in theaters
    Filters to next 30 days in our implementation

Image URLs:
    https://image.tmdb.org/t/p/w500/{poster_path}
    Base URL for movie posters (500px width)
```

**Official Documentation:** https://developers.themoviedb.org/3
**API Key Signup:** https://www.themoviedb.org/settings/api

**Configuration:**
- API key can be set in `frontend/.env.local` as `VITE_TMDB_API_KEY`
- Or configured via Admin panel (stored in MongoDB preferences)
- Admin panel setting takes precedence over environment variable

**Available Image Sizes:**
- w92, w154, w185, w342, w500, w780, original
- We use w500 for optimal balance of quality and load time

**Notes:**
- Free API key requires account signup
- API key is the only required external credential for this project
- Movies are filtered to US region and next 30 days

---

## News & RSS Feeds

### 6. Google News RSS

**Base URL:** `https://news.google.com/rss`
**Authentication:** None required
**Rate Limits:** Unknown (reasonable use)
**Cost:** Free

**What we use:**
- Team-specific news articles
- Article headlines, links, and publication dates
- Source attribution

**Key Endpoints:**
```
GET /search?q={teamName}&hl=en-US&gl=US&ceid=US:en
    Returns RSS feed for team news
    Example: q=Philadelphia+Flyers
```

**Response Format:** RSS 2.0 XML (parsed to JSON by our backend)

**What we extract:**
```javascript
{
  title: "Article headline",
  link: "https://...",
  pubDate: "2024-11-15T12:00:00Z",
  source: "ESPN",
  description: "Article snippet..."
}
```

**Notes:**
- Returns top 15 most recent articles
- Team name must be URL encoded
- Generic endpoint - works for any team in any sport
- Parsed using `rss-parser` library in backend

---

## API Usage & Caching Strategy

### Backend Caching

All external API responses are cached in MongoDB to reduce API calls and improve performance:

**Game Data Caching** (`gameCache.js`):
- **Live games:** 1-minute cache (real-time updates)
- **Pre-game:** 5-minute cache (less frequent checks)
- **All games final:** 60-minute cache (minimal API calls)

**Standings Caching** (`standingsCache.js`):
- **All games final:** 15-minute cache (standings may have updated)
- **Live games:** 30-minute cache (standings won't change until games finish)
- **Pre-game/No games:** 120-minute cache (standings won't change)

**Benefits:**
- Reduces load on external APIs
- Improves response times
- Provides resilience if external APIs are temporarily down
- Adaptive refresh rates based on game states

### Frontend Refresh Intervals

- **Sports dashboards:** Auto-refresh every 30 seconds when games are live
- **Disney dashboard:** Manual refresh button (wait times update every 5-10 min externally)
- **Movies dashboard:** Loads once on mount (data doesn't change frequently)

---

## Proxy Architecture

All external API requests are proxied through our Express.js backend server at `localhost:3001`:

**Frontend Request:**
```javascript
axios.get('/api/nhl/v1/score/2024-11-15')
```

**Backend Proxy:**
```javascript
// server.js
app.use('/api/nhl', async (req, res) => {
  const targetUrl = `https://api-web.nhle.com${path}`;
  const response = await axios.get(targetUrl);
  res.json(response.data);
});
```

**Why we proxy:**
1. **CORS avoidance** - Browser CORS restrictions don't apply to server-side requests
2. **Caching** - Backend can cache responses in MongoDB
3. **Rate limiting** - Single point to manage API request throttling
4. **Security** - Keeps API keys and logic server-side
5. **Logging** - Central logging of all external API calls

---

## API Reliability & Error Handling

**Error Handling Strategy:**

1. **Graceful degradation** - Show cached data if API fails
2. **User feedback** - Clear error messages when APIs are unavailable
3. **Retry logic** - Frontend retries on 5xx errors
4. **Fallbacks** - TMDb API requires key; shows setup instructions if missing

**Known Issues:**

- **NHL API:** Occasionally returns 5xx errors during high traffic (playoffs, opening day)
- **ESPN API:** Can be slow during live NFL games (millions of concurrent users)
- **Queue-Times:** May have stale data if Disney IT systems are down
- **TMDb:** Rate limits may be hit if page is refreshed rapidly

**Monitoring:**

All API requests are logged in backend console:
```
NHL Proxy: https://api-web.nhle.com/v1/score/2024-11-15
NFL Proxy: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
Queue-Times Proxy: https://queue-times.com/parks/6/queue_times.json
```

Check logs with: `pm2 logs dashboard-backend`

---

## Adding New External APIs

To add a new external API source:

1. **Add proxy route** in `backend/server.js`:
```javascript
app.use('/api/new-source', async (req, res) => {
  const targetUrl = `https://api.example.com${req.url}`;
  const response = await axios.get(targetUrl);
  res.json(response.data);
});
```

2. **Add caching** (optional) - Create route in `backend/routes/`

3. **Update frontend** - Make requests to `/api/new-source/...`

4. **Document here** - Add API details to this file

5. **Add to .env** (if API key required)

---

## External Links & Resources

**NHL:**
- NHL.com: https://www.nhl.com
- NHL Stats: https://www.nhl.com/stats

**ESPN:**
- NFL Scores: https://www.espn.com/nfl/scoreboard
- MLB Scores: https://www.espn.com/mlb/scoreboard

**Disney:**
- Queue-Times: https://queue-times.com
- ThemeParks.Wiki: https://themeparks.wiki
- ThemeParks.Wiki API Docs: https://api.themeparks.wiki/docs/v1/

**Movies:**
- TMDb: https://www.themoviedb.org
- TMDb API Docs: https://developers.themoviedb.org/3
- Get API Key: https://www.themoviedb.org/settings/api

**News:**
- Google News: https://news.google.com

---

## License & Terms of Use

**IMPORTANT:** When using this dashboard application, you are subject to the terms of service of each external API provider. Please review their terms:

- **NHL API:** Unofficial/undocumented API - use responsibly
- **ESPN API:** Unofficial/undocumented API - use responsibly
- **Queue-Times:** Community-sourced data - free for personal use
- **ThemeParks.Wiki:** Open-source project - free for personal use
- **TMDb API:** Free for non-commercial use - [Terms](https://www.themoviedb.org/terms-of-use)
- **Google News RSS:** Public RSS feeds - reasonable use

**This dashboard is intended for personal, non-commercial use only.**

---

Last Updated: November 2024
