import fs from "fs";
import path from "path";
import Mod from "./mod";

export class Config {
    public enabled: boolean;
    public firebaseServiceAccountPath: string 

    public static Instance: Config;

    constructor() {
        this.enabled = true;

        const folderPath = path.join(__dirname, "..", "config");
        if(!fs.existsSync(folderPath))
            fs.mkdirSync(folderPath, { recursive: true });

        const filePath = path.join(folderPath, "config.json");
        if(!fs.existsSync(filePath)) {
            console.warn(`${Mod.logPrefix} Config doesn't exist, creating default config.`);
            const cfgString = JSON.stringify(this, null, 4);
            fs.writeFileSync(filePath, cfgString);
        }
        else {
            Object.assign(this, JSON.parse(fs.readFileSync(filePath).toString()))
            console.log(`${Mod.logPrefix} Config loaded.`);
        }

        Config.Instance = this;
    }

}
