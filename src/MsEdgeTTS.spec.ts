import "jest"
import {MsEdgeTTS} from "./MsEdgeTTS"
import {OUTPUT_EXTENSIONS, OUTPUT_FORMAT} from "./Output"
import {mkdirSync, readFileSync, rmSync} from "fs"
import {existsSync} from "node:fs"
import {join} from "path"
import {AddressInfo} from "net"
import {WebSocketServer} from "ws"

describe("MsEdgeTTS onerror", () => {
    it("should reject with an Error instance containing diagnostic info when the socket errors", async () => {
        const tts = new MsEdgeTTS()
        // Force getSynthUrl to return a URL that will immediately fail
        jest.spyOn(MsEdgeTTS as any, "getSynthUrl").mockResolvedValue("ws://localhost:1/invalid")
        const rejection = tts["_initClient"]()
        await expect(rejection).rejects.toBeInstanceOf(Error)
        await expect(rejection).rejects.toMatchObject({
            message: expect.stringContaining("Edge TTS WebSocket error:"),
        })
        jest.restoreAllMocks()
    })
})

describe("MsEdgeTTS", () => {
    let tts: MsEdgeTTS
    let tmpPath: string

    beforeAll(() => {
        tmpPath = join("./", "msedgetts-test")
        mkdirSync(tmpPath)
        console.log(tmpPath)
    })

    afterAll(() => {
        if (existsSync(tmpPath)) {
            rmSync(tmpPath, { recursive: true, force: true })
        }
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
            .rejects.toThrow("No audio data received")

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

describe("MsEdgeTTS truncated connection", () => {
    // A local server standing in for Edge: it sends turn.start and one audio frame, then either
    // sends turn.end (complete) or closes without it (a dropped/proxied connection mid-synthesis).
    function startServer(sendTurnEnd: boolean): Promise<WebSocketServer> {
        return new Promise((resolve) => {
            const wss = new WebSocketServer({port: 0})
            wss.on("listening", () => resolve(wss))
            wss.on("connection", (socket) => {
                socket.on("message", (raw) => {
                    const match = /X-RequestId:(.*?)\r\n/.exec(raw.toString())
                    if (!match) return // speech.config handshake, no request id
                    const requestId = match[1]
                    socket.send(`X-RequestId:${requestId}\r\nContent-Type:application/json; charset=utf-8\r\nPath:turn.start\r\n\r\n{}`)
                    socket.send(Buffer.concat([Buffer.from(`X-RequestId:${requestId}\r\nPath:audio\r\n`), Buffer.from([0, 1, 2, 3])]))
                    if (sendTurnEnd) {
                        socket.send(`X-RequestId:${requestId}\r\nContent-Type:application/json; charset=utf-8\r\nPath:turn.end\r\n\r\n{}`)
                    }
                    setTimeout(() => socket.close(), 20)
                })
            })
        })
    }

    async function synth(sendTurnEnd: boolean): Promise<{ outcome: string, bytes: number }> {
        const server = await startServer(sendTurnEnd)
        const {port} = server.address() as AddressInfo
        jest.spyOn(MsEdgeTTS as any, "getSynthUrl").mockResolvedValue(`ws://127.0.0.1:${port}`)
        const tts = new MsEdgeTTS()
        try {
            await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
            const {audioStream} = tts.toStream("Some text that gets cut short.")
            let bytes = 0
            const outcome = await new Promise<string>((resolve) => {
                audioStream.on("data", (c: Buffer) => bytes += c.length)
                audioStream.on("end", () => resolve("end"))
                audioStream.on("error", () => resolve("error"))
            })
            return {outcome, bytes}
        } finally {
            tts.close()
            server.close()
            jest.restoreAllMocks()
        }
    }

    it("errors the audio stream when the socket closes before turn.end", async () => {
        const {outcome, bytes} = await synth(false)
        expect(bytes).toBeGreaterThan(0) // partial audio arrived...
        expect(outcome).toBe("error") // ...but the truncation is surfaced, not hidden
    })

    it("ends the audio stream normally when turn.end is received", async () => {
        const {outcome} = await synth(true)
        expect(outcome).toBe("end")
    })
})
