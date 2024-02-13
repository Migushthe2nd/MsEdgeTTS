import "jest"
import {MsEdgeTTS} from "./MsEdgeTTS"
import {OUTPUT_FORMAT} from "./OUTPUT_FORMAT"
import {readFileSync, mkdirSync} from "fs"
import {existsSync, unlinkSync} from "node:fs"
import {tmpdir} from "os"
import {join} from "path"
import {randomBytes} from "crypto"

describe("MsEdgeTTS", () => {
    let tts: MsEdgeTTS
    let tmpPath: string

    beforeAll(() => {
        tmpPath = join(tmpdir(), randomBytes(16).toString("hex"))
        mkdirSync(tmpPath)
        console.log(tmpPath)
    })

    beforeEach(async () => {
        tts = new MsEdgeTTS(null, true)
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
    })

    it("should write audio to file", async () => {
        const filePath = await tts.toFile(join(tmpPath, "./example_audio.webm"), "Hi, how are you?")
        console.log("Done!", filePath)

        expect(filePath).toBeDefined()
        expect(filePath).toMatch(/example_audio.webm/)
        expect(Object.keys(tts["_streams"]).length).toBe(0)
        // have content
        expect(readFileSync(filePath).length).toBeGreaterThan(0)
    })

    it("should handle multiple streams simultaneously", async () => {
        const promises = []
        for (let i = 0; i < 100; i++) {
            const p = new Promise((resolve, reject) => {
                const s = tts.toStream("Hi, how are you?")
                s.on("close", () => {
                    console.log(`Stream ${i} ended`)
                    resolve("done")
                })
                s.on("data", (data) => {
                    console.log(`Stream ${i} data`, data.length)
                })
                s.on("error", (err) => {
                    console.log(`Stream ${i} error`, err)
                    reject(err)
                })
            })
            promises.push(p)
        }

        await expect(Promise.all(promises)).resolves.toBeDefined()
    }, 60000)

    it("should not write to file if no data", async () => {
        // mock _pushAudioData to do nothing, asif no data was received
        tts["_pushAudioData"] = jest.fn()
        await expect(() => tts.toFile(join(tmpPath, `./example_audio2.webm`), ""))
            .rejects.toMatch("No audio")

        expect(Object.keys(tts["_streams"]).length).toBe(0)
        expect(existsSync("./example_audio2.webm")).toBe(false)
    })

    // it("should require setMetadata", async () => {
    //     tts["_ws"].close()
    //     tts["_ws"] = null
    //     tts.toFile(join(tmpPath, `./example_audio3.webm`), "Hi, how are you?")
    //     await expect(() => tts.toFile(join(tmpPath, `./example_audio3.webm`), "Hi, how are you?"))
    //         .rejects.toThrow("Speech synthesis not configured yet.")
    // })

    it("should return different audio when a pitch is applied", async () => {
        const filePath = await tts.toFile(join(tmpPath, `./example_audio4.webm`), "Hi, how are you?", {pitch: "+10Hz"})
        console.log("Done!", filePath)

        expect(filePath).toBeDefined()
        expect(filePath).toMatch(/example_audio4.webm/)
        expect(Object.keys(tts["_streams"]).length).toBe(0)
        // have content
        expect(readFileSync(filePath).length).toBeGreaterThan(0)
    })

    afterEach(() => {
        tts.close()
        expect(Object.keys(tts["_streams"]).length).toBe(0)
    })

    afterAll(() => {
        tts.close()
        // if (existsSync(tmpPath)) {
        //     unlinkSync(tmpPath)
        // }
    });

})
