// import type { NextApiRequest, NextApiResponse } from 'next';
// import * as sdk from "microsoft-cognitiveservices-speech-sdk";
// import * as fs from 'fs';

// const subscriptionKey = "09afab133e2440259510550c65aeb40a";
// const serviceRegion = "eastus";
// const filename = "/Users/soo/Downloads/git/pronunciation-assessment/anglais.wav"; // 16000 Hz, Mono

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'POST') {
//         const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(filename));
//         const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//         const reference_text = "나는 오늘 학교에 감";
//         const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
//             reference_text,
//             sdk.PronunciationAssessmentGradingSystem.HundredMark,
//             sdk.PronunciationAssessmentGranularity.Phoneme,
//             true
//         );
//         pronunciationAssessmentConfig.enableProsodyAssessment = true;

//         speechConfig.speechRecognitionLanguage = "ko-KR";

//         // create the speech recognizer.
//         const reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
//         pronunciationAssessmentConfig.applyTo(reco);

//         const scoreNumber = {
//             accuracyScore: 0,
//             fluencyScore: 0,
//             compScore: 0,
//             prosodyScore: 0,
//         };
//         const allWords = [];
//         var currentText = [];
//         var startOffset = 0;
//         var recognizedWords = [];
//         var fluencyScores = [];
//         var prosodyScores = [];
//         var durations = [];
//         var jo = {};

//         // Before beginning speech recognition, setup the callbacks to be invoked when an event occurs.

//         // The event recognizing signals that an intermediate recognition result is received.
//         // You will receive one or more recognizing events as a speech phrase is recognized, with each containing
//         // more recognized speech. The event will contain the text for the recognition since the last phrase was recognized.
//         reco.recognizing = function (s, e) {
//             var str = "(recognizing) Reason: " + sdk.ResultReason[e.result.reason] + " Text: " + e.result.text;
//             console.log(str);
//         };

//         // The event recognized signals that a final recognition result is received.
//         // This is the final event that a phrase has been recognized.
//         // For continuous recognition, you will get one recognized event for each phrase recognized.
//         reco.recognized = function (s, e) {
//             console.log("pronunciation assessment for: ", e.result.text);
//             var pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(e.result);
//             console.log(pronunciation_result.detailResult);
//             console.log(" Accuracy score: ", pronunciation_result.accuracyScore, '\n',
//                 "pronunciation score: ", pronunciation_result.pronunciationScore, '\n',
//                 "completeness score : ", pronunciation_result.completenessScore, '\n',
//                 "fluency score: ", pronunciation_result.fluencyScore
//             );
//         };

//         // The event signals that the service has stopped processing speech.
//         // https://docs.microsoft.com/javascript/api/microsoft-cognitiveservices-speech-sdk/speechrecognitioncanceledeventargs?view=azure-node-latest
//         // This can happen for two broad classes of reasons.
//         // 1. An error is encountered.
//         //    In this case the .errorDetails property will contain a textual representation of the error.
//         // 2. Speech was detected to have ended.
//         //    This can be caused by the end of the specified file being reached, or ~20 seconds of silence from a microphone input.
//         reco.canceled = function (s, e) {
//             if (e.reason === sdk.CancellationReason.Error) {
//                 var str = "(cancel) Reason: " + sdk.CancellationReason[e.reason] + ": " + e.errorDetails;
//                 console.log(str);
//             }
//             reco.stopContinuousRecognitionAsync();
//         };

//         // Signals that a new session has started with the speech service
//         reco.sessionStarted = function (s, e) { };

//         // Signals the end of a session with the speech service.
//         reco.sessionStopped = function (s, e) {
//             reco.stopContinuousRecognitionAsync();
//             reco.close();
//             //calculateOverallPronunciationScore();
//         };

//         reco.startContinuousRecognitionAsync();
//     }
// }
