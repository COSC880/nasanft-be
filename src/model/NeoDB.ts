import { getConnection } from "./UtilsDb";
import { Database as NFTSchema } from "../schemas/Neos";
import axios from "axios";
import { convertToError } from "./NftBlockchain";

const connection = getConnection<NFTSchema>("nft");
const NEO_DATA_TABLE = "neo_data";

var CURRENT_NEO: NEO;

export async function clearNeos()
{
    return await connection.from(NEO_DATA_TABLE).delete();
}

export async function generateNewNeo()
{
    try
    {
        const today = new Date();
        const twoDays = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 2);
        const nasaRes = await getNeoFromNasa(twoDays);
        const dateString = formatDate(twoDays);
        const neo = await getRandomNeo(nasaRes.data.near_earth_objects[dateString]);
        const id = neo.id;
        const name = neo.name;
        const size = neo.estimated_diameter.feet.estimated_diameter_max;
        const range = getClosestApproach(neo.close_approach_data);
        const velocity = getLargestVelocity(neo.close_approach_data);
        const insertNeo: InsertNEO = {id: id, name: name,
            dateUTC: twoDays.getTime(),
            "size (feet)": size, "range(miles)": range, "velocity(MPH)": velocity};
        CURRENT_NEO = (await connection.from(NEO_DATA_TABLE).insert(insertNeo).select().single()).data;
    }
    catch(err) {
        CURRENT_NEO = null;
    }
}

export function getCurrentNeo()
{
    return CURRENT_NEO;
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

function getClosestApproach(close_approach_data: any[])
{
    let closestRange = Number.MAX_VALUE;
    for (let i=0; i<close_approach_data.length; i++)
    {
        let currentRange = parseFloat(close_approach_data[i].miss_distance.miles);
        if (currentRange < closestRange)
        {
            closestRange = currentRange
        }
    }
    return closestRange;
}

function getLargestVelocity(close_approach_data: any[])
{
    let largestVelocity = 0;
    for (let i=0; i<close_approach_data.length; i++)
    {
        let currentVelocity = parseFloat(close_approach_data[i].relative_velocity.miles_per_hour);
        if (currentVelocity > largestVelocity)
        {
            largestVelocity = currentVelocity
        }
    }
    return largestVelocity;
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
export type NEO = undefined | null | NFTSchema["nft"]["Tables"]["neo_data"]["Row"];