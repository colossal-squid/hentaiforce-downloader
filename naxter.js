const puppeteer = require("puppeteer");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const { download, createCbz } = require("./util");

const SCROLL_SPEED_PX = 2000;
const SCROLL_DELAY_MS = 2000;

(async () => {
    const url = process.argv[2];
    if (!url) {
        throw new Error(
            "No url has been passed. Please pass URL like this: node index.js https://naxter.net/gallery/0802441e-5b6a-4006-bc47-ceaf769111ca"
        );
    }
    console.log(`Will create a CBZ from ${url} .....`);
    const browser = await puppeteer.launch({
        // headless: 'new',
        devtools: true,
        defaultViewport: null
    });
    const page = await browser.newPage();

    await page.goto(url, { timeout: 0 });

    console.log("clicking SHOW ALL")

    // scroll down
    await scrollPageToBottom(page, {
        size: SCROLL_SPEED_PX,
        delay: 1000,
    });

    await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
        .filter(b => b.innerText === 'Show all')[0].click();
    });

    await scrollPageToBottom(page, {
        size: SCROLL_SPEED_PX,
        delay: SCROLL_DELAY_MS,
    });
    console.log("Grabbing URLs");
    // query thumbnails
    const imageUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a picture img')).map(
            (element) => {
                return element.src.replace("size=preview&", "");
            }
        );
    });
    const title = await page.evaluate(() => {
        return document.title.replace("| Naxter", "").trim()
    });
    const folderName = await download(title, imageUrls, true, ".jpg")
    console.log('finished downloading')
    await createCbz(folderName)
    console.log('sleep 2 sec')
    setTimeout(() => {
        console.log('exit')
        process.exit(0);
    }, 2000)
})();
