import {CanvasRenderingContext2D, createCanvas, loadImage} from "canvas";
import path from "path";
const IMAGES_DIR = path.join(__dirname, "..", "images");
const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;
const EXTENSION = ".png";

export default async function generateImageFromAttributes(background: string, velocity: string, close_to_earth : string, size: string)
{
    try
    {
        const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        const context = canvas.getContext('2d');
        await addImage(context, getImageDir("background", background));
        await addImage(context, getImageDir("velocity", velocity));
        await addImage(context, getImageDir("close_to_earth", close_to_earth));
        await addImage(context, getImageDir("size", size));
        return canvas.toBuffer("image/png");
    }
    catch(err)
    {
        console.log(err);
    }
    return undefined;
}

function getImageDir(attribute: string, value: string)
{
    return path.join(IMAGES_DIR, attribute, value + EXTENSION);
}

async function addImage(context: CanvasRenderingContext2D, path: string)
{
    const image = await loadImage(path);
    context.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
}