import "jest"
import {MsEdgeTTS} from "./MsEdgeTTS"
import {OUTPUT_EXTENSIONS, OUTPUT_FORMAT} from "./Output"
import {mkdirSync, readFileSync} from "fs"
import {existsSync, unlinkSync} from "node:fs"
import {tmpdir} from "os"
import {join} from "path"
import randomBytes from "randombytes"

describe("MsEdgeTTS", () => {
    let tts: MsEdgeTTS
    let tmpPath: string

    beforeAll(() => {
        tmpPath = join(tmpdir(), randomBytes(16).toString("hex"))
        mkdirSync(tmpPath)
        console.log(tmpPath)
    })

    beforeEach(async () => {
        tts = new MsEdgeTTS({enableLogger: true})
    })

    it("should write audio to file", async () => {
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
        const {audioFilePath} = await tts.toFile(join(tmpPath), "Hi, how are you doing today hello hello hello?")
        console.log("Done!", audioFilePath)

        expect(audioFilePath).toBeDefined()
        expect(Object.keys(tts["_streams"]).length).toBe(0)
        // have content
        expect(readFileSync(audioFilePath).length).toBeGreaterThan(0)
    })

    it("should write metadata to file", async () => {
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS, {
            sentenceBoundaryEnabled: true,
        })
        const {metadataFilePath} = await tts.toFile(join(tmpPath), "Hi, how are you doing today hello hello hello?")
        console.log("Done!", metadataFilePath)
        //
        expect(metadataFilePath).toBeDefined()
        expect(metadataFilePath).toMatch(/.json$/)
        expect(Object.keys(tts["_streams"]).length).toBe(0)
        // have content
        expect(readFileSync(metadataFilePath).length).toBeGreaterThan(0)
    })

    it("should handle multiple streams simultaneously", async () => {
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
        const promises = []
        for (let i = 0; i < 10; i++) {
            const p = new Promise((resolve, reject) => {
                const {audioStream: s} = tts.toStream("Hi, how are you?")
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
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
        // mock _pushAudioData to do nothing, asif no data was received
        tts["_pushAudioData"] = jest.fn()
        await expect(() => tts.toFile(tmpPath, ""))
            .rejects.toMatch("No audio")

        expect(Object.keys(tts["_streams"]).length).toBe(0)
        expect(existsSync(join(tmpPath, "audio." + OUTPUT_EXTENSIONS[tts["_outputFormat"]]))).toBe(false)
    })

    it("should require setMetadata", async () => {
        await expect(() => tts.toFile(join(tmpPath), "Hi, how are you?"))
            .rejects.toThrow("Speech synthesis not configured yet.")
    })

    it("should return different audio when a pitch is applied", async () => {
        await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
        const {audioFilePath} = await tts.toFile(join(tmpPath), "Hi, how are you?", {pitch: "+10Hz"})
        console.log("Done!", audioFilePath)

        expect(audioFilePath).toBeDefined()
        expect(Object.keys(tts["_streams"]).length).toBe(0)
        // have content
        expect(readFileSync(audioFilePath).length).toBeGreaterThan(0)
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
    })

})
