const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// puppeteer.use(StealthPlugin());

//extracted from my browser's console
const realBrowserData = {
    languages: [
        "en-US",
        "en"
    ],
    mimeTypes: [
        { "type": "application/pdf", "suffixes": "pdf", "description": "Portable Document Format" },
        { "type": "text/pdf", "suffixes": "pdf", "description": "Portable Document Format" }
    ],
    plugins: [
        { "name": "PDF Viewer", "description": "Portable Document Format", "filename": "internal-pdf-viewer", "length": 2, "mimeTypes": ["application/pdf", "text/pdf"] },
        { "name": "Chrome PDF Viewer", "description": "Portable Document Format", "filename": "internal-pdf-viewer", "length": 2, "mimeTypes": ["application/pdf", "text/pdf"] },
        { "name": "Chromium PDF Viewer", "description": "Portable Document Format", "filename": "internal-pdf-viewer", "length": 2, "mimeTypes": ["application/pdf", "text/pdf"] },
        { "name": "Microsoft Edge PDF Viewer", "description": "Portable Document Format", "filename": "internal-pdf-viewer", "length": 2, "mimeTypes": ["application/pdf", "text/pdf"] },
        { "name": "WebKit built-in PDF", "description": "Portable Document Format", "filename": "internal-pdf-viewer", "length": 2, "mimeTypes": ["application/pdf", "text/pdf"] }
    ]
};

// List of user agents for Chrome on Windows (no longer need more than the 1)
const userAgents = [
    //check what version of chrome the TESTER is using (not your own)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ["--start-maximized"] });
    const page = await browser.newPage();


    // Randomize window size incase they are checking sizes
    await page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
    });
    // Function to randomize user-agent
    const setUserAgent = async (page) => {
        // Randomly pick a user agent from the list
        // const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const userAgent = userAgents[0];
        await page.setUserAgent(userAgent);
    };

    // Set languagesm plugins, and mimes
    await page.evaluateOnNewDocument((data) => {
        const createMockMimeType = (mimeType) => {
            // Create a new object that mimics the structure of a real MimeType
            let mock = {
                type: mimeType.type,
                suffixes: mimeType.suffixes,
                description: mimeType.description,
                enabledPlugin: null,
            };
            return mock;
        };

        // Function to create a mock Plugin object
        const createMockPlugin = (plugin) => {
            // Create a new object that mimics the structure of a real Plugin
            let mock = {
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename,
                length: plugin.length,
                MimeTypes: mimeTypes.filter(mt => plugin.mimeTypes.includes(mt.type)),
            };

            // Mimic the PluginArray structure with item/namedItem methods
            mock.item = (index) => mock.MimeTypes[index];
            mock.namedItem = (name) => mock.MimeTypes.find(p => p.type === name);
            // Mock refresh method
            mock.refresh = () => { };

            // Set the enabledPlugin on each mock MimeType
            mock.MimeTypes.forEach(mt => mt.enabledPlugin = mock);
            return mock;
        };

        let allMockMimeTypes = data.mimeTypes.map(createMockMimeType);
        let allMockPlugins = data.plugins.map(plugin => createMockPlugin(plugin, allMockMimeTypes));


        Object.defineProperty(navigator, 'mimeTypes', {
            get: () => allMockMimeTypes,
        });
        Object.defineProperty(navigator, 'plugins', {
            get: () => allMockPlugins,
        });

        Object.defineProperty(navigator, 'languages', {
            get: () => data.languages,
        });
    }, realBrowserData);

    // Set timezone
    await page.evaluateOnNewDocument(() => {
        const originalDateTimeFormat = Intl.DateTimeFormat;
        Intl.DateTimeFormat = function (...args) {
            const format = new originalDateTimeFormat(...args);
            format.resolvedOptions = function () {
                const options = originalDateTimeFormat.prototype.resolvedOptions.apply(this);
                //this must match
                options.timeZone = 'America/New_York';
                return options;
            };
            return format;
        };
    });
    // Set the randomized user-agent before starting the scraping loop
    await setUserAgent(page);
    // Navigate to the page and wait until it's fully loaded
    await page.goto('https://abrahamjuliot.github.io/creepjs/', {
        waitUntil: 'networkidle0' // This waits until the network is idle, SPA
    });

    await page.waitForTimeout(3000);

    // Function to emulate human-like behavior with delays
    const delay = (duration) =>
        new Promise((resolve) => setTimeout(resolve, duration));

    // Function to execute the scraping process
    const scrapeData = async () => {
        // Use the XPath to get the element for lies outside of the page.evaluate
        const liesElements = await page.$x("/html/body/div/fingerprint/div/div[2]/div/div[2]/div[2]");
        let lies = '';
        if (liesElements.length > 0) {
            lies = await page.evaluate(el => el.textContent, liesElements[0]);
        }
        // remove whitespace
        lies = lies.trim();

        const data = await page.evaluate(() => {
            const trustScoreElement = document.querySelector("#fingerprint-data > div.visitor-info > div > div:nth-child(2) > div:nth-child(2) > span");
            const trustScore = trustScoreElement ? trustScoreElement.textContent.trim() : null;

            const botElement = document.querySelector("#fingerprint-data > div.visitor-info > div > div:nth-child(3) > div:nth-child(5) > div.block-text > div:nth-child(1)");
            const bot = botElement ? botElement.textContent.trim() : null;

            const fingerprintSpans = document.querySelectorAll("#fingerprint-data > div.fingerprint-header-container > div > div.ellipsis-all > span");
            let fingerprint = '';
            fingerprintSpans.forEach(span => {
                const number = span.textContent.match(/\d+/);
                if (number) {
                    fingerprint += number[0];
                }
            });

            // Return the combined data minus lies
            return { trustScore, fingerprint, bot };
        });

        // Add the 'lies' text to the data object after extracting it with XPath
        data.lies = lies;

        return data;
    };

    const jsonDir = './json';
    const pdfDir = './pdfs';

    if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
    }

    if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Loop to perform the scrape multiple times
    for (let i = 0; i < 6; i++) {
        // this selects right col-6
        const selector = "#fingerprint-data > div.visitor-info > div > div:nth-child(2)";
        await page.waitForSelector(selector, { timeout: 5000 });

        // Wait an additional 3 seconds after the element has been found
        await page.waitForTimeout(3000);

        // scrape
        const data = await scrapeData();

        if (data.trustScore && data.bot && data.fingerprint) {
            fs.writeFileSync(`${jsonDir}/data-${i + 1}.json`, JSON.stringify(data, null, 2));
            await page.pdf({ path: `${pdfDir}/page-${i + 1}.pdf`, format: 'A4' });
        } else {
            console.error('Could not extract all data from the page.');
        }
        // Another human-ish random delay
        await delay(Math.random() * 1000 + 2000);
    }

    // Close the browser
    await browser.close();
})();

// Error handling for unexpected crashes
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});
