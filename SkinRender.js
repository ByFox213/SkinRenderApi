    const fs = require("fs");
    const path = require("path");
    const { Skin, ColorCode } = require("teeworlds-utilities")


    const fastify = require("fastify")({
        logger: true,
    });

    const SKIN_PATH = process.env.SKIN_PATH || path.join(__dirname, "skins");
    const OUTPUT_PATH = process.env.OUTPUT_PATH || path.join(__dirname, "render");
    const BASEURL = `https://${process.env.BASEURL || '127.0.0.1'}/api/skins/render/`;


    class SkinManager {
        static async loadSkin(skinPath) {
            const skin = new Skin();
            return await skin.load(skinPath);
        }

        static async saveGameskinPart(skin, body, outPath) {
            if (body !== null) {
                try {
                    skin.colorBody(new ColorCode(body))
                } catch (err) {
                    // console.log(err)
                }
            }

            skin
                .render()
                .saveRenderAs(outPath);
        }
    }

    // Define the API endpoint
    fastify.get("/api/render", async (request, reply) => {
        try {
            const { skin: skinName, body = null} = request.query;
            if (!skinName) {
                return { err: "not_skin" };
            }

            const skinPath = path.join(SKIN_PATH, `${skinName}.png`);
            if (!fs.existsSync(skinPath)) {
                return { err: "skin not found" };
            }

            const outSkinName = `${skinName.replace(" ", "%20")}_${body}.png`;
            const outSkinPath = path.join(OUTPUT_PATH, outSkinName);

            if (fs.existsSync(outSkinPath)) {
                return { url: `${BASEURL}${outSkinName}` };
            }

            const skin = await SkinManager.loadSkin(skinPath);
            await SkinManager.saveGameskinPart(skin, body, outSkinPath);
            reply.type("application/json").code(200);
            return { url: `${BASEURL}${outSkinName}` };
        } catch (error) {
            console.error("Error:", error);
        }
    });

    // Start the server
    fastify.listen({ host: "0.0.0.0", port: Number(process.env.PORT || 1541) }, (err, address) => {
        if (err) throw err;
        console.log(address);
    });
