import axios from "axios"
import WebSocket from "isomorphic-ws"
import {Buffer} from "buffer/" // slash is important for browser compatibility
import randomBytes from "randombytes"
import {OUTPUT_FORMAT} from "./OUTPUT_FORMAT"
import {Readable} from "stream"
import * as fs from "fs"
import {Agent} from "http"
import {PITCH} from "./PITCH"
import {RATE} from "./RATE"
import {VOLUME} from "./VOLUME"

export type Voice = {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    SuggestedCodec: string;
    FriendlyName: string;
    Status: string;
}

export class ProsodyOptions {
    /**
     * The pitch to use.
     * Can be any {@link PITCH}, or a relative frequency in Hz (+50Hz), a relative semitone (+2st), or a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,pitch,-Indicates%20the%20baseline)
     */
    pitch?: PITCH | string = "+0Hz"
    /**
     * The rate to use.
     * Can be any {@link RATE}, or a relative number (0.5), or string with a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,rate,-Indicates%20the%20speaking)
     */
    rate?: RATE | string | number = 1.0
    /**
     * The volume to use.
     * Can be any {@link VOLUME}, or an absolute number (0, 100), a string with a relative number (+50), or a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,volume,-Indicates%20the%20volume)
     */
    volume?: VOLUME | string | number = 100.0
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

export class MsEdgeTTS {
    static OUTPUT_FORMAT = OUTPUT_FORMAT
    private static TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    private static VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`
    private static SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`
    private static JSON_XML_DELIM = "\r\n\r\n"
    private static AUDIO_DELIM = "Path:audio\r\n"
    private static VOICE_LANG_REGEX = /\w{2}-\w{2}/
    private readonly _enableLogger
    private readonly _isBrowser: boolean
    private _ws: WebSocket
    private _voice
    private _voiceLocale
    private _outputFormat
    private _streams: { [key: string]: { audio: Readable, metadata: Readable } } = {}
    private _startTime = 0
    private readonly _agent: Agent

    private _log(...o: any[]) {
        if (this._enableLogger) {
            console.log(...o)
        }
    }

    /**
     * Create a new `MsEdgeTTS` instance.
     *
     * @param agent (optional, **NOT SUPPORTED IN BROWSER**) Use a custom http.Agent implementation like [https-proxy-agent](https://github.com/TooTallNate/proxy-agents) or [socks-proxy-agent](https://github.com/TooTallNate/proxy-agents/tree/main/packages/socks-proxy-agent).
     * @param enableLogger=false whether to enable the built-in logger. This logs connections inits, disconnects, and incoming data to the console
     */
    public constructor(agent?: Agent, enableLogger: boolean = false) {
        this._agent = agent
        this._enableLogger = enableLogger
        this._isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined"
    }

    private async _send(message) {
        for (let i = 1; i <= 3 && this._ws.readyState !== this._ws.OPEN; i++) {
            if (i == 1) {
                this._startTime = Date.now()
            }
            this._log("connecting: ", i)
            await this._initClient()
        }
        this._ws.send(message, () => {
            this._log("<-", message)
        })
    }

    private _initClient() {
        this._ws = this._isBrowser
            ? new WebSocket(MsEdgeTTS.SYNTH_URL)
            : new WebSocket(MsEdgeTTS.SYNTH_URL, {agent: this._agent})

        this._ws.binaryType = "arraybuffer"
        return new Promise((resolve, reject) => {
            this._ws.onopen = () => {
                this._log("Connected in", (Date.now() - this._startTime) / 1000, "seconds")
                this._send(`Content-Type:application/json; charset=utf-8\r\nPath:${messageTypes.SPEECH_CONFIG}${MsEdgeTTS.JSON_XML_DELIM}
                    {
                        "context": {
                            "synthesis": {
                                "audio": {
                                    "metadataoptions": {
                                        "sentenceBoundaryEnabled": "false",
                                        "wordBoundaryEnabled": "false"
                                    },
                                    "outputFormat": "${this._outputFormat}" 
                                }
                            }
                        }
                    }
                `).then(resolve)
            }
            this._ws.onmessage = (m) => {
                const buffer = Buffer.from(m.data as ArrayBuffer)
                const message = buffer.toString()

                const requestId = /X-RequestId:(.*?)\r\n/gm.exec(message)[1]

                if (message.includes(`Path:${messageTypes.TURN_START}`)) {
                    // start of turn, ignore
                    this._log("->", message)
                } else if (message.includes(`Path:${messageTypes.TURN_END}`)) {
                    // end of turn, close stream
                    this._log("->", message)
                    this._streams[requestId].audio.push(null)
                } else if (message.includes(`Path:${messageTypes.RESPONSE}`)) {
                    // context response, ignore
                    this._log("->", message)
                } else if (message.includes(`Path:${messageTypes.AUDIO_METADATA}`)) {
                    // audio metadata, wordboundary/sentenceboundary
                    const dataStartIndex = buffer.indexOf(MsEdgeTTS.JSON_XML_DELIM) + MsEdgeTTS.JSON_XML_DELIM.length
                    const data = buffer.subarray(dataStartIndex)

                    this._log("->", message)
                    this._pushMetadata(data, requestId)
                } else if (message.includes(`Path:${messageTypes.AUDIO}`) && m.data instanceof ArrayBuffer) {
                    const dataStartIndex = buffer.indexOf(MsEdgeTTS.AUDIO_DELIM) + MsEdgeTTS.AUDIO_DELIM.length
                    const headers = buffer.subarray(0, dataStartIndex).toString()
                    const data = buffer.subarray(dataStartIndex)

                    this._log("->", headers)
                    this._pushAudioData(data, requestId)
                } else {
                    this._log("->", "UNKNOWN MESSAGE", message)
                }
            }
            this._ws.onclose = () => {
                this._log("disconnected after:", (Date.now() - this._startTime) / 1000, "seconds")
                for (const requestId in this._streams) {
                    this._streams[requestId].audio.push(null)
                }
            }
            this._ws.onerror = function (error) {
                reject("Connect Error: " + JSON.stringify(error, null, 2))
            }
        })
    }

