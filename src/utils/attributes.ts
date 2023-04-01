import {CanvasRenderingContext2D, createCanvas, loadImage} from "canvas";
import path from "path";
import { NEO } from "../model/NeoDB";

//Image Constants
const IMAGES_DIR = path.join(__dirname, "..", "images");
const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;
const EXTENSION = ".png";
//Attribute constants
const SIZE_VALUES: AttributeValues = {minOutlier: "small", average: "average", maxOutlier: "big"}
const RANGE_VALUES: AttributeValues = {minOutlier: "close", average: "average", maxOutlier: "far"}
const VELOCITY_VALUES: AttributeValues = {minOutlier: "slow", average: "average", maxOutlier: "fast"}
const SIZE_25_PERCENTILE = 141.07612;
const SIZE_75_PERCENTILE = 918.6351999999999;
const RANGE_25_PERCENTILE = 5389472;
const RANGE_75_PERCENTILE = 14649843;
const VELOCITY_25_PERCENTILE = 15986;
const VELOCITY_75_PERCENTILE = 32580;

export async function generateImageFromAttributes(attributes: Attributes)
{
    try
    {
        const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        const context = canvas.getContext('2d');
        await addImage(context, getImageDir("background", "background"));
        //Velocity needs to go before size
        await addImage(context, getImageDir("velocity", attributes.velocity));
        await addImage(context, getImageDir("size", attributes.size));
        await addImage(context, getImageDir("range", attributes.range));
        return canvas.toBuffer("image/png");
    }
    catch(err)
    {
        console.log(err);
    }
    return undefined;
}

export function getAttributes(neo: NEO): Attributes
{
    const sizeAttribute = getAttribute(neo["size (feet)"]!, SIZE_25_PERCENTILE, SIZE_75_PERCENTILE, SIZE_VALUES) as Size;
    const rangeAttribute = getAttribute(neo["range(miles)"], RANGE_25_PERCENTILE, RANGE_75_PERCENTILE, RANGE_VALUES) as Range;
    const velocityAttribute = getAttribute(neo["velocity(MPH)"], VELOCITY_25_PERCENTILE, VELOCITY_75_PERCENTILE, VELOCITY_VALUES) as Velocity;
    return {size: sizeAttribute, range: rangeAttribute, velocity: velocityAttribute}
}

function getAttribute(value: number, percentileValueMin: number, percentileValueMax: number, attributeValues: AttributeValues)
{
    if (value < percentileValueMin)
    {
        return attributeValues.minOutlier;
    }
    else if (value > percentileValueMax)
    {
        return attributeValues.maxOutlier;
    }
    else
    {
        return attributeValues.average;
    }
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

type AttributeValues = {minOutlier: Size | Range | Velocity, average: Size | Range | Velocity, maxOutlier: Size | Range | Velocity}
type Size = "small" | "average" | "big";
type Range = "close" | "average" | "far";
type Velocity = "slow" | "average" | "fast";
export type Attributes = {size: Size, range: string, velocity: string};
