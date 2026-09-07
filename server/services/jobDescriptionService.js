import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getZampJD = async () => {
    const jdPath = path.join(
        __dirname,
        "../data/zamp-jd.txt"
    );

    return fs.readFile(jdPath, "utf-8");
};