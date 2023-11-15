import axios from "axios";
import * as stream from "stream";
import {WebSocket} from "ws";
import {randomBytes} from "crypto";
import {OUTPUT_FORMAT} from "./OUTPUT_FORMAT";
import * as fs from "fs";
import {Agent} from "http";
import {PITCH} from "./PITCH";
import {RATE} from "./RATE";
import {VOLUME} from "./VOLUME";

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
    pitch?: PITCH | string = "+0Hz";
    /**
     * The rate to use.
     * Can be any {@link RATE}, or a relative number (0.5), or string with a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,rate,-Indicates%20the%20speaking)
     */
    rate?: RATE | string | number = 1.0;
    /**
     * The volume to use.
     * Can be any {@link VOLUME}, or an absolute number (0, 100), a string with a relative number (+50), or a relative percentage (+50%).
     * [SSML documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#:~:text=Optional-,volume,-Indicates%20the%20volume)
     */
    volume?: VOLUME | string | number = 100.0;
}

export class MsEdgeTTS {
    static OUTPUT_FORMAT = OUTPUT_FORMAT;
    private static TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`;
    private static SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`;
    private static BINARY_DELIM = "Path:audio\r\n";
    private static VOICE_LANG_REGEX = /\w{2}-\w{2}/;
    private readonly _enableLogger;
    private _ws: WebSocket;
    private _voice;
    private _voiceLocale;
    private _outputFormat;
    private _queue: { [key: string]: stream.Readable } = {};
    private _startTime = 0;
    private readonly _agent: Agent;

    private _log(...o: any[]) {
        if (this._enableLogger) {
            console.log(...o)
        }
    }

    /**
     * Create a new `MsEdgeTTS` instance.
     *
     * @param agent (optional) Use a custom http.Agent implementation like [https-proxy-agent](https://github.com/TooTallNate/proxy-agents) or [socks-proxy-agent](https://github.com/TooTallNate/proxy-agents/tree/main/packages/socks-proxy-agent).
     * @param enableLogger=false whether to enable the built-in logger. This logs connections inits, disconnects, and incoming data to the console
     */
    public constructor(agent?: Agent, enableLogger: boolean = false) {
        this._agent = agent;
        this._enableLogger = enableLogger;
    }

    private async _send(message) {
        for (let i = 1; i <= 3 && this._ws.readyState !== this._ws.OPEN; i++) {
            if (i == 1) {
                this._startTime = Date.now();
            }
            this._log("connecting: ", i);
            await this._initClient();
        }
        this._ws.send(message, () => {
            this._log("<- sent message: ", message);
        });
    }

    private _initClient() {
        this._ws = new WebSocket(MsEdgeTTS.SYNTH_URL, {agent: this._agent});
        return new Promise((resolve, reject) => {
            this._ws.on("open", () => {
                this._log("Connected in", (Date.now() - this._startTime) / 1000, "seconds")
                this._send(`Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n
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
                `).then(resolve);
            });
            this._ws.on("message", (m) => {
                    const message = m.toString()
                    const requestId = /X-RequestId:(.*?)\r\n/gm.exec(message)[1];
                    if (message.includes("Path:turn.start")) {
                        // start of turn, ignore
                    } else if (message.includes("Path:turn.end")) {
                        // end of turn, close stream
                        this._queue[requestId].push(null);
                    } else if (message.includes("Path:response")) {
                        // context response, ignore
                    } else if (message.includes("Path:audio")) {
                        if (m instanceof Buffer) {
                            this.cacheAudioData(m, requestId)
                        } else {
                            this._log("UNKNOWN MESSAGE", message);
                        }
                    } else {
                        this._log("UNKNOWN MESSAGE", message);
                    }
                }
            )
            this._ws.on("upgrade", (m) => {
                this._log("upgrade", m)
            })
            this._ws.on("close", () => {
                this._log("disconnected after:", (Date.now() - this._startTime) / 1000, "seconds")
                for (const requestId in this._queue) {
                    this._queue[requestId].push(null);
                }
            })
            this._ws.on("error", function (error) {
                reject("Connect Error: " + error);
            });
        });
    }

    private cacheAudioData(m: Buffer, requestId: string) {
        const index = m.indexOf(MsEdgeTTS.BINARY_DELIM) + MsEdgeTTS.BINARY_DELIM.length;
        const audioData = m.slice(index, m.length);
        this._queue[requestId].push(audioData);
        this._log("receive audio chunk size: ", audioData?.length)
    }

