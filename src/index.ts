import axios from "axios";
import * as stream from "stream";
import {client as WebSocketClient} from "websocket";
import * as vader from "vader-sentiment";
import {randomBytes} from "crypto";
import OUTPUT_FORMATS from "./OUTPUT_FORMAT";
import OUTPUT_FORMAT from "./OUTPUT_FORMAT";
import * as fs from "fs";

export class MsEdgeTTS {
    static OUTPUT_FORMATS = OUTPUT_FORMATS;
    private static LOG = false;
    private static TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`;
    private static SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${MsEdgeTTS.TRUSTED_CLIENT_TOKEN}`;
    private static BINARY_DELIM = "Path:audio\r\n";
    private static VOICE_LANG_REGEX = /\w{2}-\w{2}/;
    private _ws;
    private _connection;
    private _voice;
    private _voiceLang;
    private _outputFormat;
    private _queue = {};

    private async _send(message) {
        if (this._ws.readyState !== this._ws.OPEN) await this._ws.connect(MsEdgeTTS.SYNTH_URL);
        this._connection.send(message, () => {
            if (MsEdgeTTS.LOG) console.log("<-", message);
        });
    }

    private _connect() {
        return new Promise((resolve, reject) => {
            this._ws.on("connect", (connection) => {
                this._connection = connection;
                if (MsEdgeTTS.LOG) console.log("connected");

                this._connection.on("close", () => {
                    if (MsEdgeTTS.LOG) console.log("disconnected");
                });

                this._connection.on("message", async (m) => {
                    if (MsEdgeTTS.LOG) console.log("->", m);
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
                `);
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

    /**
     * Fetch the list of voices available in Microsoft Edge.
     * These, however, are not all. The complete list of voices supported by this module [can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#neural-voices).
     */
    getVoices() {
        return new Promise((resolve, reject) => {
            axios.get(MsEdgeTTS.VOICES_URL)
                .then((res) => resolve(res.data))
                .catch(reject);
        });
    }

    /**
     * Sets the required information for the speech to be synthesised and inits a new WebSocket connection.
     *
     * @param voiceName a string with any ShortName. [A list of all available voices can be found here](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#neural-voices). The language is automatically inferred from the voice name.
     * @param outputFormat any MsEdgeTTS.OUTPUT_FORMAT value
     */
    async setMetadata(voiceName: string, outputFormat: OUTPUT_FORMAT) {
        this._voice = voiceName;
        const voiceLangMatch = MsEdgeTTS.VOICE_LANG_REGEX.exec(this._voice);
        if (!voiceLangMatch) throw new Error("Invalid voice format!");
        this._voiceLang = voiceLangMatch[0];
        this._outputFormat = outputFormat;

        this._ws = new WebSocketClient();
        await this._connect();
    }

    /**
     * Write audio synthesised from text to a file.
     *
     * @param path a valid path, including a filename and file extension.
     * @param input the input to synthesise
     */
    toFile(path: string, input: string): Promise<string> {
        return new Promise(async (resolve) => {
            const stream = this.toStream(input);
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

    /**
     * Writes audio synthesised from text directly to a stream.Readable.
     *
     * @param input the text to synthesise. Can include SSML elements.
     */
    toStream(input): stream.Readable {
        if (!this._ws) throw new Error(
            "Speech synthesis not configured yet. Run setMetadata before calling toStream or toFile.");

        const requestId = randomBytes(16).toString("hex");
        // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup
        const request = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n
                <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this._voiceLang}">
                    <voice name="en-US-AriaNeural">
                        ${input}
                    </voice>
                </speak>
            `;
        const readable = new stream.Readable({
            read() {
            },
        });
        this._queue[requestId] = readable;
        this._send(request).then();
        return readable;
    }

}