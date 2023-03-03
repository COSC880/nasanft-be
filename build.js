const execSync = require("child_process").execSync;
const fse = require("fs-extra");
const dotenv = require('dotenv').config();

const usage = "Usage: prebuild || postbuild || --help";

main();

function main()
{
    if (process.argv.length < 3)
    {
        console.log(usage);
        throw new Error("Invalid number of arguments");
    }
    else if(process.argv[2].toLowerCase() == "prebuild")
    {
        preBuild()
    }
    else
    {
        postBuild();
    }
}

function preBuild()
{
    generateTypes();
}

function postBuild()
{
    copyStaticFiles();
}

//STATIC FILES
async function copyStaticFiles()
{
    fse.copySync("src/views", "dist/" + process.env.NODE_ENV + "/views", {overwrite: true});
    fse.copySync("src/images", "dist/" + process.env.NODE_ENV + "/images", {overwrite: true});
}

//GENERATE TYPES
function generateTypes()
{
    fse.mkdirpSync("src/model", {recursive: true});
    generateType("users_data", "Users");    
}

function generateType(schemaName, filename)
{
    execSync("npx dotenv \"cross-var supabase gen types typescript --project-id \"%SUPABASE_PROJECT_ID%\" --schema \"" 
    + schemaName + "\" > \"src/model/" + filename + ".ts\"\"");
}