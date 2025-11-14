# Dashboard Application Roadmap

This document tracks completed features, planned enhancements, and future ideas for the Dashboard application.

---

## Recently Completed Features

- [x] Bob's Car Wash Dashboard - Weather-based car wash recommendations
- [x] Market Overview Dashboard - Major stock indices (S&P 500, Dow, Nasdaq, Russell 2000)
- [x] Multiple Countdown Events - Support unlimited countdown timers with rotation
- [x] Countdown Navigation Controls - Manual browsing with timer reset
- [x] Error Boundaries - Crash isolation for stability on Raspberry Pi
- [x] TMDb API Key Management - Move API keys to Admin panel
- [x] Dashboard Controls Tab - Dedicated rotation settings interface
- [x] NHL Goal Summary Enhancement - Team logos in goal details
- [x] Timezone Bug Fixes - Proper ET timezone handling for games
- [x] Photo Display Duration Controls - Independent timing for family photos and event slides
- [x] Slideshow Position Persistence - Remember photo position when dashboard rotates away
- [x] Usage Analytics IP Tracking - Capture real client IPs behind nginx proxy
- [x] Auto-Rotation Timer Reset - User interaction resets rotation countdown

---

## High Priority Enhancements

### Performance & Reliability

#### Photo Storage Optimization
**Current:** Photos stored as base64 in MongoDB (storage-intensive)
**Impact:** High - reduces costs and improves performance
**Enhancement:**
- Consider file system storage for scalability
- Currently limited to 10MB per photo
- Base64 encoding increases storage by ~33%
- Could implement:
  - File system storage with MongoDB storing only file paths
  - Optional CDN integration for photo delivery
  - Image compression/optimization on upload

#### Bundle Size Monitoring
**Current:** 19 lazy-loaded dashboard components, main bundle ~242KB
**Enhancement:**
- Add bundle size analysis tooling (webpack-bundle-analyzer)
- Set up CI/CD bundle size checks
- Consider code splitting strategies for larger components
- Monitor and optimize third-party dependencies

#### Testing Framework
**Current:** No test suite
**Impact:** High - ensures quality and prevents regressions
**Enhancement:**
- Add testing framework (Jest, Vitest, React Testing Library)
- Unit tests for utility functions and hooks
- Component integration tests
- API endpoint tests
- End-to-end testing (Playwright, Cypress)
- Coverage reporting and minimum coverage thresholds

#### PM2 Ecosystem Migration
**Status:** Needs completion
**Action:** Fix migration to ecosystem.config.js

### Weather & Environment

#### Weather Alerts Enhancement
**Priority:** High
**Features:**
- Add severe weather warnings and notifications
- NOAA API integration for US weather alerts
- Visual indicators for active alerts
- Alert type categorization (tornado, flood, etc.)

#### Weather Radar with Animation
**Priority:** High
**Features:**
- Animated radar map for tracking storms
- Loop control and playback speed
- Location-based radar viewing

#### Air Quality & Pollen Tracking
**Priority:** Medium-High
**Features:**
- Enhanced air quality index with health recommendations
- Pollen forecast (trees, grass, weeds) for allergy sufferers
- BreezoMeter API integration (see API research below)
- UV index and sun protection recommendations

### Financial & Tracking

#### YNAB API Integration
**Priority:** High (see extensive API research below)
**Features:**
- Budget overview showing remaining amounts in categories
- Month-to-date spending by category
- Account balances with trend indicators
- Upcoming scheduled transactions
- Budget health indicators
- **See detailed implementation plan in API Research section**

#### Stock Watchlist Expansion
**Priority:** Medium
**Features:**
- Track specific stocks beyond major indices
- Individual stock cards with 52-week range
- Customizable watchlist

#### Crypto Prices Dashboard
**Priority:** Medium
**Features:**
- Bitcoin, Ethereum, and other cryptocurrencies
- 24-hour change indicators
- CoinGecko API integration

#### Gas Prices Tracker
**Priority:** Medium
**Features:**
- Local gas station prices
- GasBuddy API integration
- Price trend indicators

### Family & Home

#### Family Calendar Integration
**Priority:** High
**Features:**
- Google Calendar sync showing upcoming events
- Week/month view options
- Event countdown integration

#### Birthday & Anniversary Tracker
**Priority:** Medium
**Features:**
- Countdown to important family dates
- Visual reminders as dates approach
- Recurring annual events

#### Package Tracking Dashboard
**Priority:** Medium-High
**Features:**
- Track Amazon/UPS/FedEx/USPS deliveries
- AfterShip API integration
- Delivery status updates
- Estimated delivery countdown

