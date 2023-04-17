const util = require('node:util');
const execSync = require("child_process").execSync;
const exec = util.promisify(require('node:child_process').exec);
const fse = require("fs-extra");
require('dotenv').config();
const generatedSchemasDir = "src/schemas"

main();

async function main()
{
    await preBuild();
    build();
    postBuild();
}

async function preBuild()
{
    await generateTypes();
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
async function generateTypes()
{
    fse.mkdirpSync(generatedSchemasDir, {recursive: true});
    const output = await Promise.all([
        generateType("users_data", "Users"),   
        generateType("quiz_information", "Quizzes"),
        generateType("nft", "Neos")
    ]);
    console.log(output);
}

function generateType(schemaName, filename)
{
    return exec("npx supabase gen types typescript --project-id \"" + process.env.SUPABASE_PROJECT_ID + "\" --schema \""
     + schemaName + "\" > \"" + generatedSchemasDir + "/" + filename + ".ts\"", {encoding: "UTF-8"});
}