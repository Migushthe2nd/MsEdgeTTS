import axios from "axios";
import * as stream from "stream";
import {client as WebSocketClient} from "websocket";
import {randomBytes} from "crypto";
import {OUTPUT_FORMAT} from "./OUTPUT_FORMAT";
import * as fs from "fs";

export type Voice = {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    SuggestedCodec: string;
    FriendlyName: string;
    Status: string;
}

export class MsEdgeTTS {
    static OUTPUT_FORMAT = OUTPUT_FORMAT;
    private static TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`;
    private static SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`;
    private static BINARY_DELIM = "Path:audio\r\n";
    private static VOICE_LANG_REGEX = /\w{2}-\w{2}/;
    private readonly _enableLogger;
    private _ws;
    private _connection;
    private _voice;
    private _voiceLocale;
    private _outputFormat;
    private _queue = {};

    /**
     * Create a new `MsEdgeTTS` instance.
     *
     * @param enableLogger=false whether to enable the built-in logger. This logs connections inits, disconnects, and incoming data to the console
     */
    public constructor(enableLogger: boolean = false) {
        this._enableLogger = enableLogger;
    }

    private async _send(message) {
        if (this._ws.readyState !== this._ws.OPEN) await this._ws.connect(MsEdgeTTS.SYNTH_URL);
        this._connection.send(message, () => {
            if (this._enableLogger) console.log("<-", message);
        });
    }

    private _connect() {
        return new Promise((resolve, reject) => {
            this._ws.on("connect", (connection) => {
                this._connection = connection;
                if (this._enableLogger) console.log("connected");

                this._connection.on("close", () => {
                    if (this._enableLogger) console.log("disconnected");
                });

                this._connection.on("message", async (m) => {
                    if (this._enableLogger) console.log("->", m);
                    if (m.type === "utf8") {
                        const data = m.utf8Data;
                        const requestId = /X-RequestId:(.*?)\r\n/gm.exec(data)[1];
                        if (data.includes("Path:turn.start")) {
                            // start of turn, ignore
                        } else if (data.includes("Path:turn.end")) {
                            // end of turn, close stream
                            this._queue[requestId].push(null);
                        } else if (data.includes("Path:response")) {
                            // context response, ignore
                        } else {
                            console.log("UNKNOWN MESSAGE", data);
                        }
                    } else if (m.type === "binary") {
                        const data = m.binaryData;
                        const requestId = /X-RequestId:(.*?)\r\n/gm.exec(data)[1];
                        if (data[0] === 0x00 && data[1] === 0x67 && data[2] === 0x58) {
                            // Last (empty) audio fragment
                        } else {
                            const index = data.indexOf(MsEdgeTTS.BINARY_DELIM) + MsEdgeTTS.BINARY_DELIM.length;

                            const audioData = data.slice(index, data.length);
                            this._queue[requestId].push(audioData);
                        }
                    }
                });

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
                `).then();
                setTimeout(() => {
                    resolve(undefined);
                }, 500);
            });

            this._ws.on("connectFailed", function (error) {
                reject("Connect Error: " + error);
            });

            this._ws.connect(MsEdgeTTS.SYNTH_URL);
        });
    }

    private _SSMLTemplate(input: string): string {
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this._voiceLocale}">
                <voice name="${this._voice}">
                    ${input}
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
        this._voice = voiceName;
        this._voiceLocale = voiceLocale;
        if (!this._voiceLocale) {
            const voiceLangMatch = MsEdgeTTS.VOICE_LANG_REGEX.exec(this._voice);
            if (!voiceLangMatch) throw new Error("Could not infer voiceLocale from voiceName!");
            this._voiceLocale = voiceLangMatch[0];
        }
        this._outputFormat = outputFormat;

        this._ws = new WebSocketClient();
        await this._connect();
    }

    private _metadataCheck() {
        if (!this._ws) throw new Error(
            "Speech synthesis not configured yet. Run setMetadata before calling toStream or toFile.");
    }

    /**
     * Writes raw audio synthesised from text to a file. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param path a valid output path, including a filename and file extension.
     * @param input the input to synthesise
     * @returns {Promise<string>} - a `Promise` with the full filepath
     */
    toFile(path: string, input: string): Promise<string> {
        return this._rawSSMLRequestToFile(path, this._SSMLTemplate(input));
    }

    /**
     * Writes raw audio synthesised from text in real-time to a {@link stream.Readable}. Uses a basic {@link _SSMLTemplate SML template}.
     *
     * @param input the text to synthesise. Can include SSML elements.
     */
    toStream(input): stream.Readable {
        return this._rawSSMLRequest(this._SSMLTemplate(input));
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
     */
    rawToStream(requestSSML): stream.Readable {
        return this._rawSSMLRequest(requestSSML);
    }

    private _rawSSMLRequestToFile(path: string, requestSSML: string): Promise<string> {
        return new Promise(async (resolve) => {
            const stream = this._rawSSMLRequest(requestSSML);
            const chunks = [];

            stream.on("data", (data) => chunks.push(data));

            stream.once("close", async () => {
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