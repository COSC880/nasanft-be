const execSync = require("child_process").execSync;
const fse = require("fs-extra");
require('dotenv').config();

main();

function main()
{
    preBuild();
    build();
    postBuild();
}

function preBuild()
{
    generateTypes();
}

function build()
{
    execSync("tsc --build \"tsconfig." + process.env.NODE_ENV + ".json\"");
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
    generateType("quiz_information", "Questions");
}

function generateType(schemaName, filename)
{
    execSync("npx supabase gen types typescript --project-id \"" + process.env.SUPABASE_PROJECT_ID + "\" --schema \""
     + schemaName + "\" > \"src/model/" + filename + ".ts\"");
}