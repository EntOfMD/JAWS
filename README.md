# JAWS - Just Another Web Scraper

A Node.js application that scrapes traffic incident data from Maryland traffic services and stores it in a PostgreSQL database.

## Data Sources

### ChartMD Traffic System

- **URL**: `https://chartexp1.sha.maryland.gov/CHARTExportClientService/getEventMapDataJSON.do`
- **Type**: JSON API
- **Update Frequency**: Every 5 minutes
- **Data Format**: JSON with incident details
- **Geographic Focus**: Montgomery County, MD

### WTOP Traffic Feed

- **URL**: `https://wtop.com/traffic/feed/`
- **Type**: RSS Feed
- **Update Frequency**: Every 5 minutes
- **Data Format**: RSS/XML

## Database Schema

### ChartMD Incidents Table

```sql
CREATE TABLE chartmd_incidents (
  incident_id VARCHAR(255) PRIMARY KEY,
  incident_type VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  county VARCHAR(100),
  severity INTEGER,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  lanes TEXT,
  create_time TIMESTAMP,
  start_time TIMESTAMP,
  last_update TIMESTAMP,
  direction VARCHAR(50),
  vehicles_involved TEXT,
  lanes_status TEXT,
  participants TEXT,
  traffic_alert BOOLEAN,
  additional_data JSONB,
  source VARCHAR(100),
  op_center VARCHAR(100)
);
```

### WTOP Incidents Table

```sql
CREATE TABLE wtop_incidents (
  incident_id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  severity VARCHAR(100),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  reported_time TIMESTAMP,
  last_update TIMESTAMP,
  source VARCHAR(100),
  additional_data JSONB
);
```

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

- Real-time traffic incident monitoring
- Automatic data collection every 5 minutes
- PostgreSQL persistence with JSONB support
- Structured logging with Winston
- Graceful shutdown handling
- Error tracking and reporting
- Geographic filtering (Montgomery County focus)
- Severity classification
- Location extraction and normalization

## Error Handling

- Database connection failures
- API timeout and connection issues
- Invalid response formats
- Data parsing errors
- Network connectivity issues

## Logging

Logs are stored in:

- `logs/error.log`: Error-level messages
- `logs/combined.log`: All log levels

## Dependencies

- Node.js >= 16.0.0
- PostgreSQL >= 12
- axios: API requests
- pg: PostgreSQL client
- winston: Logging
- rss-parser: WTOP feed parsing
- dotenv: Environment configuration

## Development

Format code using Prettier:

```bash
.\format.ps1
```

## License

MIT
