import { DependencyContainer, inject, injectable } from "tsyringe";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { name, author } from "../package.json";
import { Config } from "./Config";
import path from "path";
import fs from "fs";
import type { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { Serializer } from "@spt-aki/di/Serializer";
import { HttpServerHelper } from "@spt-aki/helpers/HttpServerHelper";
import { IncomingMessage, ServerResponse } from "http";

export default class Mod implements IPreAkiLoadMod
{
    public static container: DependencyContainer;
    public static logPrefix: string = `[${author}-${name}]`;
    public static config: Config;
    public static logger: ILogger;

    // Code added here will load BEFORE the server has started loading
    preAkiLoad(container: DependencyContainer): void 
    {
        Mod.logger = container.resolve<ILogger>("WinstonLogger");
        Mod.config = new Config();

        if (!Mod.config.enabled)
        {
            Mod.logger.info(`${Mod.logPrefix} Config setting 'enabled' is 'false', so will not do anything`);
            return;
        }

        Mod.container = container;

        // Register our own serializer
        container.register<JDOEHtmlSerializer>("JDOEHtmlSerializer", JDOEHtmlSerializer);
        container.registerType("Serializer", "JDOEHtmlSerializer");
        
        // Create a route that should use our new serializer
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        staticRouterModService.registerStaticRouter(
            "CustomStaticRouter",
            [
                {
                    url: "/webpage",
                    action: (url, info, sessionId, output) => 
                    {
                        // Return the contents of an HTML file
                        return fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
                    }
                }
            ],
            "custom-static-jdoe-serializer-example"
        );
    }
}

@injectable()
class JDOEHtmlSerializer extends Serializer
{
    constructor(
        @inject("HttpServerHelper") protected httpServerHelper: HttpServerHelper,
        @inject("WinstonLogger") protected logger: ILogger
    )
    {
        super();
    }

    public override serialize(sessionID: string, req: IncomingMessage, resp: ServerResponse<IncomingMessage>, body: any): void
    {
        this.logger.debug(`${Mod.logPrefix} JDOEHtmlSerializer serialize()`);

        // Not sure if this works, didn't get to this point yet...
        resp.writeHead(200, "OK", { "Content-Type": "text/html" });
        resp.end(body);
    }
    
    public override canHandle(route: string): boolean
    {
        // The "route" here is actually the whole HTML content...
        // I would be expecting we could be passed some kind of string
        // like "HTML".

        this.logger.debug(`${Mod.logPrefix} JDOEHtmlSerializer canHandle('${route}')`);

        return route === "HTML";
    }
}

module.exports = { mod: new Mod() }