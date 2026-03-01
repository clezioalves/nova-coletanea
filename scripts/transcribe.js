import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import slugify from "slugify";
import fsExtra from "fs-extra";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function transcribe() {
    const audioDir = path.resolve("audio");

    const supportedExt = new Set([".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"]);

    console.log("🎵 Procurando arquivos de áudio em:", audioDir);

    await fsExtra.ensureDir("output");

    const files = await fs.promises.readdir(audioDir);

    const audioFiles = files.filter(f => supportedExt.has(path.extname(f).toLowerCase()));

    if (audioFiles.length === 0) {
        console.log("Nenhum arquivo de áudio encontrado em /audio");
        return;
    }

    for (const file of audioFiles) {
        const filePath = path.join(audioDir, file);
        const fileName = path.parse(file).name;
        const slug = slugify(fileName, { lower: true, strict: true });
        const outputPath = `output/${slug}.json`;

        // Skip if already processed
        if (await fsExtra.pathExists(outputPath)) {
            console.log(`⏭️  Pulando "${file}" (já processado)`);
            continue;
        }

        console.log(`🎵 Enviando "${file}" para transcrição...`);

        try {
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
                response_format: "verbose_json"
            });

            const output = { [slug]: [] };

            // If verbose_json with segments is present, use timestamps
            if (response && Array.isArray(response.segments)) {
                response.segments.forEach(segment => {
                    output[slug].push({
                        time: Number((segment.start || 0).toFixed(1)),
                        text: (segment.text || "").trim()
                    });
                });
            } else if (response && typeof response.text === "string") {
                // Fallback: save single entry with full text
                output[slug].push({ time: 0.0, text: response.text.trim() });
            } else {
                // Unexpected response shape
                output[slug].push({ time: 0.0, text: JSON.stringify(response) });
            }

            await fsExtra.writeJson(`output/${slug}.json`, output, { spaces: 2 });

            console.log(`✅ JSON gerado: output/${slug}.json`);
        } catch (err) {
            console.error(`Erro ao transcrever ${file}:`, err);
        }
    }
}

transcribe().catch(console.error);
