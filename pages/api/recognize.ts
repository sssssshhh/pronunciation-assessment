// import type { NextApiRequest, NextApiResponse } from 'next';
// import * as sdk from "microsoft-cognitiveservices-speech-sdk";
// import * as fs from 'fs';

// const subscriptionKey = "09afab133e2440259510550c65aeb40a";
// const serviceRegion = "eastus";
// const filename = "/Users/soo/Downloads/git/pronunciation-assessment/anglais.wav"; // 16000 Hz, Mono

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'POST') {
//         let pushStream = sdk.AudioInputStream.createPushStream();

//         fs.createReadStream(filename).on('data', function (chunk: any) {
//             const arrayBuffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
//             pushStream.write(arrayBuffer);
//         }).on('end', function () {
//             pushStream.close();
//         });

//         console.log("Now recognizing from: " + filename);

//         const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
//         const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//         speechConfig.speechRecognitionLanguage = "en-US";

//         const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

//         try {
//             const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
//                 recognizer.recognizeOnceAsync(
//                     (result) => {
//                         if (result.reason === sdk.ResultReason.RecognizedSpeech) {
//                             resolve(result);
//                             console.log(result);
//                         } else {
//                             reject(new Error(`Recognition failed: ${result.errorDetails}`));
//                         }
//                         recognizer.close();
//                     },
//                     (err) => {
//                         reject(err);
//                         recognizer.close();
//                     }
//                 );
//             });
//             res.status(200).json(result);
//         } catch (error) {
//             console.error("Error recognizing speech: ", error);
//             res.status(500).json({ error: 'Speech recognition failed' });
//         }
//     } else {
//         res.status(405).json({ error: 'Method not allowed' });
//     }
// }
