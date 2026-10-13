import {MsEdgeTTS} from "./MsEdgeTTS"
import {OUTPUT_FORMAT} from "./Output"
import {createServer} from "http"
import {AddressInfo, Socket} from "net"
import {WebSocket, WebSocketServer} from "ws"
import {once} from "events"
import {mkdtempSync, rmSync} from "fs"
import {tmpdir} from "os"
import {join} from "path"

const format = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

function audio(socket: WebSocket, requestId: string) {
    socket.send(Buffer.concat([
        Buffer.from(`X-RequestId:${requestId}\r\nPath:audio\r\n`),
        Buffer.from([1, 2, 3]),
    ]))
}

function turnEnd(socket: WebSocket, requestId: string) {
    socket.send(`X-RequestId:${requestId}\r\nPath:turn.end\r\n\r\n{}`)
}

describe("MsEdgeTTS metadata configuration", () => {
    let tts: MsEdgeTTS
    let initialize: jest.SpyInstance

    beforeEach(() => {
        tts = new MsEdgeTTS()
        initialize = jest.spyOn(tts as any, "_initClient").mockImplementation(async () => {
            tts["_ws"] = {readyState: 1, OPEN: 1} as any
        })
    })

    afterEach(() => jest.restoreAllMocks())

    it("reuses metadata without optional options and infers a changed voice's locale", async () => {
        await tts.setMetadata("en-US-AriaNeural", format)
        await tts.setMetadata("en-US-AriaNeural", format)
        expect(initialize).toHaveBeenCalledTimes(1)
        await tts.setMetadata("fil-PH-AngeloNeural", format)
        expect(tts["_metadataOptions"].voiceLocale).toBe("fil-PH")
        expect(initialize).toHaveBeenCalledTimes(2)
    })

    it.each([
        ["fil-PH-AngeloNeural", "fil-PH"],
        ["yue-HK-HiuMaanNeural", "yue-HK"],
        ["en-US-AriaNeural", "en-US"],
        ["Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)", "en-US"],
    ])("infers the complete locale from %s", async (voice, locale) => {
        await tts.setMetadata(voice, format)
        expect(tts["_metadataOptions"].voiceLocale).toBe(locale)
    })

    it("respects an explicit locale on the first call and retains it for the same voice", async () => {
        await tts.setMetadata("custom-voice", format, {voiceLocale: "en-US"})
        await tts.setMetadata("custom-voice", format)
        expect(tts["_metadataOptions"].voiceLocale).toBe("en-US")
        expect(initialize).toHaveBeenCalledTimes(1)
    })

    it.each(["connectionTimeoutMs", "synthesisTimeoutMs"])("validates %s", option => {
        for (const value of [-1, 1.5, NaN, Infinity, 2147483648, null]) {
            expect(() => new MsEdgeTTS({[option]: value} as any)).toThrow(option)
        }
        expect(() => new MsEdgeTTS({[option]: 0})).not.toThrow()
    })
})

