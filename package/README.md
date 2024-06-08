# tgs-to

## Introduction

The `tgs-to` module allows you to convert Telegram Animated Sticker (TGS) files to various formats such as GIF, WebP, MP4, Png and Json

## Installation

You can install `tgs-to` via npm:

```bash
npm install tgs-to
```

## Usage

### Import the module and path module:

```javascript
const TGS = require('tgs-to');
const path = require('path');
```

### Create a new instance of TGS with the path to your TGS file:

```javascript
const tgs = new TGS(path.join(__dirname, 'sticker.tgs'));
```

### Convert the TGS file to GIF, WebP, and MP4:

```javascript
Promise.all([
    tgs.convertToGif(path.join(__dirname, "sticker.gif")),
    tgs.convertToWebp(path.join(__dirname, 'sticker.webp')),
    tgs.convertToMp4(path.join(__dirname, 'sticker.mp4'))
])
.then(() => {
    console.log('conversions completed successfully'); 
})
.catch(error => {
    console.error('One or more conversions failed:', error); 
});
```

### Additional debugging steps:-

```javascript

const TGS = require('tgs-to');
const path = require('path');
const fs = require('fs');

const tgsFilePath = path.join(__dirname, 'sticker.tgs');
const gifFilePath = path.join(__dirname, 'sticker.gif');
const webpFilePath = path.join(__dirname, 'sticker.webp');
const mp4FilePath = path.join(__dirname, 'sticker.mp4');

const tgs = new TGS(tgsFilePath);

const fileExists = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                reject(`File does not exist: ${filePath}`);
            } else {
                resolve(`File exists: ${filePath}`);
            }
        });
    });
};

const logDirectoryContents = (dirPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                reject(`Unable to read directory: ${err.message}`);
            } else {
                resolve(`Directory contents: ${files.join(', ')}`);
            }
        });
    });
};

Promise.all([
    tgs.convertToGif(gifFilePath)
        .then(() => fileExists(gifFilePath))  
        .then(() => {
            console.log('GIF file created successfully.');
            return tgs.convertToWebp(webpFilePath);
        })  // Proceed with WebP conversion
        .then(() => fileExists(webpFilePath))
        .then(() => {
            console.log('WebP file created successfully.');
        }),
    tgs.convertToMp4(mp4FilePath)
        .then(() => fileExists(mp4FilePath))
        .then(() => {
            console.log('MP4 file created successfully.');
        })
])
.then(() => {
    console.log('All conversions completed successfully'); 
    return logDirectoryContents(__dirname);
})
.then((contents) => {
    console.log(contents);
})
.catch(error => {
    console.error('One or more conversions failed', error); 
});

```

Make sure to replace 'sticker.tgs' with the path to your TGS file and adjust the output file names ('sticker.gif', 'sticker.webp', 'sticker.mp4') as needed.