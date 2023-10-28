const puppeteer = require("puppeteer");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const { download, createCbz } = require("./util");

const SCROLL_SPEED_PX = 500;
const SCROLL_DELAY_MS = 100;

(async () => {
  const url = process.argv[2];

  if (!url) {
    throw new Error(
      "No url has been passed. Please pass URL like this: node index.js https://ilikecomix.com/adult-series/luca-tarlazzi-selen-1-vixen/"
    );
  }
  console.log(`Will create a CBZ from ${url} .....`);
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();

  await page.goto(url);
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
    return Array.from(document.querySelectorAll(".dgwt-jg-item.entry-visible img")).map(
      (element) => element.src.replace(/\-[0-9]{3}x[0-9]{3}\.jpg/, '.jpg')
    );
  });
  const title = await page.evaluate(() => {
    return document.querySelector(".post-title").textContent;
  });
  const folderName = await download(title, imageUrls)
  await createCbz(folderName)
  await browser.close();

})();