describe("MsEdgeTTS request lifecycle", () => {
    let server: WebSocketServer
    let clients: MsEdgeTTS[]

    beforeEach(async () => {
        clients = []
        server = new WebSocketServer({port: 0})
        await once(server, "listening")
        jest.spyOn(MsEdgeTTS as any, "getSynthUrl")
            .mockResolvedValue(`ws://127.0.0.1:${(server.address() as AddressInfo).port}`)
        server.on("connection", socket => socket.on("message", raw => {
            const match = /X-RequestId:(.*?)\r\n/.exec(raw.toString())
            if (match) server.emit("request", {socket, requestId: match[1]})
        }))
    })

    afterEach(async () => {
        clients.forEach(tts => tts.close())
        server.clients.forEach(socket => socket.terminate())
        await new Promise<void>(resolve => server.close(() => resolve()))
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    async function configure(options?: ConstructorParameters<typeof MsEdgeTTS>[0]) {
        const tts = new MsEdgeTTS(options)
        clients.push(tts)
        await tts.setMetadata("en-US-AriaNeural", format, {wordBoundaryEnabled: true})
        return tts
    }

    async function request(tts: MsEdgeTTS, text: string) {
        const incoming = once(server, "request")
        const streams = tts.toStream(text)
        const [{socket, requestId}] = await incoming
        return {...streams, socket: socket as WebSocket, requestId: requestId as string}
    }

    it("ignores late audio, metadata and turn.end after cancellation while preserving another stream", async () => {
        const tts = await configure()
        const cancelled = await request(tts, "Cancel this request")
        cancelled.audioStream.destroy()
        const active = await request(tts, "Keep this request")
        const chunks: Buffer[] = []
        active.audioStream.on("data", chunk => chunks.push(chunk))
        const ended = once(active.audioStream, "end")

        audio(cancelled.socket, cancelled.requestId)
        cancelled.socket.send(`X-RequestId:${cancelled.requestId}\r\nPath:audio.metadata\r\n\r\n{"Metadata":[]}`)
        turnEnd(cancelled.socket, cancelled.requestId)
        cancelled.socket.send("Path:turn.end\r\n\r\n{}")
        audio(active.socket, active.requestId)
        turnEnd(active.socket, active.requestId)
        turnEnd(active.socket, active.requestId)
        await ended

        expect(Buffer.concat(chunks)).toEqual(Buffer.from([1, 2, 3]))
        expect(Object.keys(tts["_streams"])).toHaveLength(0)
        expect(active.socket.readyState).toBe(WebSocket.OPEN)
    })

    it("times out a stalled file request without interrupting an active request", async () => {
        const tts = await configure({synthesisTimeoutMs: 150})
        const dir = mkdtempSync(join(tmpdir(), "msedgetts-timeout-"))
        try {
            const incoming = once(server, "request")
            const stalled = expect(tts.toFile(dir, "Never answer this request"))
                .rejects.toThrow(/synthesis.*timed out/i)
            const [{socket, requestId}] = await incoming
            audio(socket, requestId)
            const active = await request(tts, "Continue sending audio")
            active.audioStream.resume()
            const ended = once(active.audioStream, "end")
            for (let i = 0; i < 3; i++) {
                await pause(80)
                audio(active.socket, active.requestId)
            }
            turnEnd(active.socket, active.requestId)
            await Promise.all([stalled, ended])
            audio(socket, requestId)
            turnEnd(socket, requestId)
            expect(Object.keys(tts["_streams"])).toHaveLength(0)
            expect(active.socket.readyState).toBe(WebSocket.OPEN)
        } finally {
            rmSync(dir, {recursive: true, force: true})
        }
    })

    it("resets the idle deadline on metadata and clears it at turn.end before buffered audio is consumed", async () => {
        const tts = await configure({synthesisTimeoutMs: 150})
        const active = await request(tts, "Metadata keeps this request active")
        const errors: Error[] = []
        active.audioStream.on("error", error => errors.push(error))
        active.metadataStream.resume()
        for (let i = 0; i < 3; i++) {
            await pause(80)
            active.socket.send(`X-RequestId:${active.requestId}\r\nPath:audio.metadata\r\n\r\n{"Metadata":[]}`)
        }
        audio(active.socket, active.requestId)
        turnEnd(active.socket, active.requestId)
        await pause(200)
        expect(errors).toEqual([])
        expect(active.audioStream.destroyed).toBe(false)
        const ended = once(active.audioStream, "end")
        active.audioStream.resume()
        await ended
        expect(Object.keys(tts["_streams"])).toHaveLength(0)
    })

    it("disables the synthesis idle deadline with zero", async () => {
        const tts = await configure({synthesisTimeoutMs: 0})
        jest.useFakeTimers({doNotFake: ["nextTick", "setImmediate"]})
        const active = await request(tts, "Wait indefinitely")
        const errors: Error[] = []
        active.audioStream.on("error", error => errors.push(error))
        jest.advanceTimersByTime(120000)
        expect(errors).toEqual([])
        expect(active.audioStream.destroyed).toBe(false)
        jest.useRealTimers()
        const ended = once(active.audioStream, "end")
        active.audioStream.resume()
        audio(active.socket, active.requestId)
        turnEnd(active.socket, active.requestId)
        await ended
    })

    it("does not send a cancelled request after a pending reconnect completes", async () => {
        const tts = await configure()
        await tts.setMetadata("en-US-AriaNeural", format)
        tts["_ws"].close()
        let reconnect: () => void
        jest.spyOn(tts as any, "_initClient").mockImplementation(() => new Promise<void>(resolve => {
            reconnect = () => {
                tts["_ws"] = {OPEN: 1, readyState: 1, send: jest.fn()} as any
                resolve()
            }
        }))
        const {audioStream} = tts.toStream("Cancel during reconnect")
        audioStream.destroy()
        reconnect()
        await Promise.resolve()
        expect(tts["_ws"].send).not.toHaveBeenCalled()
        expect(Object.keys(tts["_streams"])).toHaveLength(0)
        clients.splice(clients.indexOf(tts), 1)
    })

    it("uses callback-free sends in browser mode", async () => {
        const previousWindow = (globalThis as any).window
        const send = jest.spyOn(WebSocket.prototype, "send")
        Object.assign(globalThis, {window: {document: {}}})
        try {
            const tts = await configure({connectionTimeoutMs: 50})
            const active = await request(tts, "Native browser send")
            expect(send.mock.calls.slice(0, 2).map(call => call.length)).toEqual([1, 1])
            const ended = once(active.audioStream, "end")
            active.audioStream.resume()
            audio(active.socket, active.requestId)
            turnEnd(active.socket, active.requestId)
            await ended
            await pause(75)
            expect(tts["_ws"].readyState).toBe(WebSocket.OPEN)
        } finally {
            if (previousWindow === undefined) delete (globalThis as any).window
            else (globalThis as any).window = previousWindow
        }
    })

    it("surfaces a socket send failure on the audio stream and clears its request", async () => {
        const tts = await configure({synthesisTimeoutMs: 50})
        jest.spyOn(tts["_ws"], "send").mockImplementationOnce((...args: any[]) => {
            args[args.length - 1](new Error("send failed"))
        })
        const {audioStream, metadataStream} = tts.toStream("Cannot send this request")
        const [error] = await once(audioStream, "error")
        expect(error.message).toBe("send failed")
        expect(metadataStream.destroyed).toBe(true)
        expect(Object.keys(tts["_streams"])).toHaveLength(0)
    })
})

describe("MsEdgeTTS connection initialization", () => {
    let server: ReturnType<typeof createServer>
    let sockets: Set<Socket>
    let wsServer: WebSocketServer
    let tts: MsEdgeTTS

    beforeEach(async () => {
        server = createServer()
        sockets = new Set<Socket>()
        server.on("connection", socket => {
            sockets.add(socket)
            socket.once("close", () => sockets.delete(socket))
        })
        server.on("upgrade", () => {})
        server.listen(0, "127.0.0.1")
        await once(server, "listening")
        jest.spyOn(MsEdgeTTS as any, "getSynthUrl")
            .mockResolvedValue(`ws://127.0.0.1:${(server.address() as AddressInfo).port}`)
        wsServer = new WebSocketServer({noServer: true})
    })

    afterEach(async () => {
        jest.useRealTimers()
        tts?.close()
        sockets.forEach(socket => socket.destroy())
        await new Promise<void>(resolve => server.close(() => resolve()))
        wsServer.close()
        jest.restoreAllMocks()
    })

    it("rejects and closes a stalled handshake, then permits a fresh connection", async () => {
        tts = new MsEdgeTTS({connectionTimeoutMs: 50})
        await expect(tts.setMetadata("en-US-AriaNeural", format)).rejects.toThrow(/connection.*timed out/i)
        expect(tts["_ws"].readyState).not.toBe(WebSocket.OPEN)
        server.removeAllListeners("upgrade")
        server.on("upgrade", (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, () => {})
        })
        await tts.setMetadata("en-US-AriaNeural", format)
        expect(tts["_ws"].readyState).toBe(WebSocket.OPEN)
    })

    it("disables the connection deadline with zero", async () => {
        tts = new MsEdgeTTS({connectionTimeoutMs: 0})
        jest.useFakeTimers({doNotFake: ["nextTick", "setImmediate"]})
        const upgrade = once(server, "upgrade")
        let completed = false
        const initialized = tts.setMetadata("en-US-AriaNeural", format)
        initialized.then(() => completed = true, () => completed = true)
        const [request, socket, head] = await upgrade
        jest.advanceTimersByTime(120000)
        expect(completed).toBe(false)
        expect(tts["_ws"].readyState).toBe(WebSocket.CONNECTING)
        wsServer.handleUpgrade(request, socket, head, () => {})
        await initialized
        expect(tts["_ws"].readyState).toBe(WebSocket.OPEN)
    })

    it("rejects initialization when the handshake connection closes", async () => {
        tts = new MsEdgeTTS({connectionTimeoutMs: 0})
        server.removeAllListeners("upgrade")
        server.on("upgrade", (_request, socket) => socket.destroy())
        await expect(tts.setMetadata("en-US-AriaNeural", format)).rejects.toThrow(/WebSocket error|connection closed/)
        expect(tts["_clientInit"]).toBeUndefined()
    })

    it("rejects a failed configuration send and retries with a fresh connection", async () => {
        server.removeAllListeners("upgrade")
        server.on("upgrade", (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, () => {})
        })
        const send = jest.spyOn(WebSocket.prototype, "send").mockImplementationOnce((...args: any[]) => {
            args[args.length - 1](new Error("configuration send failed"))
        })
        tts = new MsEdgeTTS()
        await expect(tts.setMetadata("en-US-AriaNeural", format)).rejects.toThrow("configuration send failed")
        expect(tts["_clientInit"]).toBeUndefined()
        expect(tts["_ws"].readyState).not.toBe(WebSocket.OPEN)
        await tts.setMetadata("en-US-AriaNeural", format)
        expect(tts["_ws"].readyState).toBe(WebSocket.OPEN)
        expect(send).toHaveBeenCalledTimes(2)
    })

    it("retries a timed-out metadata replacement while retaining its older active stream", async () => {
        const initialTime = Date.now()
        const now = jest.spyOn(Date, "now").mockReturnValue(initialTime)
        server.removeAllListeners("upgrade")
        server.on("upgrade", (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, ws => ws.on("message", raw => {
                const id = /X-RequestId:(.*?)\r\n/.exec(raw.toString())?.[1]
                if (id) server.emit("pending-request", {ws, id})
            }))
        })
        tts = new MsEdgeTTS({connectionTimeoutMs: 100, synthesisTimeoutMs: 0})
        await tts.setMetadata("en-US-AriaNeural", format)
        const oldSocket = tts["_ws"]
        const pending = once(server, "pending-request")
        const {audioStream} = tts.toStream("Keep the older request alive")
        audioStream.resume()
        const ended = once(audioStream, "end")
        ended.catch(() => {})
        const [{ws, id}] = await pending
        const getUrl = jest.spyOn(MsEdgeTTS as any, "getSynthUrl")
        const original = getUrl.getMockImplementation()
        getUrl.mockImplementationOnce(() => {
            now.mockReturnValue(initialTime + 200)
            return original()
        })
        const nextFormat = OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
        await expect(tts.setMetadata("en-GB-SoniaNeural", nextFormat)).rejects.toThrow(/connection.*timed out/i)
        await Promise.all([
            tts.setMetadata("en-GB-SoniaNeural", nextFormat),
            tts.setMetadata("en-GB-SoniaNeural", nextFormat),
        ])
        expect(tts["_ws"] === oldSocket).toBe(false)
        expect(oldSocket.readyState).toBe(oldSocket.OPEN)
        expect(tts["_retiredSockets"]).toHaveLength(1)
        turnEnd(ws, id)
        await ended
    })
})