    private _pushAudioData(data: Uint8Array, requestId: string) {
        this._streams[requestId].audio.push(data)
    }

    private _pushMetadata(data: Uint8Array, requestId: string) {
        this._streams[requestId].metadata.push(data)
    }

    private _SSMLTemplate(input: string, options: ProsodyOptions = {}): string {
        // in case future updates to the edge API block these elements, we'll be concatenating strings.
        options = {...new ProsodyOptions(), ...options}
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this._voiceLocale}">
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
     *
     * @param voiceName a string with any `ShortName`. A list of all available neural voices can be found [here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#neural-voices). However, it is not limited to neural voices: standard voices can also be used. A list of standard voices can be found [here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices)
     * @param outputFormat any {@link OUTPUT_FORMAT}
     * @param voiceLocale (optional) any voice locale that is supported by the voice. See the list of all voices for compatibility. If not provided, the locale will be inferred from the `voiceName`
     */
    async setMetadata(voiceName: string, outputFormat: OUTPUT_FORMAT, voiceLocale?: string) {
        const oldVoice = this._voice
        const oldVoiceLocale = this._voiceLocale
        const oldOutputFormat = this._outputFormat

        this._voice = voiceName
        this._voiceLocale = voiceLocale
        if (!this._voiceLocale) {
            const voiceLangMatch = MsEdgeTTS.VOICE_LANG_REGEX.exec(this._voice)
            if (!voiceLangMatch) throw new Error("Could not infer voiceLocale from voiceName!")
            this._voiceLocale = voiceLangMatch[0]
        }
        this._outputFormat = outputFormat

        const changed = oldVoice !== this._voice
            || oldVoiceLocale !== this._voiceLocale
            || oldOutputFormat !== this._outputFormat

        // create new client
        if (changed || this._ws.readyState !== this._ws.OPEN) {
            this._startTime = Date.now()
            await this._initClient()
        }
    }

    private _metadataCheck() {
        if (!this._ws) throw new Error(
            "Speech synthesis not configured yet. Run setMetadata before calling toStream or toFile.")
    }

    /**
     * Close the WebSocket connection.
     */
    close() {
        this._ws.close()
    }

    /**
     * Writes raw audio synthesised from text to a file. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param path a valid output path, including a filename and file extension.
     * @param input the input to synthesise
     * @param options (optional) {@link ProsodyOptions}
     * @returns {Promise<string>} - a `Promise` with the full filepath
     */
    toFile(path: string, input: string, options?: ProsodyOptions): Promise<string> {
        return this._rawSSMLRequestToFile(path, this._SSMLTemplate(input, options))
    }

    /**
     * Writes raw audio synthesised from text in real-time to a {@link Readable}. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param input the text to synthesise. Can include SSML elements.
     * @param options (optional) {@link ProsodyOptions}
     * @returns {Readable} - a `stream.Readable` with the audio data
     */
    toStream(input: string, options?: ProsodyOptions): Readable {
        const {audioStream} = this._rawSSMLRequest(this._SSMLTemplate(input, options))
        return audioStream
    }

    /**
     * Writes raw audio synthesised from text to a file. Has no SSML template. Basic SSML should be provided in the request.
     *
     * @param path a valid output path, including a filename and file extension.
     * @param requestSSML the SSML to send. SSML elements required in order to work.
     * @returns {Promise<string>} - a `Promise` with the full filepath
     */
    rawToFile(path: string, requestSSML: string): Promise<string> {
        return this._rawSSMLRequestToFile(path, requestSSML)
    }

    /**
     * Writes raw audio synthesised from a request in real-time to a {@link Readable}. Has no SSML template. Basic SSML should be provided in the request.
     *
     * @param requestSSML the SSML to send. SSML elements required in order to work.
     * @returns {Readable} - a `stream.Readable` with the audio data
     */
    rawToStream(requestSSML: string): Readable {
        const {audioStream} = this._rawSSMLRequest(requestSSML)
        return audioStream
    }

    private _rawSSMLRequestToFile(path: string, requestSSML: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const {audioStream, requestId} = this._rawSSMLRequest(requestSSML)

            const writableFile = audioStream.pipe(fs.createWriteStream(path))

            writableFile.once("close", async () => {
                if (writableFile.bytesWritten > 0) {
                    resolve(path)
                } else {
                    fs.unlinkSync(path)
                    reject("No audio data received")
                }
            })

            audioStream.on("error", (e) => {
                audioStream.destroy()
                reject(e)
            })
        })
    }

    private _rawSSMLRequest(requestSSML: string): { audioStream: Readable, metadataStream: Readable, requestId: string } {
        this._metadataCheck()

        const requestId = randomBytes(16).toString("hex")
        const request = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:${messageTypes.SSML}${MsEdgeTTS.JSON_XML_DELIM}` + requestSSML.trim()
        // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup
        const self = this
        const audioStream = new Readable({
            read() {
            },
            destroy(error: Error | null, callback: (error: (Error | null)) => void) {
                delete self._streams[requestId]
                callback(error)
            },
        })
        const metadataStream = new Readable({
            read() {
            },
        })
        audioStream.once("close", () => {
            audioStream.destroy()
            metadataStream.destroy()
        })

        this._streams[requestId] = {
            audio: audioStream,
            metadata: metadataStream,
        }
        this._send(request).then()
        return {audioStream, metadataStream, requestId}
    }

}