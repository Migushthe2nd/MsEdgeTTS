import {MsEdgeTTS} from "./MsEdgeTTS"
import {OUTPUT_FORMAT} from "./Output"
import {createServer, IncomingMessage} from "http"
import {AddressInfo, Socket} from "net"
import {WebSocketServer} from "ws"
import {once} from "events"
import {mkdtempSync, readFileSync, rmSync} from "fs"
import {join} from "path"
import {tmpdir} from "os"

const format = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
const serverTime = Date.parse("2026-10-13T10:00:30Z")
const serverDate = new Date(serverTime).toUTCString()
const expectedToken = "461B5A82FDC12AF5-A89B0EBF2C158E7B404FF47B1F12D5579CB3C7D7B18EC8ADE4A4AD0A8036C8DE"

describe("MsEdgeTTS authentication clock recovery", () => {
    let server: ReturnType<typeof createServer>
    let wss: WebSocketServer
    let sockets: Set<Socket>
    let clients: MsEdgeTTS[]
    let tokens: string[]
    let messages: string[]
    let getUrl: jest.SpyInstance
    let respond: (request: IncomingMessage, socket: Socket, head: Buffer) => void
    let previousWindow: any

    function reject(socket: Socket, status: number, date: string | null = serverDate) {
        socket.end(`HTTP/1.1 ${status} Rejected\r\n${date === null ? "" : `Date: ${date}\r\n`}Content-Length: 0\r\nConnection: close\r\n\r\n`)
    }

    function accept(request: IncomingMessage, socket: Socket, head: Buffer) {
        wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws))
    }

    function client(options?: ConstructorParameters<typeof MsEdgeTTS>[0]) {
        const tts = new MsEdgeTTS(options)
        clients.push(tts)
        return tts
    }

    beforeEach(async () => {
        previousWindow = (globalThis as any).window
        MsEdgeTTS["_clockOffsetMs"] = 0
        clients = []
        tokens = []
        messages = []
        sockets = new Set()
        server = createServer()
        wss = new WebSocketServer({noServer: true})
        server.on("connection", socket => {
            sockets.add(socket)
            socket.on("error", () => {})
            socket.once("close", () => sockets.delete(socket))
        })
        respond = accept
        server.on("upgrade", (request, socket: Socket, head) => {
            tokens.push(new URL(request.url, "http://localhost").searchParams.get("Sec-MS-GEC"))
            respond(request, socket, head)
            server.emit("attempt", {request, socket, head})
        })
        wss.on("connection", ws => ws.on("message", raw => {
            const text = raw.toString()
            messages.push(text)
            const match = /X-RequestId:(.*?)\r\n/.exec(text)
            if (!match) return
            const id = match[1]
            ws.send(`X-RequestId:${id}\r\nPath:audio.metadata\r\n\r\n{"Metadata":[{"Type":"WordBoundary","Data":{"text":{"Text":"Hello"}}}]}`)
            ws.send(Buffer.concat([Buffer.from(`X-RequestId:${id}\r\nPath:audio\r\n`), Buffer.from([1, 2, 3])]))
            ws.send(`X-RequestId:${id}\r\nPath:turn.end\r\n\r\n{}`)
        }))
        server.listen(0, "127.0.0.1")
        await once(server, "listening")
        const original = (MsEdgeTTS as any).getSynthUrl.bind(MsEdgeTTS)
        getUrl = jest.spyOn(MsEdgeTTS as any, "getSynthUrl").mockImplementation(async () => {
            const url = new URL(await original())
            url.protocol = "ws:"
            url.hostname = "127.0.0.1"
            url.port = String((server.address() as AddressInfo).port)
            return url.toString()
        })
    })

    afterEach(async () => {
        jest.useRealTimers()
        clients.forEach(tts => tts.close())
        sockets.forEach(socket => socket.destroy())
        await new Promise<void>(resolve => server.close(() => resolve()))
        wss.close()
        jest.restoreAllMocks()
        MsEdgeTTS["_clockOffsetMs"] = 0
        if (previousWindow === undefined) delete (globalThis as any).window
        else (globalThis as any).window = previousWindow
    })

    it.each([600000, -600000])("corrects a clock offset of %i ms once and shares the corrected token", async skew => {
        jest.spyOn(Date, "now").mockReturnValue(serverTime + skew)
        respond = (request, socket, head) => tokens.length === 1 ? reject(socket, 403) : accept(request, socket, head)
        const tts = client()
        await Promise.all([
            tts.setMetadata("en-US-AriaNeural", format),
            tts.setMetadata("en-US-AriaNeural", format),
        ])
        expect(tokens).toHaveLength(2)
        expect(tokens[0]).not.toBe(expectedToken)
        expect(tokens[1]).toBe(expectedToken)
        const next = client()
        await next.setMetadata("en-US-AriaNeural", format)
        expect(tokens[2]).toBe(expectedToken)
        expect(Date.now()).toBe(serverTime + skew)
    })

    it.each([
        [403, null],
        [403, "not a date"],
        [429, serverDate],
        [500, serverDate],
    ])("preserves HTTP %i failure without retry for Date %s", async (status, date) => {
        respond = (_request, socket) => reject(socket, status as number, date as string | null)
        const tts = client()
        await expect(tts.setMetadata("en-US-AriaNeural", format))
            .rejects.toThrow(`Unexpected server response: ${status}`)
        expect(tokens).toHaveLength(1)
        expect(MsEdgeTTS["_clockOffsetMs"]).toBe(0)
    })

    it("stops after a second 403", async () => {
        jest.spyOn(Date, "now").mockReturnValue(serverTime + 600000)
        respond = (_request, socket) => reject(socket, 403)
        await expect(client().setMetadata("en-US-AriaNeural", format)).rejects.toThrow("Unexpected server response: 403")
        expect(tokens).toHaveLength(2)
        expect(tokens[1]).toBe(expectedToken)
    })

    it("recovers a synthesis reconnect before sending the request, without duplicating it", async () => {
        const now = jest.spyOn(Date, "now").mockReturnValue(serverTime)
        const tts = client()
        await tts.setMetadata("en-US-AriaNeural", format, {wordBoundaryEnabled: true})
        const closed = once(tts["_ws"], "close")
        tts["_ws"].close()
        await closed
        now.mockReturnValue(serverTime + 600000)
        respond = (request, socket, head) => tokens.length === 2 ? reject(socket, 403) : accept(request, socket, head)
        const dir = mkdtempSync(join(tmpdir(), "msedgetts-clock-"))
        try {
            const result = await tts.toFile(dir, "Hello")
            expect(readFileSync(result.audioFilePath)).toEqual(Buffer.from([1, 2, 3]))
            expect(JSON.parse(readFileSync(result.metadataFilePath, "utf8")).Metadata).toHaveLength(1)
            expect(tokens).toHaveLength(3)
            expect(tokens[2]).toBe(expectedToken)
            expect(messages.filter(message => message.includes("Path:ssml"))).toHaveLength(1)
            expect(Object.keys(tts["_streams"])).toHaveLength(0)
        } finally {
            rmSync(dir, {recursive: true, force: true})
        }
    })

    it("keeps the original connection deadline across the recovery attempt", async () => {
        jest.useFakeTimers({doNotFake: ["nextTick", "setImmediate"]})
        jest.setSystemTime(serverTime + 600000)
        respond = () => {}
        const tts = client({connectionTimeoutMs: 100})
        const first = once(server, "attempt")
        const timedOut = expect(tts.setMetadata("en-US-AriaNeural", format)).rejects.toThrow(/connection.*timed out/i)
        const [{socket}] = await first
        jest.advanceTimersByTime(80)
        const second = once(server, "attempt")
        reject(socket, 403)
        await second
        jest.advanceTimersByTime(21)
        expect(tts["_ws"].readyState).not.toBe(tts["_ws"].CONNECTING)
        await timedOut
        expect(tokens).toHaveLength(2)
    })

    it("does not reopen a closed client while the recovery URL is pending", async () => {
        respond = (_request, socket) => reject(socket, 403)
        const original = getUrl.getMockImplementation()
        let resume: () => void
        let started: () => void
        const retryStarted = new Promise<void>(resolve => started = resolve)
        let calls = 0
        getUrl.mockImplementation(() => {
            if (++calls !== 2) return original()
            started()
            return new Promise<string>(resolve => {
                resume = () => resolve(original())
            })
        })
        const tts = client()
        const rejected = expect(tts.setMetadata("en-US-AriaNeural", format)).rejects.toThrow(/connection closed/i)
        await retryStarted
        tts.close()
        resume()
        await rejected
        expect(tokens).toHaveLength(1)
    })

    it("keeps ordinary browser-mode 403 errors without attempting clock recovery", async () => {
        Object.assign(globalThis, {window: {document: {}}})
        respond = (_request, socket) => reject(socket, 403)
        await expect(client().setMetadata("en-US-AriaNeural", format)).rejects.toThrow("Unexpected server response: 403")
        expect(tokens).toHaveLength(1)
        expect(MsEdgeTTS["_clockOffsetMs"]).toBe(0)
    })

})