---

## Medium Priority Enhancements

### News & Information

#### News Headlines Dashboard
**Features:**
- Top news stories (similar to sports RSS feeds)
- Customizable sources and categories
- News API integration

#### Traffic & Commute Dashboard
**Features:**
- Real-time traffic for common routes
- Google Maps Traffic API or Waze integration
- Commute time estimates
- Incident alerts

### Entertainment

#### TV Show Tracker
**Features:**
- Shows you're watching with next episode dates
- Episode countdown
- New episode notifications

#### Spotify Integration
**Features:**
- Now playing widget
- Recently played tracks
- Playlist display

### Architecture & Scalability

#### Multi-User Support
**Current:** Single user model with `userId: 'default-user'`
**Effort:** High
**Enhancement:**
- Schema is already ready for multi-user expansion
- Would need to implement:
  - User authentication system (JWT, OAuth, etc.)
  - User registration/login UI
  - Per-user preferences and photo management
  - User session management
  - Protected routes

#### Enhanced API Key Management
**Current:** TMDb API key in Admin panel, others in `.env.local`
**Enhancement:**
- Centralized API key configuration in Admin panel
- Support for multiple API keys (TMDb, YNAB, BreezoMeter, etc.)
- Secure storage and retrieval of API credentials
- Per-user API keys if multi-user implemented

### UI/UX Improvements

#### Dashboard Customization
**Features:**
- Drag-and-drop dashboard reordering
- Custom color themes/schemes
- Dashboard-specific settings (refresh rates, data sources)
- Widget resizing
- Custom dashboard layouts (grid positions)

#### Accessibility
**Features:**
- Screen reader optimization
- Keyboard navigation improvements
- High contrast mode
- Font size controls
- Voice control support

#### Mobile Experience
**Features:**
- Progressive Web App (PWA) support
- Touch gesture controls
- Mobile-optimized layouts
- Push notifications
- Home screen installation

### Disney Dashboard Enhancements

**Features:**
- Historical wait time tracking and predictions
- Ride downtime alerts
- Park capacity indicators
- Dining reservation availability
- Show times and parade schedules
- Virtual queue status (Lightning Lane, etc.)

### Sports Enhancements

**Features:**
- Add more sports (NBA, etc.)
- Team-specific notifications for game start times
- Live play-by-play updates
- Historical game data and statistics
- Playoff brackets and standings predictions

---

## API Research & Integration Plans

### YNAB API (You Need A Budget)

**Purpose:** Personal budget tracking and financial management

#### API Capabilities

**Read Access (GET):**
- Budgets - All user budgets and details
- Accounts - Bank accounts, credit cards, balances
- Categories - Budget categories and allocations
- Transactions - Full transaction history (dates, amounts, payees, categories)
- Scheduled Transactions - Recurring transactions
- Payees - List of all payees
- Monthly Data - Month-by-month budget snapshots

**Write Access (POST/PATCH/DELETE):**
- Create transactions - Add new transactions programmatically
- Update transactions - Modify existing transactions
- Update categories - Change category budgets and goal targets
- Update payees - Rename payees
- Manage scheduled transactions - Create, update, delete recurring items

**Special Features:**
- Delta Requests - Only fetch changes since last request (efficient)
- Personal Access Tokens - Easy authentication for personal projects
- OAuth Support - Build apps others can use
- Rate Limiting - 200 requests per hour
- Currency in milliunits - $1.00 = 1000 milliunits (precise calculations)

#### Dashboard Ideas

**Financial Overview Widget:**
- Current account balances with trend indicators
- Month-to-date spending by category
- Budget vs. actual comparison with visual progress bars
- Net worth tracking over time
- Available to budget amount

**Spending Insights:**
- Top spending categories this month
- Daily/weekly spending trends
- Largest recent transactions
- Upcoming scheduled transactions (bills due)
- Category spending velocity (on track, over budget, under budget)

**Budget Health Indicators:**
- Categories over budget (red alerts with amounts)
- Categories under budget (green with remaining amounts)
- Goal progress for savings categories
- Percentage of month elapsed vs. percentage of budget used

**Visual Displays:**
- Spending by category pie chart
- Daily spending line graph
- Month-over-month comparison
- Account balance trends
- Category budget allocation bar chart

**Smart Alerts:**
- "You've spent 80% of your Groceries budget"
- "Rent due in 3 days ($X,XXX)"
- "You're $200 under budget this month!"
- Large transaction notifications (> $X threshold)
- Unusual spending pattern detection

