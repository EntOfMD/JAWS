import puppeteer from 'puppeteer'
import { insertWTOPIncident } from '../models/wtopIncidents.js'
import { error as _error, info, debug } from '../util/logger.js'

const WTOP_TRAFFIC_URL = 'https://wtop.com/traffic'

const determineSeverity = (className) => {
  if (className.includes('severity-3')) return 'Major'
  if (className.includes('severity-2')) return 'Moderate'
  return 'Minor'
}

const parseDateTime = (dateStr) => {
  try {
    if (!dateStr) {
      debug('Empty date string provided');
      return new Date();
    }

    // Log the raw date string for debugging
    debug(`Parsing date string: "${dateStr}"`);

    // Handle different date formats
    const formats = [
      // Format: "04/01/2025 at 07:53pm"
      {
        regex: /(\d{2})\/(\d{2})\/(\d{4})\s+at\s+(\d{1,2}):(\d{2})(am|pm)/i,
        parse: (match) => {
          const [_, month, day, year, hours, minutes, meridiem] = match;
          let hour = parseInt(hours);
          
          if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
          if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;

          return new Date(year, month - 1, day, hour, parseInt(minutes));
        }
      },
    ];

    // Try each format
    for (const format of formats) {
      const match = dateStr.match(format.regex);
      if (match) {
        return format.parse(match);
      }
    }

    // If no format matches, log and return current time
    debug(`No matching date format for: "${dateStr}"`);
    return new Date();
  } catch (err) {
    _error('Date parsing failed', { 
      error: err.message, 
      dateStr 
    });
    return new Date();
  }
}

// Cache for browser instance
let browserInstance = null

// Initialize browser once and reuse
const initBrowser = async () => {
  if (!browserInstance) {
    debug('Initializing browser instance')
    browserInstance = await puppeteer.launch({ 
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    })
  }
  return browserInstance
}

export const processWTOPData = async () => {
  let page
  try {
    const browser = await initBrowser()
    page = await browser.newPage()
    
    // Optimize page load
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      // Only allow essential content
      const resourceType = request.resourceType()
      if (['document', 'xhr', 'fetch'].includes(resourceType)) {
        request.continue()
      } else {
        request.abort()
      }
    })

    // Set viewport to minimize memory usage
    await page.setViewport({ width: 1024, height: 768 })

    // Navigate with timeout
    await Promise.race([
      page.goto(WTOP_TRAFFIC_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Navigation timeout')), 10000)
      )
    ])

    // Wait for specific content instead of network idle
    await page.waitForSelector('#incidents_container', { timeout: 5000 })

    const incidents = await page.evaluate(() => {
      // Move selector strings to constants for better performance
      const SELECTORS = {
        items: '.newsstream-item',
        details: '.traffic-stream__incident-details',
        footer: '.traffic-stream__item-roads',
        title: 'b',
        subcat: '.subcat',
        direction: '.direction',
        blockage: '.blockage',
        type: '.type'
      }

      const items = document.querySelectorAll(SELECTORS.items)
      return Array.from(items, item => {
        const details = item.querySelector(SELECTORS.details)
        const footer = item.querySelector(SELECTORS.footer)
        
        return {
          incident_id: item.getAttribute('data-traffic-stream-id') || '',
          severity: item.className,
          title: details?.querySelector(SELECTORS.title)?.textContent || '',
          description: details?.textContent?.trim() || '',
          location: details?.querySelector(SELECTORS.subcat)?.textContent || 'Unknown',
          reported_time: footer?.textContent?.match(/Reported: ([^\n]+)/)?.[1] || '',
          last_update: footer?.textContent?.match(/Updated: ([^\n]+)/)?.[1] || '',
          source: 'WTOP',
          additional_data: {
            direction: details?.querySelector(SELECTORS.direction)?.textContent || '',
            blockage: details?.querySelector(SELECTORS.blockage)?.textContent || '',
            type: details?.querySelector(SELECTORS.type)?.textContent || ''
          }
        }
      })
    })

    // Process incidents in batches
    const BATCH_SIZE = 5
    let successCount = 0

    for (let i = 0; i < incidents.length; i += BATCH_SIZE) {
      const batch = incidents.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(async incident => {
        try {
          const processedIncident = {
            ...incident,
            severity: determineSeverity(incident.severity),
            reported_time: parseDateTime(incident.reported_time),
            last_update: parseDateTime(incident.last_update),
            create_time: new Date()
          }
          await insertWTOPIncident(processedIncident)
          successCount++
        } catch (err) {
          _error('Failed to insert WTOP incident', {
            error: err.message,
            incident_id: incident.incident_id
          })
        }
      }))
    }

    info(`Processed ${successCount}/${incidents.length} WTOP incidents successfully`)
  } catch (err) {
    _error('WTOP processing failed', { error: err.message })
  } finally {
    if (page) await page.close()
  }
}

// Cleanup function for graceful shutdown
export const cleanup = async () => {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
