import fs from "fs";
import path from "path";
import fsExtra from "fs-extra";

async function mergeJsons() {
    const outputDir = path.resolve("output");

    console.log("📦 Consolidando JSONs da pasta output...");

    const files = await fs.promises.readdir(outputDir);

    const jsonFiles = files.filter(f => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
        console.log("Nenhum arquivo JSON encontrado em /output");
        return;
    }

    const merged = {};

    for (const file of jsonFiles) {
        const filePath = path.join(outputDir, file);

        try {
            const content = await fsExtra.readJson(filePath);

            // Merge each key from the individual JSON into the master object
            Object.assign(merged, content);

            console.log(`✅ Incluído: ${file}`);
        } catch (err) {
            console.error(`Erro ao ler ${file}:`, err.message);
        }
    }

    const masterPath = path.join(outputDir, "merged.json");

    await fsExtra.writeJson(masterPath, merged, { spaces: 2 });

    console.log(`\n🎉 Consolidação concluída: ${masterPath}`);
    console.log(`📊 Total de chaves: ${Object.keys(merged).length}`);
}

mergeJsons().catch(console.error);