    private _SSMLTemplate(input: string, options: ProsodyOptions = new ProsodyOptions()): string {
        // in case future updates to the edge API block these elements, we'll be concatenating strings.
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this._voiceLocale}">
                <voice name="${this._voice}">
                    <prosody pitch="${options.pitch}" rate="${options.rate}" volume="${options.volume}">
                        ${input}
                    </prosody> 
                </voice>
            </speak>`;
    }

    /**
     * Fetch the list of voices available in Microsoft Edge.
     * These, however, are not all. The complete list of voices supported by this module [can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support) (neural, standard, and preview).
     */
    getVoices(): Promise<Voice[]> {
        return new Promise((resolve, reject) => {
            axios.get(MsEdgeTTS.VOICES_URL)
                .then((res) => resolve(res.data))
                .catch(reject);
        });
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
        const oldVoice = this._voice;
        const oldVoiceLocale = this._voiceLocale;
        const oldOutputFormat = this._outputFormat;

        this._voice = voiceName;
        this._voiceLocale = voiceLocale;
        if (!this._voiceLocale) {
            const voiceLangMatch = MsEdgeTTS.VOICE_LANG_REGEX.exec(this._voice);
            if (!voiceLangMatch) throw new Error("Could not infer voiceLocale from voiceName!");
            this._voiceLocale = voiceLangMatch[0];
        }
        this._outputFormat = outputFormat;

        const changed = oldVoice !== this._voice
            || oldVoiceLocale !== this._voiceLocale
            || oldOutputFormat !== this._outputFormat;

        // create new client
        if (changed || this._ws.readyState !== this._ws.OPEN) {
            this._startTime = Date.now()
            await this._initClient();
        }
    }

    private _metadataCheck() {
        if (!this._ws) throw new Error(
            "Speech synthesis not configured yet. Run setMetadata before calling toStream or toFile.");
    }

    /**
     * Close the WebSocket connection.
     */
    close() {
        this._ws.close();
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
        return this._rawSSMLRequestToFile(path, this._SSMLTemplate(input, options));
    }

    /**
     * Writes raw audio synthesised from text in real-time to a {@link stream.Readable}. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param input the text to synthesise. Can include SSML elements.
     * @param options (optional) {@link ProsodyOptions}
     * @returns {stream.Readable} - a `stream.Readable` with the audio data
     */
    toStream(input, options?: ProsodyOptions): stream.Readable {
        return this._rawSSMLRequest(this._SSMLTemplate(input, options));
    }

    /**
     * Writes raw audio synthesised from text to a file. Has no SSML template. Basic SSML should be provided in the request.
     *
     * @param path a valid output path, including a filename and file extension.
     * @param requestSSML the SSML to send. SSML elements required in order to work.
     * @returns {Promise<string>} - a `Promise` with the full filepath
     */
    rawToFile(path: string, requestSSML: string): Promise<string> {
        return this._rawSSMLRequestToFile(path, requestSSML);
    }

    /**
     * Writes raw audio synthesised from a request in real-time to a {@link stream.Readable}. Has no SSML template. Basic SSML should be provided in the request.
     *
     * @param requestSSML the SSML to send. SSML elements required in order to work.
     * @returns {stream.Readable} - a `stream.Readable` with the audio data
     */
    rawToStream(requestSSML): stream.Readable {
        return this._rawSSMLRequest(requestSSML);
    }

    private _rawSSMLRequestToFile(path: string, requestSSML: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const stream = this._rawSSMLRequest(requestSSML);
            const chunks = [];

            stream.on("data", (data) => chunks.push(data));

            stream.once("close", async () => {
                if (Object.keys(this._queue).length > 0 && chunks.length === 0) {
                    reject("No audio data received");
                }
                const output = fs.createWriteStream(path);
                while (chunks.length > 0) {
                    await new Promise((resolve) => output.write(chunks.shift(), resolve));
                }
                resolve(path);
            });
        });
    }

    private _rawSSMLRequest(requestSSML): stream.Readable {
        this._metadataCheck();

        const requestId = randomBytes(16).toString("hex");
        const request = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n
                ` + requestSSML.trim();
        // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup
        const readable = new stream.Readable({
            read() {
            },
        });
        this._queue[requestId] = readable;
        this._send(request).then();
        return readable;
    }

}