// this script is WIP, 
// was good for personal use, but i have no intent 
// to ever finish/maintain this
const puppeteer = require("puppeteer");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const util = require('util');
const fs = require('fs');

const SCROLL_SPEED_PX = 500;
const SCROLL_DELAY_MS = 2000;

(async () => {

    function delay(time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });
     }

    const url = process.argv[2] || 'https://reader.magzter.com/reader/z191bi81mw4ee3uukvtcu39172119480521/391721';
    if (!url) {
        throw new Error(
            "No url has been passed!"
        );
    }
    console.log(`Will create a PDF from ${url} .....`);
    const browser = await puppeteer.launch({
        headless: false, //'new',
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto('https://reader.magzter.com', {timeout: 0});
    await page.evaluate(() => document.cookie = 'new_391721=46ttxdk0f29gql40th5l2g391721194805211; WZRK_G=30dffeff88f04d5b8d9b360714740729; udid=d64921c3-c332-45d4-b9e6-5a87de021971; _gid=GA1.2.1503409757.1721740695; WZRK_S_8RK-ZK5-8Z5Z=%7B%22p%22%3A1%2C%22s%22%3A1721805763%2C%22t%22%3A1721805763%7D; _ga_V12EXY44Y5=GS1.1.1721805757.3.1.1721805763.0.0.0; _ga=GA1.2.225607367.1721740470; _gat=1; _ga_6CTF28HB5C=GS1.2.1721805675.3.1.1721805767.0.0.0');
    await page.goto(url, {timeout: 0});
    await delay(10000);
    await page.evaluate(() => {
        // open list view
        document.querySelector('*[title="Scroll View"]').click();
    });
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
        return Array.from(
            document.querySelectorAll('*[id^="scrollimagebox"] img' )
        ).map(e => e.src)
        .filter(src => !src.includes('thumb'));
    });
    const title = await page.evaluate(() => {
        return document.title.replace(` Digital Magazine from Magzter - World's Largest Digital Newsstand`, '')
    });
    await fs.promises.writeFile('urls.txt', imageUrls.join('\n'));
    process.env.TITLE = title;
    const exec = util.promisify(require('child_process').exec);
    await exec(`sh magzter.sh`);
})();
