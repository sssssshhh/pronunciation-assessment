import type { NextApiRequest, NextApiResponse } from 'next';
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Buffer } from 'buffer';

const subscriptionKey = "09afab133e2440259510550c65aeb40a";
const serviceRegion = "eastus";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            // 요청 본문에서 audio 가져오기
            const base64Audio = req.body.audio;

            // Base64를 Buffer로 변환
            const binaryAudio = Buffer.from(base64Audio, 'base64');

            if (!Buffer.isBuffer(binaryAudio)) {
                throw new Error("Failed to convert audio data to Buffer.");
            }

            // 음성 인식 구성
            const audioConfig = sdk.AudioConfig.fromWavFileInput(binaryAudio);
            const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
            const referenceText = "나는 오늘 학교에 감";
            const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
                referenceText,
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

            // 비동기적으로 음성 인식 처리
            const recognitionPromise = new Promise<void>((resolve, reject) => {
                reco.recognized = (s, e) => {
                    const pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(e.result);
                    recognitionResult.accuracyScore = pronunciation_result.accuracyScore;
                    recognitionResult.fluencyScore = pronunciation_result.fluencyScore;
                    recognitionResult.compScore = pronunciation_result.completenessScore;
                    recognitionResult.prosodyScore = pronunciation_result.pronunciationScore;
                    recognitionResult.text = e.result.text;
                };

                reco.canceled = (s, e) => {
                    if (e.reason === sdk.CancellationReason.Error) {
                        console.error("Cancellation reason: ", e.errorDetails);
                        reject(new Error('An error occurred during the pronunciation assessment process.'));
                    }
                    reco.stopContinuousRecognitionAsync();
                };

                reco.sessionStopped = (s, e) => {
                    console.log('Session stopped, sending result back to client...');
                    reco.stopContinuousRecognitionAsync();
                    reco.close();
                    resolve();
                };

                reco.startContinuousRecognitionAsync(
                    () => { }, // Recognition started
                    (err) => reject(err) // Error during recognition start
                );
            });

            // 음성 인식 결과 기다리기
            await recognitionPromise;
            res.status(200).json(recognitionResult);

        } catch (error) {
            console.error('Error during the process:', error);
            res.status(500).json({ error: 'An error occurred during the pronunciation assessment process.' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
