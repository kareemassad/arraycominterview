# arraycominterview

## Task

Web Scraping and Data Processing using Puppeteer

Our privacy protection team at Array is tasked with automating personal information detection and removal activities on behalf of our customers. As a member of this team, your goal will be to create a system that efficiently and stealthily scrapes websites, detects personal information, and removes it without detection. Your solutions need to be scalable, and adaptable to changes in websites' structures. As a result, the next step in our interview process is to complete and submit the task below in approximately 1 hour.

Use puppeteer (chrome/chromium) tooling to scrape data from creepjs. Utilize creative web scraping techniques to ensure successful extraction. Demonstrate your expertise in web automation and stealth techniques (randomizing user-agent strings, emulating human-like behavior) in your overall Puppeteer submission.

Steps

1. Create a github repository for the code
2. With puppeteer/related libraries to:
   1. Go to https://abrahamjuliot.github.io/creepjs/
   2. Pull information for related fields:
      * trust score
      * lies
      * bot
      * fingerprint/FP ID
3. Save JSON of fields
4. Create pdf of page

Repeat step 2.0  three times to generate a total of 6 files*

Prioritize achieving the highest trust score

* Include in the readme any notes, challenges, etc that may pertain to the task
* Format: Provide an accessible link to a GitHub repository.
* Include the JavaScript/TypeScript script(s), PDFs, and JSON data in the GitHub repository that is accessible/shared.

Ensure your code is well-commented and easy to understand.

## Thinking Process

I started by doing simple scraping of the fields needed. I was able to scrape the fields using either the selector or the xpaths. I am aware that the site could change and my scraping would no longer work but for a short code assignment I thought it was sufficient.

After scrapping, I quickly realised the nature of the assignment. I had many errors (notably in the fields needed to be parsed) an my TrustScore was 0%.

I began work on making the scraper more human. In the end, I was able to achieve a TrustScore of 66.5%. I added the following features to achieve this :

* Added User Agent Randomization (Functionality is implemented but could only get 1 agent to work properly.)
* Pulled languages, mimeTypes, and plugins from my browser and added them to the scraper to make it more human.
* Added random delays between actions to make it more human.
* Randomized viewport size to make it more random.
* Cleared cookies and cache as well as local storage.
* Tried using StealthPlugin for puppeteer but was not able to get it to work without showing 1000+ lies.

I was able to get the TrustScore to 66.5% and the lies to 0. I was not able to get rid of the error involving the sessions. I attempted to clear them as stated above but I belive they might be examining the session to see if it is a bot.

## Conclusion

Finally, I was able to get the scraper to scrape the page and achieve a TrustScore of 66.5% (Same score as my normal browser, see `myBrowserStats.PNG`). I was not able to get the scraper to work with the StealthPlugin and I was not able to get the User Agent Randomization to work properly. I believe that the User Agent Randomization would have helped me achieve a higher TrustScore. 