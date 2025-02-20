const puppeteer = require("puppeteer");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const { download, createCbz } = require("./util");

const SCROLL_SPEED_PX = 500;
const SCROLL_DELAY_MS = 2000;

(async () => {
    const url = process.argv[2];
    if (!url) {
        throw new Error(
            "No url has been passed. Please pass URL like this: node index.js https://hentaiforce.net/view/142030"
        );
    }
    console.log(`Will create a CBZ from ${url} .....`);
    const browser = await puppeteer.launch({
        headless: 'new',
        defaultViewport: null
    });
    const page = await browser.newPage();

    await page.goto(url, {timeout: 0});
    console.log(
        "Page is open. Slowly scrolling down (this takes most of the time)"
    );
    // scroll down
    await scrollPageToBottom(page, {
        size: SCROLL_SPEED_PX,
        delay: SCROLL_DELAY_MS,
    });

    console.log("Grabbing URLs");
    // query thumbnails
    const imageUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".single-thumb img")).map(
            (element) => {
                return element.src.replace("t.jpg", ".jpg");
            }
        );
    });
    const title = await page.evaluate(() => {
        return document.querySelector(".text-left.font-weight-bold").textContent;
    });
    const folderName = await download(title, imageUrls)
    await createCbz(folderName)
    console.log('sleep 2 sec')
    setTimeout(() => {
        console.log('exit')
        process.exit(0);
    }, 2000)
})();
