const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const pako = require('pako');
const webp = require('webp-converter');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

class TGS {
    constructor(tgsFilePath) {
        this.tgsFilePath = tgsFilePath;
        this.jsonFilePath = path.resolve(__dirname, 'sticker.json');
        this.framesDir = path.resolve(__dirname, 'frames');
        process.on('exit', () => {
            this.cleanup();
        });
    }

    async cleanup() {
        try {
            if (fs.existsSync(this.jsonFilePath)) {
                fs.unlinkSync(this.jsonFilePath);
                console.log(`Deleted ${this.jsonFilePath}`);
            }
            if (fs.existsSync(this.framesDir)) {
                fs.rmdirSync(this.framesDir, { recursive: true });
                console.log(`Deleted ${this.framesDir}`);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    async convertToGif(gifFilePath) {
        try {
            const conversionSuccess = await this.convertTgsToJson();
            if (!conversionSuccess) {
                throw new Error('Conversion from TGS to JSON failed.');
            }

            const renderingSuccess = await this.renderJsonToImages();
            if (!renderingSuccess) {
                throw new Error('Rendering JSON to images failed.');
            }

            await this.imagesToGif(gifFilePath);
            return gifFilePath;
        } catch (error) {
            throw error;
        }
    }

    async convertToWebp(webpFilePath) {
        try {
            const gifFilePath = path.resolve(__dirname, 'sticker.gif');
            await this.convertToGif(gifFilePath);
            await this.convertGifToWebP(gifFilePath, webpFilePath);
            return webpFilePath;
        } catch (error) {
            throw error;
        }
    }

    async convertToMp4(mp4FilePath) {
        try {
            const gifFilePath = path.resolve(__dirname, 'sticker.gif');
            await this.convertToGif(gifFilePath);
            await this.convertGifToMp4(gifFilePath, mp4FilePath);
            return mp4FilePath;
        } catch (error) {
            throw error;
        }
    }

    async convertTgsToJson() {
        try {
            const data = fs.readFileSync(this.tgsFilePath);
            const decompressedData = pako.inflate(data, { to: 'string' });
            const animationData = JSON.parse(decompressedData);

            if (typeof animationData !== 'object' || animationData === null) {
                throw new Error('Invalid JSON format: Animation data is not an object.');
            }

            fs.writeFileSync(this.jsonFilePath, JSON.stringify(animationData, null, 2));
            console.log('TGS converted to JSON successfully.');
            return true;
        } catch (error) {
            throw error;
        }
    }

    async renderJsonToImages() {
        try {
            const animationData = JSON.parse(fs.readFileSync(this.jsonFilePath));
            const width = 512;
            const height = 512;

            if (!fs.existsSync(this.framesDir)) {
                fs.mkdirSync(this.framesDir);
            }

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({ width, height });

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Lottie Animation</title>
                </head>
                <body>
                    <div id="animationContainer" style="width: ${width}px; height: ${height}px;"></div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.7.8/lottie_light.min.js"></script>
                    <script>
                        window.animationData = ${JSON.stringify(animationData)};
                        window.animation = null;
                        document.addEventListener('DOMContentLoaded', () => {
                            window.animation = lottie.loadAnimation({
                                container: document.getElementById('animationContainer'),
                                renderer: 'svg',
                                loop: false,
                                autoplay: false,
                                animationData: window.animationData,
                            });
                        });
                    </script>
                </body>
                </html>
            `;

            await page.setContent(htmlContent, { waitUntil: 'load' });

            const totalFrames = animationData.op - animationData.ip;
            const frameDuration = 1000 / animationData.fr;

            async function delay(time) {
                return new Promise(resolve => setTimeout(resolve, time));
            }

            await page.waitForFunction('window.animation !== null', { timeout: 5000 });

            for (let i = 0; i < totalFrames; i++) {
                await page.evaluate((i) => {
                    const animation = window.animation;
                    if (animation) {
                        animation.goToAndStop(i, true);
                    }
                }, i);

                const framePath = path.join(this.framesDir, `frame_${i}.png`);
                await page.screenshot({ path: framePath });
                await delay(frameDuration);
            }

            console.log('JSON rendered to images successfully.');
            await browser.close();
            return true;
        } catch (error) {
            throw error;
        }
    }

    async imagesToGif(gifFilePath) {
        try {
            const frameFiles = fs.readdirSync(this.framesDir)
                .filter(file => file.endsWith('.png'))
                .sort((a, b) => {
                    const frameNumberA = parseInt(a.match(/\d+/)[0]);
                    const frameNumberB = parseInt(b.match(/\d+/)[0]);
                    return frameNumberA - frameNumberB;
                });

            await new Promise((resolve, reject) => {
                const ffmpegProcess = ffmpeg();
                ffmpegProcess
                    .input(path.join(this.framesDir, 'frame_%d.png'))
                    .inputOptions('-framerate 30')
                    .outputOptions('-vf scale=512:-1')
                    .output(gifFilePath)
                    .on('error', reject)
                    .on('end', resolve)
                    .run();
            });

            console.log('Frames compiled to GIF successfully.');
            return true;
        } catch (error) {
            throw error;
        }
    }

    async convertGifToWebP(inputPath, outputPath) {
        try {
            await webp.gwebp(inputPath, outputPath, "-q 80");
            console.log('GIF converted to WebP successfully!');
            return true;
        } catch (error) {
            throw error;
        }
    }

    async convertGifToMp4(inputGif, outputMp4) {
        try {
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(inputGif)
                    .output(outputMp4)
                    .on('start', commandLine => {
                        console.log('Spawned FFmpeg with command:', commandLine);
                    })
                    .on('error', err => {
                        reject(new Error('An error occurred: ' + err.message));
                    })
                    .on('end', () => {
                        console.log('Conversion completed successfully!');
                        resolve();
                    })
                    .run();
            });
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TGS;
