import type { NextApiRequest, NextApiResponse } from 'next';
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from 'axios';
import Cors from 'cors';

// CORS 미들웨어 초기화
const cors = Cors({
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: '*', // 필요에 따라 특정 도메인만 허용할 수 있습니다.
});

// CORS 미들웨어를 API 핸들러에 적용하는 유틸리티 함수
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
    // CORS 미들웨어 적용
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
            // JSON 형식으로 에러 메시지 반환
            res.status(500).json({ error: 'An error occurred during the pronunciation assessment process.' });
        }
    } else {
        // 잘못된 HTTP 메소드에 대한 응답
        res.status(405).json({ message: 'Method not allowed' });
    }
}
