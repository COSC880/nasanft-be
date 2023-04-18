const execSync = require("child_process").execSync;
const fse = require("fs-extra");
require('dotenv').config();
const generatedSchemasDir = "src/schemas"

main();

function main()
{
    preBuild();
    build();
    postBuild();
}

function preBuild()
{
    //Dont regenerate types in production for faster build
    if (process.env.NODE_ENV !== "production")
    {
        generateTypes();
    }
}

function build()
{
    execSync("tsc --build \"tsconfig." + process.env.NODE_ENV + ".json\"",{encoding: "UTF-8"});
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
    generateType("users_data", "Users");    
    generateType("quiz_information", "Quizzes");
    generateType("nft", "Neos");
}

function generateType(schemaName, filename)
{
    execSync("npx supabase gen types typescript --project-id \"" + process.env.SUPABASE_PROJECT_ID + "\" --schema \""
     + schemaName + "\" > \"" + generatedSchemasDir + "/" + filename + ".ts\"", {encoding: "UTF-8"});
}