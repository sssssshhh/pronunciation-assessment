import type { NextApiRequest, NextApiResponse } from 'next';
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from 'axios';
import Cors from 'cors';

const cors = Cors({
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: '*',
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

const subscriptionKey = "09afab133e2440259510550c65aeb40a";
const serviceRegion = "eastus";
const fileUrl = "https://bandy-contents.s3.ap-northeast-1.amazonaws.com/test.wav"; // S3 URL

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await runMiddleware(req, res, cors);

    if (req.method === 'POST') {
        try {
            console.log('Fetching audio file from S3...');
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const audioBuffer = response.data;

            console.log('Audio file fetched successfully. Preparing recognition...');

            const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
            const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
            const reference_text = "나는 오늘 학교에 감";
            const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
                reference_text,
                sdk.PronunciationAssessmentGradingSystem.HundredMark,
                sdk.PronunciationAssessmentGranularity.Phoneme,
                true
            );
            pronunciationAssessmentConfig.enableProsodyAssessment = true;

            speechConfig.speechRecognitionLanguage = "ko-KR";

            const reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
            pronunciationAssessmentConfig.applyTo(reco);

            const recognitionResult = {
                accuracyScore: 0,
                fluencyScore: 0,
                compScore: 0,
                prosodyScore: 0,
                text: "",
            };

            reco.recognized = function (s, e) {
                const pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(e.result);
                recognitionResult.accuracyScore = pronunciation_result.accuracyScore;
                recognitionResult.fluencyScore = pronunciation_result.fluencyScore;
                recognitionResult.compScore = pronunciation_result.completenessScore;
                recognitionResult.prosodyScore = pronunciation_result.pronunciationScore;
                recognitionResult.text = e.result.text;

                console.log('Recognition result:', recognitionResult);
            };

            reco.canceled = function (s, e) {
                if (e.reason === sdk.CancellationReason.Error) {
                    console.error("Cancellation reason: ", e.errorDetails);
                }
                reco.stopContinuousRecognitionAsync();
            };

            reco.sessionStopped = function (s, e) {
                console.log('Session stopped, sending result back to client...');
                reco.stopContinuousRecognitionAsync();
                reco.close();
                res.status(200).json(recognitionResult);
            };

            // Start the recognition process
            console.log('Starting recognition process...');
            await new Promise<void>((resolve, reject) => {
                reco.startContinuousRecognitionAsync(
                    () => resolve(), // Resolve promise when recognition starts
                    (err) => reject(err) // Reject promise if there is an error
                );
            });

        } catch (error) {
            console.error('Error during the process:', error);
            res.status(500).json({ error: 'An error occurred during the pronunciation assessment process.' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
