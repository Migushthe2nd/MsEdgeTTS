import axios from "axios"
import WebSocket from "isomorphic-ws"
import {Buffer} from "buffer/index" // /index is important for browser compatibility
import {OUTPUT_EXTENSIONS, OUTPUT_FORMAT} from "./Output"
import {Readable} from "stream"
import * as fs from "fs"
import {Agent} from "http"
import {ProsodyOptions} from "./Prosody"
import {joinPath} from "./utils";

export type Voice = {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    SuggestedCodec: string;
    FriendlyName: string;
    Status: string;
}

export class MetadataOptions {
    /**
     * (optional) any voice locale that is supported by the voice. See the list of all voices for compatibility. If not provided, the locale will be inferred from the `voiceName`.
     * Changing the voiceName will reset the voiceLocale.
     */
    voiceLocale?: string
    /**
     * (optional) whether to enable sentence boundary metadata. Default is `false`
     */
    sentenceBoundaryEnabled?: boolean = false
    /**
     * (optional) whether to enable word boundary metadata. Default is `false`
     */
    wordBoundaryEnabled?: boolean = false
}

enum messageTypes {
    TURN_START = "turn.start",
    TURN_END = "turn.end",
    RESPONSE = "response",
    SPEECH_CONFIG = "speech.config",
    AUDIO_METADATA = "audio.metadata",
    AUDIO = "audio",
    SSML = "ssml",
}

/**
 * MsEdgeTTS constructor options
 */
type Options = {
    /**
     * (optional, **NOT SUPPORTED IN BROWSER**) Use a custom http.Agent implementation like [https-proxy-agent](https://github.com/TooTallNate/proxy-agents) or [socks-proxy-agent](https://github.com/TooTallNate/proxy-agents/tree/main/packages/socks-proxy-agent).
     * */
    agent?: Agent,
    /** whether to enable the built-in logger. This logs connections inits, disconnects, and incoming data to the console */
    enableLogger?: boolean,
    /** WebSocket connection deadline in milliseconds. Default is 10000; 0 disables it. */
    connectionTimeoutMs?: number,
    /** Per-request synthesis idle deadline in milliseconds. Default is 60000; 0 disables it. */
    synthesisTimeoutMs?: number
}

