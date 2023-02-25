import {createCanvas, loadImage} from "canvas";
import path from "path";
const IMAGES_DIR = path.join(__dirname, "..", "static", "images");
const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;
const EXTENSION = ".png";

async function generateImageFromAttributes(background: String, attributes: Map<String, String>) : Promise<Buffer | undefined>
{
    try
    {
        const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        const context = canvas.getContext('2d');
        const backgroundImage = await loadImage(path.join(IMAGES_DIR, "background", background + EXTENSION));
        context.drawImage(backgroundImage, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        for (let [attribute, value] of attributes.entries())
        {
            const attributeImage = await loadImage(path.join(IMAGES_DIR, attribute + "/" + value + EXTENSION));
            context.drawImage(attributeImage, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        }
        return canvas.toBuffer("image/png");
    }
    catch(err)
    {
        console.log(err);
    }
    return undefined;
}

export default generateImageFromAttributes;