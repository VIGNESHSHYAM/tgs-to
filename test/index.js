const TGS = require('tgs-to');
const path = require('path');

const tgs = new TGS(path.join(__dirname,'sticker.tgs'));
Promise.all([
    tgs.convertToGif(path.join(__dirname,"sticker.gif")),
    tgs.convertToWebp(path.join(__dirname,'sticker.webp')),
    tgs.convertToMp4(path.join(__dirname,'sticker.mp4'))
])
.then(() => {
    console.log('All conversions completed successfully');
})
.catch(error => {
    console.error('One or more conversions failed:', error);
});
