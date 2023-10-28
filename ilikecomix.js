const fsPromises = require("fs").promises;
const path = require("path");

const puppeteer = require("puppeteer");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");
const wget = require("node-wget-promise");
const JSZip = require("jszip");

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
  console.log(`Downloading ${title}`);
  console.log(`Found ${imageUrls.length} pages to download`);
  const folderName = title.replaceAll(/[^a-zA-Z0-9]/g, "_");
  await fsPromises.mkdir(`./${folderName}`);
  console.log(`created folder ${folderName}`);
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    console.log("download", url);
    if (!url) {
      throw Error(
        "Image url should be defined, try increasing SCROLL_DELAY_MS/SCROLL_SPEED_PX"
      );
    }
    await wget(url, {
      output: `./${folderName}/${url.substring(url.lastIndexOf("/") + 1)}`,
    }).catch((err) => console.error(err));
  }
  await browser.close();
  const zip = new JSZip();
  console.log("Creating a ZIP");
  const folder = zip.folder(folderName);
  const dir = await fsPromises.opendir(folderName);
  for await (const dirent of dir) {
    const file = await fsPromises.readFile(`${folderName}/${dirent.name}`);
    folder.file(dirent.name, file);
    console.log(`adding ${dirent.name} to zip`);
  }
  await zip.generateAsync({ type: "uint8array" }).then(function (content) {
    // see FileSaver.js
    fsPromises.writeFile(`./${folderName}.cbz`, Buffer.from(content));
  });
  console.log('cleaning up')
  fsPromises.rm(`./${folderName}`, { recursive: true })
})();
