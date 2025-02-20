const fsPromises = require("fs").promises;
const wget = require("node-wget-promise");
const JSZip = require("jszip");
const promiseRetry = require('promise-retry');

/**
 * Downloads pictures into a folder
 * @param {*} title - temp folder name
 * @param {*} imageUrls - array of URL strings to download
 * @returns - folder name escaped
 */
async function download(title, imageUrls) {
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
                "Image url should be defined!"
            );
        }
        await promiseRetry(function (retry, number) {
            console.log('attempt number', number);
            return wget(url, {
                output: `./${folderName}/${url.substring(url.lastIndexOf("/") + 1)}`,
            }).catch(retry);
        })
    }
    return folderName;
}

/**
 * Compress images from folderName into a folderName.zip
 * @param {*} folderName - name of the folder to ZIP
 */
async function createCbz(folderName) {
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
        fsPromises.writeFile(`./${folderName.replace(/_+/g, ' ').trim().replace(/\s/g, '_')}.cbz`, Buffer.from(content));
    });
    console.log('cleaning up')
    await fsPromises.rm(`./${folderName}`, { recursive: true })
}

module.exports = {
    createCbz, download
}