**Quick Entry Dashboard:**
- Add transactions without opening YNAB app
- Categorize recent transactions
- Approve imported transactions
- Quick split transaction entry

#### Implementation Notes
- Base URL: `https://api.ynab.com/v1`
- Authentication: Personal Access Token or OAuth
- Rate limit: 200 requests/hour
- Official JavaScript SDK available: `npm install ynab`
- Could create read-only dashboard or full transaction management
- Consider caching budget data with smart refresh (similar to game/standings cache)

#### Privacy Considerations
- Financial data is highly sensitive
- Recommend personal use only (not multi-user shared dashboard)
- Store API tokens securely in environment variables
- Never log or display full account numbers
- Consider adding PIN/password protection to financial dashboard view

#### Implementation Tasks
- [ ] Generate Personal Access Token and test API connection
- [ ] Install official SDK (`npm install ynab`) and explore
- [ ] Design budget dashboard UI/UX mockup
- [ ] Implement caching strategy for budget data (delta requests)
- [ ] Create read-only financial overview widget prototype

### BreezoMeter API

**Purpose:** Advanced air quality, pollen, and weather data

**Features to explore:**
- Real-time air quality index with more detail than current Open-Meteo data
- Pollen forecast (trees, grass, weeds) - great for allergy sufferers
- Fire/smoke index
- Road conditions and weather impact
- UV index and sun exposure
- Weather forecasts with health recommendations

**Notes:**
- Requires API key (free tier available)
- More granular data than current air quality API
- Could replace or supplement current weather dashboard

**Tasks:**
- [ ] Investigate BreezoMeter API pricing and features
- [ ] Test BreezoMeter API with trial key
- [ ] Compare BreezoMeter vs current Open-Meteo air quality data

### Other Interesting Public APIs

#### Weather & Environment
- **NOAA API** - US weather alerts, forecasts, radar
- **OpenWeatherMap** - Weather data alternative
- **AerisWeather** - Premium weather API with radar/satellite
- **PurpleAir API** - Hyperlocal air quality from sensor network
- **NASA APIs** - APOD (Astronomy Picture of the Day), Earth imagery

#### Transportation & Traffic
- **Google Maps Traffic API** - Real-time traffic conditions
- **Waze API** - Community-driven traffic and incidents
- **OpenSky Network** - Live flight tracking data
- **Amtrak API** - Train schedules and status
- **NextBus/Transit APIs** - Public transit real-time arrival

#### Financial
- **Alpha Vantage** - Stock market data, crypto, forex
- **CoinGecko API** - Cryptocurrency prices and data
- **Federal Reserve Economic Data (FRED)** - Economic indicators
- **Yahoo Finance API** - Stock quotes and historical data

#### News & Content
- **News API** - Headlines from various sources
- **Reddit API** - Subreddit feeds and trending topics
- **RSS Feeds** - Custom feed aggregation (already used for team news)
- **Medium API** - Articles by topic/tag

#### Entertainment
- **Spotify Web API** - Now playing, playlists, recommendations
- **Last.fm API** - Music scrobbling and statistics
- **RAWG Video Games API** - Game releases and info
- **Open Library API** - Book information and covers
- **Twitch API** - Live streaming data for favorite streamers

#### Productivity & Calendar
- **Google Calendar API** - Calendar events and scheduling
- **Todoist API** - Task management
- **Trello API** - Board and card information
- **Notion API** - Workspace data and pages

#### Smart Home & IoT
- **Home Assistant API** - Smart home device integration
- **Philips Hue API** - Smart lighting control
- **Nest API** - Thermostat and camera data
- **IFTTT Webhooks** - Automation triggers

#### Sports (Additional)
- **NBA API** - Basketball scores and stats
- **The Odds API** - Sports betting odds (for tracking favorites)
- **Formula 1 API** - F1 race schedules and results
- **PGA Tour API** - Golf tournament data

#### Health & Fitness
- **Fitbit API** - Activity and health data
- **Strava API** - Running/cycling activities
- **MyFitnessPal API** - Nutrition tracking
- **Withings API** - Health metrics

#### Delivery & Tracking
- **AfterShip API** - Package tracking aggregator
- **UPS/FedEx/USPS APIs** - Direct carrier tracking
- **Amazon API** - Order history (if available)

#### Location & Events
- **Ticketmaster API** - Concert/event discovery
- **Eventbrite API** - Local events
- **Yelp Fusion API** - Restaurant hours, ratings
- **Foursquare API** - Venue recommendations

#### Utilities
- **OpenStreetMap API** - Mapping data
- **IP Geolocation APIs** - Location-based features
- **QR Code APIs** - Generate QR codes for sharing
- **URL Shortener APIs** - Shorten links in dashboard

