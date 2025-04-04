# JAWS - Just Another Web Scraper

A Node.js application that scrapes traffic incident data from Maryland traffic services and stores it in a PostgreSQL database.

## Data Sources

### ChartMD Traffic System

- **URL**: `https://chartexp1.sha.maryland.gov/CHARTExportClientService/getEventMapDataJSON.do`
- **Type**: JSON
- **Data Elements**:
  - Incident type and severity
  - Location details (lat/lon)
  - Lane status and direction
  - Timestamps (create, start, update)
  - Vehicle involvement
  - Traffic alerts

### WTOP Traffic Feed

- **URL**: `https://wtop.com/traffic`
- **Type**: Web Scraping
- **Data Elements**: 
  - Incident details and severity
  - Location information
  - Timestamps (reported, updated)
  - Traffic directions
  - Road blockage status


## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
LOG_LEVEL=info
POLLING_INTERVAL=300000

DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database
```

3. Initialize PostgreSQL database:

```sql
CREATE DATABASE your_database;
```

4. Run the application:

```bash
# Development mode with debug logging
npm run dev

# Production mode
npm start
```

## Features

- Automatic data collection
- PostgreSQL persistence with JSONB support
- Structured logging
- Error tracking and reporting

## Performance Features

### ChartMD Service
- Structured JSON parsing
- Efficient data mapping
- Error resilient processing

### WTOP Service
- Browser instance caching
- Resource filtering (blocks images, CSS, fonts)
- Memory-optimized viewport
- Request interception
- Navigation timeout handling

## Error Handling

- Database connection failures
- API timeout and connection issues
- Invalid response formats
- Browser automation errors
- HTML parsing failures
- Date format variations
- Resource cleanup on exit

## Logging

### Log Levels
- **DEBUG**: Detailed processing information
- **INFO**: Service status and completion
- **ERROR**: Processing and connection failures

### Log Files
- `logs/error.log`: Error-level messages
- `logs/combined.log`: All log levels
- Format: `timestamp [LEVEL]: message {metadata}`

## Dependencies

- Node.js >= 16.0.0
- PostgreSQL >= 12
- axios: ChartMD API requests
- puppeteer: WTOP web scraping
- pg: PostgreSQL client
- winston: Structured logging
- dotenv: Environment configuration

## Development

Format code using Prettier:

```bash
.\format.ps1
```

## Data Samples
 - [chartMD.json - ChartMD Incidents JSON return structure](./sample/chartMD.json)
 - [wtop.txt - WTOP HTML structure](./sample/wtop.txt)
 - [ChartMD DB dump - `SELECT DISTINCT * FROM chartmd_incidents WHERE lanes_status != 'All lanes open' ORDER BY entry_id ASC`](./sample/data-1743559424048.csv)
 - [WTOP DB dump - `SELECT * FROM wtop_incidents ORDER BY incident_id ASC `](./sample/wtop_incidents.csv)
 - [Logger dump](./sample/log.log)

## License

MIT
