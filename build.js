const execSync = require("child_process").execSync;
const fse = require("fs-extra");
require('dotenv').config();
const generatedSchemasDir = "src/schemas"

main();

function main()
{
    //Dont build if production and already built
    if (needsBuild())
    {
        preBuild();
        build();
        postBuild();
    }
}

function preBuild()
{
    generateTypes();
}

function build()
{
    execSync("tsc --build \"tsconfig." + process.env.NODE_ENV + ".json\"",{encoding: "UTF-8"});
}

function postBuild()
{
    copyStaticFiles();
}

function needsBuild()
{
    return process.env.NODE_ENV !== "production" || !fse.pathExistsSync("dist/production")
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
    fse.mkdirpSync(generatedSchemasDir, {recursive: true});
    generateType("users_data", "Users");    
    generateType("quiz_information", "Quizzes");
    generateType("nft", "Neos");
}

function generateType(schemaName, filename)
{
    execSync("npx supabase gen types typescript --project-id \"" + process.env.SUPABASE_PROJECT_ID + "\" --schema \""
     + schemaName + "\" > \"" + generatedSchemasDir + "/" + filename + ".ts\"", {encoding: "UTF-8"});
}