#### Fun & Random
- **Cat API / Dog API** - Random pet pictures
- **Unsplash API** - High-quality random photos
- **Quote APIs** - Daily inspirational quotes
- **Joke APIs** - Random jokes for entertainment
- **SpaceX API** - Launch schedules and mission data
- **PokéAPI** - Pokémon data for fun displays

### Integration Priority

**High Value / Easy Integration:**
1. YNAB API (personal budget dashboard - official SDK available)
2. BreezoMeter (enhanced air quality/pollen data)
3. Google Calendar (event integration)
4. Package tracking (AfterShip or direct carriers)
5. NASA APOD (daily space photo)
6. News API (customizable news feed)

**Medium Value / Moderate Effort:**
1. Stocks/Crypto APIs (financial dashboard)
2. Spotify (now playing widget)
3. Traffic APIs (commute dashboard)
4. Smart Home APIs (if user has devices)

**Low Priority / High Effort:**
1. Social media aggregation (rate limits, auth complexity)
2. Complex IoT integrations
3. APIs requiring OAuth flows

**General API Research Tasks:**
- [ ] Research rate limits and costs for top priority APIs
- [ ] Create API comparison matrix (features, cost, limits, reliability)
- [ ] Prototype 1-2 high-value API integrations
- [ ] Document API integration patterns for future additions

---

## Infrastructure & DevOps

### Monitoring & Logging
- Application performance monitoring (APM)
- Error tracking service integration (Sentry, etc.)
- Server health monitoring
- API rate limit tracking
- Database performance monitoring

### Deployment & DevOps
- Docker containerization
- Kubernetes deployment configuration
- CI/CD pipeline (GitHub Actions, etc.)
- Automated testing in CI
- Automated deployments
- Blue-green deployment strategy
- Health check endpoints

### Security
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration review
- Security headers (CSP, HSTS, etc.)
- Regular dependency updates
- Security scanning (Snyk, Dependabot)
- API authentication/authorization

### Offline Support
- Service worker for offline functionality
- Cache API responses for offline viewing
- Queue API requests when offline
- Offline indicator in UI

---

## Data & Analytics

### Usage Analytics Enhancement
- Dashboard view tracking (already implemented)
- Most-used features analysis
- Performance metrics
- Error tracking
- User behavior insights (if multi-user)

### Data Export
- Export preferences/settings
- Backup and restore functionality
- Historical data export (weather, sports, etc.)
- Data portability between instances

---

## Documentation

### Developer Documentation
- Architecture decision records (ADRs)
- API documentation
- Component documentation
- Contributing guidelines
- Development environment setup guide

### User Documentation
- User guide with screenshots
- Video tutorials
- FAQ section
- Troubleshooting guide
- Feature showcase

---

## Future Considerations

### Internationalization
- i18n framework integration
- Language selection in settings
- Translations for all UI text
- Locale-specific date/time formats
- Currency and unit conversions

### Additional Dashboard Ideas
- Meal Planner - Weekly meal schedule
- Chore Tracker - Family task rotation
- Flight Tracker - Upcoming flights with status
- Local Events - Concerts, festivals, activities
- Game Release Calendar - Upcoming video game releases
- Tasks/TODO - Task management and productivity tracking
- Social Media - Aggregated social media feed
- RSS Reader - Custom RSS feed aggregation

---

## Summary Priority Ranking

### Immediate (High ROI, Low Effort)
1. Testing framework setup - ensures quality
2. Weather alerts (NOAA API) - adds significant value
3. Package tracking integration - high user value
4. News headlines dashboard - easy RSS implementation

### Short Term (High Value, Moderate Effort)
1. Photo storage optimization - reduces costs and improves performance
2. YNAB API integration - high value for budget tracking
3. Bundle size monitoring - maintains performance
4. Family Calendar integration - frequently requested
5. PM2 ecosystem migration completion

### Medium Term (Strategic Value)
1. BreezoMeter API for enhanced air/pollen data
2. Stock watchlist expansion
3. Crypto prices dashboard
4. Gas prices tracker
5. Birthday/anniversary tracker
6. Enhanced API key management
7. Usage analytics enhancements

### Long Term (Complex Features)
1. Multi-user support - requires significant architecture work
2. PWA support - mobile enhancement
3. Disney dashboard enhancements
4. Smart home integration
5. Comprehensive documentation
6. Internationalization support

---

**Last Updated:** 2025-11-12

**Note:** This is a living document. Add new ideas as they come up and prioritize based on user needs and development capacity.
