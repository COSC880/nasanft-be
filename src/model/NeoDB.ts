import { getConnection } from "./UtilsDb";
import { Database as NFTSchema } from "../schemas/Neos";
import axios from "axios";
import { convertToError, getNftMetadata, mintTokens, safeTransfer } from "./NftBlockchain";
import { getCurrentWinners, Winner } from "./QuizzesDb";

const connection = getConnection<NFTSchema>("nft");
const NEO_DATA_TABLE = "neo_data";

let CURRENT_NEO: OptionalNEO;
let CURRENT_NEO_TIMEOUT: NodeJS.Timeout | undefined | null;
let CURRENT_IMAGE_OF_THE_DAY: any;
generateNewNeo();

export async function generateNewNeo()
{
    try
    {
        if (CURRENT_NEO)
        {
            await endCurrentNeo();
        }
        const today = new Date();
        const twoDays = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 2);
        const nasaRes = await getNeoFromNasa(twoDays);
        const dateString = formatDate(twoDays);
        const neo = await getRandomNeo(nasaRes.data.near_earth_objects[dateString]);
        const id = neo.id;
        const name = neo.name;
        //First should be soonest
        const close_approach_data = neo.close_approach_data[0]; 
        const dateUTC = close_approach_data.epoch_date_close_approach;
        const size = neo.estimated_diameter.feet.estimated_diameter_max;
        const range = close_approach_data.miss_distance.miles;
        const velocity = close_approach_data.relative_velocity.miles_per_hour;
        const insertNeo: InsertNEO = {id: id, name: name, dateUTC: dateUTC,
            "size_feet": size, "range_miles": range, "velocity_mph": velocity};
        CURRENT_NEO = (await connection.from(NEO_DATA_TABLE).insert(insertNeo).select().single()).data;
        CURRENT_NEO_TIMEOUT = setTimeout(generateNewNeo, dateUTC - Date.now());
        return {status: 200, data: {text: "Success"}};
    }
    catch(err) {
        console.error(err);
        CURRENT_NEO = null;
        CURRENT_NEO_TIMEOUT = null;
        return {status: 500, error: convertToError(err)};
    }
}

async function endCurrentNeo() {
    try 
    {
        const { data: winners, error } = await getCurrentWinners();
        if (error) 
        {
            throw new Error(error.message);
        }
        if (winners && winners.length > 0) 
        {
            const neo = getCurrentNeo();
            if (neo)
            {
                const error = await awardWinners(neo, winners);
                if (error)
                {
                    throw error;
                }
            }
            else
            {
                throw new Error("Current Neo not set");
            }
        }
    }
    catch (err) 
    {
        console.log("Failed to award nfts:" + convertToError(err).message);
    }
}

export async function awardWinners(neo: NEO, winners: Winner[]) : Promise<Error | undefined>
{
    const metadata = await getNftMetadata(neo);
    if (metadata && metadata.IpfsHash)
    {
        const tokenId = parseInt(neo.id);
        const {error} = await mintTokens(tokenId, winners.length, metadata.IpfsHash);
        if (error)
        {
            return error;
        }
        for (let x = 0; x < winners.length; x++) 
        {
            const { error } = await safeTransfer(winners[x].public_address, tokenId, 1);
            if (error)
            {
                return error;
            }
        }
    }
    else
    {
        return new Error("Could not upload metadata to ipfs");
    }
}

export function getCurrentNeo()
{
    return CURRENT_NEO;
}

export function getTop10Neos(attribute: "size" | "range" | "velocity", ascending: boolean)
{
    const columnName: (string & keyof NEO) = attribute === "size" ? "size_feet"  : attribute === "range" ? "range_miles" : "velocity_mph";
    return connection.from(NEO_DATA_TABLE).select("*").order(columnName!, {ascending: ascending}).limit(10);
}

export function getImageOfTheDay()
{
    return CURRENT_IMAGE_OF_THE_DAY ? { status: 200, data: CURRENT_IMAGE_OF_THE_DAY }
      : { status: 500, error: new Error("Image of the day is not set") };
}

export async function setImageOfTheDay() 
{
    const oldImageOfTheDayUrl = CURRENT_IMAGE_OF_THE_DAY?.url;
    CURRENT_IMAGE_OF_THE_DAY = undefined;
    let endDate = new Date();
    try
    {
        while(!CURRENT_IMAGE_OF_THE_DAY)
        {
            let startDate = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() - 14);
            const res = await axios.get("https://api.nasa.gov/planetary/apod", {params: { 
                start_date: formatDate(startDate), 
                end_date: formatDate(endDate),
                api_key: process.env.NASA_API_KEY
            }});
            if (res && res.data)
            {
                for (let x=res.data.length-1;x>=0;x--)
                {
                    if (res.data[x].media_type === "image" && !res.data[x].copyright 
                          && res.data[x].url && res.data[x].url !== oldImageOfTheDayUrl)
                    {
                        CURRENT_IMAGE_OF_THE_DAY = res.data[x];
                        break;
                    }
                }
            }
            else
            {
                console.log("Could not set the image of the day");
                break;
            }
            endDate = startDate;
        }
    }
    catch (error)
    {
        console.log("Could not set the image of the day: " + error);
    }
}

export function stopSetRandomNeoJob()
{
    if (CURRENT_NEO_TIMEOUT)
    {
        clearTimeout(CURRENT_NEO_TIMEOUT);
    }
}

async function getRandomNeo(neos: any[])
{
    //Try to get one not in database
    const neosMap = new Map(neos.map(neo => [neo.id, neo]));
    (await connection.from(NEO_DATA_TABLE).select("id")).data?.forEach(res => {
        neosMap.delete(res.id);
    });
    //Get first entry in map
    if (neosMap.size > 0)
    {
        return neosMap.values().next().value;
    }
    throw new Error("Could not get a NEO that hasn't yet been used");
}

async function getNeoFromNasa(date: Date) {
    const dateString = formatDate(date);
    return await axios.get("https://api.nasa.gov/neo/rest/v1/feed", {params: { 
        start_date: dateString,
        end_date: dateString, 
        api_key: process.env.NASA_API_KEY
    }});
}

function formatDate(date: Date)
{
    return date.getUTCFullYear() + "-" 
    + (date.getMonth() + 1).toString().padStart(2, '0') 
    + "-" + date.getUTCDate().toString().padStart(2, '0') ;
}

// return connection.from(NEO_DATA_TABLE).insert(neo);

export type InsertNEO = NFTSchema["nft"]["Tables"]["neo_data"]["Insert"];
export type UpdateNEO = NFTSchema["nft"]["Tables"]["neo_data"]["Update"];
export type NEO = NFTSchema["nft"]["Tables"]["neo_data"]["Row"];
export type OptionalNEO = NEO | undefined | null;