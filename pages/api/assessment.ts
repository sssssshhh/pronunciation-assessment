import type { NextApiRequest, NextApiResponse } from 'next';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import { promisify } from 'util';

// Formidable의 'parse' 메서드에서 반환되는 타입 정의
interface FormData {
    fields: { [key: string]: any };
    files: { [key: string]: File | File[] };
}

const subscriptionKey = '09afab133e2440259510550c65aeb40a';
const serviceRegion = 'eastus';

// formidable의 'parse' 함수를 Promise로 변환
const parseForm = promisify((req: NextApiRequest, callback: (err: any, fields: any, files: any) => void) => {
    const form = new IncomingForm();
    form.parse(req, callback);
});

export const config = {
    api: {
        bodyParser: false, // Next.js의 기본 bodyParser를 비활성화합니다.
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            console.log(req);
            const { files } = await parseForm(req) as FormData;
            console.log("file", files);
            const audioFile = files.audio as File;

            if (!audioFile) {
                throw new Error('Audio file not found.');
            }
            console.log("audioFile");
            const audioPath = audioFile.filepath;
            console.log("binaryAudio");
            // 오디오 파일을 읽어서 Buffer로 변환
            const binaryAudio = fs.readFileSync(audioPath);

            if (binaryAudio.length < 44 || binaryAudio.toString('ascii', 0, 4) !== 'RIFF') {
                throw new Error('Invalid WAV file.');
            }
            console.log("audioConfig");
            // 음성 인식 구성
            const audioConfig = sdk.AudioConfig.fromWavFileInput(binaryAudio);
            const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
            const referenceText = '나는 오늘 학교에 감';
            const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
                referenceText,
                sdk.PronunciationAssessmentGradingSystem.HundredMark,
                sdk.PronunciationAssessmentGranularity.Phoneme,
                true
            );
            pronunciationAssessmentConfig.enableProsodyAssessment = true;

            speechConfig.speechRecognitionLanguage = 'ko-KR';
            console.log("reco");
            const reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
            pronunciationAssessmentConfig.applyTo(reco);

            const recognitionResult = {
                accuracyScore: 0,
                fluencyScore: 0,
                compScore: 0,
                prosodyScore: 0,
                text: '',
            };
            console.log("recognitionPromise");
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
                        console.error('Cancellation reason: ', e.errorDetails);
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