export class MsEdgeTTS {
    private static TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    private static VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`
    private static WSS_URL = "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1"
    private static JSON_XML_DELIM = "\r\n\r\n"
    private static AUDIO_DELIM = "Path:audio\r\n"
    private static VOICE_LANG_REGEX = /\b[a-z]{2,}-[A-Z]{2}\b/
    private static _clockOffsetMs = 0
    private readonly _enableLogger
    private readonly _isBrowser: boolean
    private _ws: WebSocket
    private _clientInit?: Promise<void>
    private _clientGeneration = 0
    private _voice
    private _outputFormat
    private _metadataOptions: MetadataOptions = new MetadataOptions()
    private _streams: { [key: string]: { audio: Readable, metadata: Readable, turnEnded: boolean, socket?: WebSocket, timeout?: ReturnType<typeof setTimeout> } } = {}
    private _retiredSockets: WebSocket[] = []
    private _startTime = 0
    private readonly _agent: Agent
    private readonly _connectionTimeoutMs: number
    private readonly _synthesisTimeoutMs: number

    private _log(...o: any[]) {
        if (this._enableLogger) {
            console.log(...o)
        }
    }

    /**
     * Create a new `MsEdgeTTS` instance.
     *
     * @param options (optional) {@link Options}
     */
    public constructor(options?: Options) {
        this._agent = options?.agent || undefined
        this._enableLogger = options?.enableLogger || false
        this._isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined"
        this._connectionTimeoutMs = options?.connectionTimeoutMs === undefined ? 10000 : options.connectionTimeoutMs
        this._synthesisTimeoutMs = options?.synthesisTimeoutMs === undefined ? 60000 : options.synthesisTimeoutMs
        for (const [name, value] of Object.entries({connectionTimeoutMs: this._connectionTimeoutMs, synthesisTimeoutMs: this._synthesisTimeoutMs})) {
            if (!Number.isInteger(value) || value < 0 || value > 2147483647) {
                throw new Error(`${name} must be an integer between 0 and 2147483647 milliseconds.`)
            }
        }
    }

    private static async getSynthUrl(): Promise<string> {
        const req_id = MsEdgeTTS.generateUUID(); // Generate the request ID
        const secMsGEC = await MsEdgeTTS.generateSecMsGec(this.TRUSTED_CLIENT_TOKEN);
        return `${this.WSS_URL}?Ocp-Apim-Subscription-Key=${this.TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGEC}&Sec-MS-GEC-Version=1-143.0.3650.96&ConnectionId=${req_id}`;
    }

    private _initClient(): Promise<void> {
        if (this._clientInit) return this._clientInit
        const init = this._createClient()
        const tracked = init.finally(() => {
            if (this._clientInit === tracked) this._clientInit = undefined
        })
        this._clientInit = tracked
        return tracked
    }

    private async _createClient(retryClock = true, deadline = this._connectionTimeoutMs ? Date.now() + this._connectionTimeoutMs : 0, generation = this._clientGeneration): Promise<void> {
        const previous = this._ws
        if (previous) {
            if (previous.readyState === previous.OPEN
                && Object.values(this._streams).some(stream => stream.socket === previous && !stream.turnEnded)) {
                if (!this._retiredSockets.includes(previous)) this._retiredSockets.push(previous)
            } else {
                this._closeSocket(previous)
            }
        }

        const synthUrl = await MsEdgeTTS.getSynthUrl();
        if (generation !== this._clientGeneration) throw new Error("Edge TTS connection closed before initialization completed.")
        const remaining = deadline ? deadline - Date.now() : 0
        if (deadline && remaining <= 0) throw new Error(`Edge TTS connection timed out after ${this._connectionTimeoutMs} milliseconds.`)
        const options = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
                "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold"
            }
        };
        const ws = this._ws = this._isBrowser
            ? new WebSocket(synthUrl)
            : new WebSocket(synthUrl, {...options, agent: this._agent})

        ws.binaryType = "arraybuffer"
        return new Promise<void>((resolve, reject) => {
            let connecting = true
            const connectionTimeout = this._connectionTimeoutMs ? setTimeout(() => {
                connecting = false
                reject(new Error(`Edge TTS connection timed out after ${this._connectionTimeoutMs} milliseconds.`))
                this._closeSocket(ws)
            }, remaining) : undefined
            if (!this._isBrowser) {
                ws.once("unexpected-response", (request, response) => {
                    if (!connecting || ws.readyState !== ws.CONNECTING || generation !== this._clientGeneration) {
                        request.destroy()
                        response.destroy()
                        return
                    }
                    const error = Object.assign(new Error(`Unexpected server response: ${response.statusCode}`), {
                        statusCode: response.statusCode,
                        serverDate: response.headers.date,
                    })
                    // This listener suppresses ws's default handshake abort, so close both HTTP objects.
                    request.destroy(error)
                    response.destroy()
                })
            }
            ws.onopen = () => {
                if (!connecting) return
                connecting = false
                clearTimeout(connectionTimeout)
                this._log("Connected in", (Date.now() - this._startTime) / 1000, "seconds")
                this._send(`Content-Type:application/json; charset=utf-8\r\nPath:${messageTypes.SPEECH_CONFIG}${MsEdgeTTS.JSON_XML_DELIM}
                    {
                        "context": {
                            "synthesis": {
                                "audio": {
                                    "metadataoptions": {
                                        "sentenceBoundaryEnabled": "${this._metadataOptions.sentenceBoundaryEnabled}",
                                        "wordBoundaryEnabled": "${this._metadataOptions.wordBoundaryEnabled}"
                                    },
                                    "outputFormat": "${this._outputFormat}" 
                                }
                            }
                        }
                    }
                `, undefined, ws).then(resolve, error => {
                    this._closeSocket(ws)
                    reject(error)
                })
            }
            ws.onmessage = (m) => {
                const buffer = Buffer.from(m.data as ArrayBuffer)
                const message = buffer.toString()

                const requestId = /X-RequestId:(.*?)\r\n/.exec(message)?.[1]
                const stream = requestId && this._streams[requestId]
                if (!stream || stream.audio.destroyed || stream.turnEnded || stream.socket !== ws) return

                if (message.includes(`Path:${messageTypes.TURN_START}`)) {
                    // start of turn, ignore
                    this._log("->", message)
                    this._resetSynthesisTimeout(requestId)
                } else if (message.includes(`Path:${messageTypes.TURN_END}`)) {
                    // end of turn, close stream
                    this._log("->", message)
                    clearTimeout(stream.timeout)
                    stream.timeout = undefined
                    stream.turnEnded = true
                    stream.audio.push(null)
                    this._closeRetiredSockets()
                } else if (message.includes(`Path:${messageTypes.RESPONSE}`)) {
                    // context response, ignore
                    this._log("->", message)
                    this._resetSynthesisTimeout(requestId)
                } else if (message.includes(`Path:${messageTypes.AUDIO_METADATA}`)) {
                    // audio metadata, wordboundary/sentenceboundary
                    const dataStartIndex = buffer.indexOf(MsEdgeTTS.JSON_XML_DELIM) + MsEdgeTTS.JSON_XML_DELIM.length
                    const data = buffer.subarray(dataStartIndex)

                    this._log("->", message)
                    this._resetSynthesisTimeout(requestId)
                    this._pushMetadata(data, requestId)
                } else if (message.includes(`Path:${messageTypes.AUDIO}`) && m.data instanceof ArrayBuffer) {
                    const dataStartIndex = buffer.indexOf(MsEdgeTTS.AUDIO_DELIM) + MsEdgeTTS.AUDIO_DELIM.length
                    const headers = buffer.subarray(0, dataStartIndex).toString()
                    const data = buffer.subarray(dataStartIndex)

                    this._log("->", headers)
                    this._resetSynthesisTimeout(requestId)
                    this._pushAudioData(data, requestId)
                } else {
                    this._log("->", "UNKNOWN MESSAGE", message)
                }
            }
            ws.onclose = () => {
                connecting = false
                clearTimeout(connectionTimeout)
                reject(new Error("Edge TTS connection closed before initialization completed."))
                this._log("disconnected after:", (Date.now() - this._startTime) / 1000, "seconds")
                for (const requestId in this._streams) {
                    const stream = this._streams[requestId]
                    if (stream.socket !== ws) continue
                    clearTimeout(stream.timeout)
                    if (stream.turnEnded) {
                        // synthesis finished normally, just close the stream
                        stream.audio.push(null)
                    } else {
                        // socket closed before turn.end: the audio is truncated, so surface it as an
                        // error instead of silently ending the stream as if it were complete
                        stream.audio.destroy(new Error("Stream closed before the synthesis completed (no turn.end received). The audio is likely truncated."))
                    }
                }
            }
            ws.onerror = (event: any) => {
                connecting = false
                clearTimeout(connectionTimeout)
                // Node's `ws` library fires either a native Error or an ErrorEvent wrapping one.
                const underlying = event?.error ?? event
                const message = underlying?.message ?? String(underlying)
                const code = underlying?.code ?? event?.code
                const wrapped = new Error(
                    `Edge TTS WebSocket error: ${message}${code ? ` (code=${code})` : ""}`
                )
                wrapped.cause = underlying
                reject(wrapped)
                for (const stream of Object.values(this._streams)) {
                    if (stream.socket === ws && !stream.turnEnded) stream.audio.destroy(wrapped)
                }
                this._closeSocket(ws)
            }
        }).catch(error => {
            const underlying = error.cause
            const serverTime = typeof underlying?.serverDate === "string" ? Date.parse(underlying.serverDate) : NaN
            if (retryClock && underlying?.statusCode === 403 && Number.isFinite(serverTime)
                && generation === this._clientGeneration && (!deadline || Date.now() < deadline)) {
                MsEdgeTTS._clockOffsetMs = serverTime - Date.now()
                return this._createClient(false, deadline, generation)
            }
            throw error
        })
    }

    private _closeSocket(socket: WebSocket) {
        if (socket.readyState === socket.CLOSED) return
        const terminate = (socket as WebSocket & { terminate?: () => void }).terminate
        if (socket.readyState !== socket.OPEN && terminate) terminate.call(socket)
        else socket.close()
    }

    private _closeRetiredSockets() {
        // ponytail: scans active streams on drain; per-socket counters if this becomes hot at high concurrency.
        this._retiredSockets = this._retiredSockets.filter(socket => {
            if (Object.values(this._streams).some(stream => stream.socket === socket && !stream.turnEnded)) {
                return true
            }
            socket.close()
            return false
        })
    }

    private static generateUUID(): string {
        return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private static async generateSecMsGec(trustedClientToken: string): Promise<string> {
        const ticks = Math.floor((Date.now() + MsEdgeTTS._clockOffsetMs) / 1000) + 11644473600
        const rounded = ticks - (ticks % 300)
        const windowsTicks = rounded * 10000000

        const encoder = new TextEncoder()
        const data = encoder.encode(`${windowsTicks}${trustedClientToken}`)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)

        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
    }

    private async _send(message, requestId?: string, initialSocket?: WebSocket) {
        let socket = initialSocket ?? this._ws
        for (let i = 1; !initialSocket && i <= 3 && socket.readyState !== socket.OPEN; i++) {
            if (requestId && !this._streams[requestId]) return
            if (i == 1) {
                this._startTime = Date.now()
            }
            this._log("connecting: ", i)
            await this._initClient()
            socket = this._ws
        }
        if (requestId) {
            const stream = this._streams[requestId]
            if (!stream || stream.audio.destroyed || stream.turnEnded) return
            stream.socket = socket
        }
        if (socket.readyState !== socket.OPEN) throw new Error("Edge TTS WebSocket is not open.")
        if (requestId) this._resetSynthesisTimeout(requestId)
        if (this._isBrowser) {
            socket.send(message)
            this._log("<-", message)
            return
        }
        await new Promise<void>((resolve, reject) => {
            socket.send(message, (error?: Error) => {
                if (error) return reject(error)
                this._log("<-", message)
                resolve()
            })
        })
    }

    private _resetSynthesisTimeout(requestId: string) {
        const stream = this._streams[requestId]
        if (!stream || stream.audio.destroyed || stream.turnEnded) return
        clearTimeout(stream.timeout)
        if (this._synthesisTimeoutMs) {
            stream.timeout = setTimeout(() => {
                stream.audio.destroy(new Error(`Edge TTS synthesis timed out after ${this._synthesisTimeoutMs} milliseconds without activity.`))
            }, this._synthesisTimeoutMs)
        }
    }

    private _pushAudioData(data: Uint8Array, requestId: string) {
        this._streams[requestId]?.audio.push(data)
    }

    private _pushMetadata(data: Uint8Array, requestId: string) {
        this._streams[requestId]?.metadata?.push(data)
    }

    private _SSMLTemplate(input: string, options: ProsodyOptions = {}): string {
        // in case future updates to the edge API block these elements, we'll be concatenating strings.
        options = {...new ProsodyOptions(), ...options}
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this._metadataOptions.voiceLocale}">
                <voice name="${this._voice}">
                    <prosody pitch="${options.pitch}" rate="${options.rate}" volume="${options.volume}">
                        ${input}
                    </prosody> 
                </voice>
            </speak>`
    }

    /**
     * Fetch the list of voices available in Microsoft Edge.
     * These, however, are not all. The complete list of voices supported by this module [can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support) (neural, standard, and preview).
     */
    getVoices(): Promise<Voice[]> {
        return new Promise((resolve, reject) => {
            axios.get(MsEdgeTTS.VOICES_URL)
                .then((res) => resolve(res.data))
                .catch(reject)
        })
    }

    /**
     * Sets the required information for the speech to be synthesised and inits a new WebSocket connection.
     * Must be called at least once before text can be synthesised.
     * Saved in this instance. Can be called at any time times to update the metadata.
     * Merges specified values into previously provided values.
     *
     * @param voiceName a string with any `ShortName`. A list of all available neural voices can be found [here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#neural-voices). However, it is not limited to neural voices: standard voices can also be used. A list of standard voices can be found [here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices). Changing the voiceName will reset the voiceLocale.
     * @param outputFormat any {@link OUTPUT_FORMAT}
     * @param metadataOptions (optional) {@link MetadataOptions}
     */
    async setMetadata(voiceName: string, outputFormat: OUTPUT_FORMAT, metadataOptions?: MetadataOptions): Promise<void> {
        const oldVoice = this._voice
        const oldOutputFormat = this._outputFormat
        const oldOptions = JSON.stringify(this._metadataOptions)

        this._voice = voiceName
        Object.assign(this._metadataOptions, metadataOptions)
        if (!metadataOptions?.voiceLocale && (!this._metadataOptions.voiceLocale || oldVoice !== this._voice)) {
            const voiceLangMatch = MsEdgeTTS.VOICE_LANG_REGEX.exec(this._voice)
            if (!voiceLangMatch) throw new Error("Could not infer voiceLocale from voiceName, and no voiceLocale was specified!")
            this._metadataOptions.voiceLocale = voiceLangMatch[0]
        }
        this._outputFormat = outputFormat

        const changed = oldVoice !== this._voice
            || oldOutputFormat !== this._outputFormat
            || oldOptions !== JSON.stringify(this._metadataOptions)

        if (!changed && !this._clientInit && this._ws?.readyState === WebSocket.OPEN
            && !this._retiredSockets.includes(this._ws)) {
            return
        }

        // create new client
        this._startTime = Date.now()
        await this._initClient()
    }

    private _metadataCheck() {
        if (!this._ws) throw new Error(
            "Speech synthesis not configured yet. Run setMetadata before calling toStream or toFile.")
    }

    /**
     * Close the WebSocket connection.
     */
    close() {
        this._clientGeneration++
        const sockets = new Set(this._retiredSockets)
        if (this._ws) sockets.add(this._ws)
        this._retiredSockets = []
        for (const stream of Object.values(this._streams)) {
            clearTimeout(stream.timeout)
            if (!stream.turnEnded) {
                stream.audio.destroy(new Error("Stream closed before the synthesis completed (no turn.end received). The audio is likely truncated."))
            }
        }
        sockets.forEach(socket => this._closeSocket(socket))
    }

    /**
     * Writes raw audio synthesised from text to a file. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param dirPath a valid output directory path
     * @param input the input to synthesise
     * @param options (optional) {@link ProsodyOptions}
     @returns {Promise<{audioFilePath: string, metadataFilePath: string | null}>} - a `Promise` with the full filepaths
     */
    toFile(dirPath: string, input: string, options?: ProsodyOptions): Promise<{
        audioFilePath: string,
        metadataFilePath: string | null
    }> {
        return this._rawSSMLRequestToFile(dirPath, this._SSMLTemplate(input, options))
    }

    /**
     * Writes raw audio synthesised from text in real-time to a {@link Readable}. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param input the text to synthesise. Can include SSML elements.
     * @param options (optional) {@link ProsodyOptions}
     @returns {Promise<{audioStream: Readable, metadataStream: Readable | null}>} - a `Promise` with the streams
     */
    toStream(input: string, options?: ProsodyOptions): {
        audioStream: Readable,
        metadataStream: Readable | null,
    } {
        return this._rawSSMLRequest(this._SSMLTemplate(input, options))
    }

    /**
     * Writes raw audio synthesised from text to a file. Has no SSML template. Basic SSML should be provided in the request.
     *
     * @param dirPath a valid output directory path.
     * @param requestSSML the SSML to send. SSML elements required in order to work.
     * @returns {Promise<{audioFilePath: string, metadataFilePath: string | null}>} - a `Promise` with the full filepaths
     */
    rawToFile(dirPath: string, requestSSML: string): Promise<{
        audioFilePath: string,
        metadataFilePath: string | null
    }> {
        return this._rawSSMLRequestToFile(dirPath, requestSSML)
    }

    /**
     * Writes raw audio synthesised from a request in real-time to a {@link Readable}. Has no SSML template. Basic SSML should be provided in the request.
     *
     * @param requestSSML the SSML to send. SSML elements required in order to work.
     @returns {Promise<{audioStream: Readable, metadataStream: Readable | null}>} - a `Promise` with the streams
     */
    rawToStream(requestSSML: string): {
        audioStream: Readable,
        metadataStream: Readable | null,
    } {
        return this._rawSSMLRequest(requestSSML)
    }

    private _hasMetadataBoundaries() {
        return this._metadataOptions.sentenceBoundaryEnabled
            || this._metadataOptions.wordBoundaryEnabled
    }

    private async _rawSSMLRequestToFile(dirPath: string, requestSSML: string): Promise<{
        audioFilePath: string,
        metadataFilePath: string | null,
        requestId: string,
    }> {
        const {audioStream, metadataStream, requestId} = this._rawSSMLRequest(requestSSML)
        const audioFilePath = joinPath(dirPath, "audio." + OUTPUT_EXTENSIONS[this._outputFormat])
        const metadataFilePath = !!metadataStream ? joinPath(dirPath, "metadata.json") : null
        try {
            await Promise.all([
                new Promise((resolve, reject) => {
                    const writableAudioFile = audioStream.pipe(fs.createWriteStream(audioFilePath))
                    // .pipe() doesn't forward source errors to the writable, so a truncated stream
                    // would hang here — watch the audio stream directly and reject on its error
                    audioStream.once("error", (e) => {
                        writableAudioFile.destroy()
                        reject(e)
                    })
                    writableAudioFile.once("close", async () => {
                        if (writableAudioFile.bytesWritten > 0) {
                            resolve(audioFilePath)
                        } else {
                            reject(new Error("No audio data received"))
                            fs.rmSync(audioFilePath, {force: true})
                        }
                    })
                    writableAudioFile.once("error", reject)
                }) as Promise<string>,
                new Promise((resolve, reject) => {
                    if (!metadataFilePath) {
                        return resolve(null)
                    }
                    // get metadata from buffer and combine all MetaData root elements
                    const metadataItems = {Metadata: []}
                    metadataStream.on("data", (chunk: Buffer) => {
                        const chunkObj = JSON.parse(chunk.toString())
                        // .Metadata is an array of objects, just combine them
                        metadataItems.Metadata.push(...chunkObj["Metadata"])
                    })
                    metadataStream.once("close", () => {
                        if (metadataItems.Metadata.length > 0) {
                            // create file if not exists
                            fs.writeFileSync(metadataFilePath, JSON.stringify(metadataItems, null, 2))
                            resolve(metadataFilePath)
                        } else {
                            reject(new Error("No metadata received"))
                            fs.rmSync(metadataFilePath, {force: true})
                        }
                    })
                    metadataStream.once("error", reject)
                }) as Promise<string>,
            ])
            return {audioFilePath, metadataFilePath, requestId}
        } catch (e) {
            audioStream.destroy()
            metadataStream?.destroy()
            throw e
        }
    }

    private static randomHex(bytes: number) {
        const arr = new Uint8Array(bytes);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
    }

    private _rawSSMLRequest(requestSSML: string): {
        audioStream: Readable,
        metadataStream: Readable | null,
        requestId: string
    } {
        this._metadataCheck()
        const requestId = MsEdgeTTS.randomHex(16)
        const request = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:${messageTypes.SSML}${MsEdgeTTS.JSON_XML_DELIM}` + requestSSML.trim()
        // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup
        const self = this
        const audioStream = new Readable({
            read() {
            },
            destroy(error: Error | null, callback: (error: (Error | null)) => void) {
                clearTimeout(self._streams[requestId]?.timeout)
                delete self._streams[requestId]
                self._closeRetiredSockets()
                callback(error)
            },
        })

        const metadataStream = this._hasMetadataBoundaries() ? new Readable({
            read() {
            },
        }) : null

        audioStream.on("error", (e) => {
            audioStream.destroy()
            metadataStream?.destroy()
        })
        audioStream.once("close", () => {
            audioStream.destroy()
            metadataStream?.destroy()
        })

        this._streams[requestId] = {
            audio: audioStream,
            metadata: metadataStream,
            turnEnded: false,
        }
        this._send(request, requestId).catch((error) => {
            // Surface _send/reconnect failures on the audio stream (consistent with #35)
            // instead of an unhandled rejection that crashes the host process.
            this._streams[requestId]?.audio.destroy(error)
        })
        return {audioStream, metadataStream, requestId}
    }

}
