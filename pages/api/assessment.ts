import type { NextApiRequest, NextApiResponse } from 'next';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import axios from 'axios';

const subscriptionKey = '09afab133e2440259510550c65aeb40a';
const serviceRegion = 'eastus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        console.log(req.body);
        try {
            const { referenceText } = req.body;
            const { fileName } = req.body;

            if (!referenceText) {
                return res.status(400).json({ error: 'referenceText 파라미터가 필요합니다.' });
            }

            if (!fileName) {
                return res.status(400).json({ error: 'fileName 파라미터가 필요합니다.' });
            }

            const s3Url = `https://bandy-recording.s3.ap-northeast-1.amazonaws.com/${fileName}`;

            const response = await axios.get(s3Url, {
                responseType: 'arraybuffer',
            });

            const audioData = Buffer.from(response.data, 'binary');
            const audioConfig = sdk.AudioConfig.fromWavFileInput(audioData);
            const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
            const reference_text = '안녕하세요';

            const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
                reference_text,
                sdk.PronunciationAssessmentGradingSystem.HundredMark,
                sdk.PronunciationAssessmentGranularity.Phoneme,
                true
            );
            pronunciationAssessmentConfig.enableProsodyAssessment = true;

            speechConfig.speechRecognitionLanguage = 'ko-KR';

            const reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
            pronunciationAssessmentConfig.applyTo(reco);

            reco.recognized = function (s, e) {
                //console.log(res);
                const pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(e.result);
                console.log('Accuracy score: ', pronunciation_result.accuracyScore);
                console.log('Pronunciation score: ', pronunciation_result.pronunciationScore);
                console.log('Completeness score: ', pronunciation_result.completenessScore);
                console.log('Fluency score: ', pronunciation_result.fluencyScore);

                // 비동기 작업이 완료되었으므로 응답을 보냅니다.
                res.status(200).json({
                    accuracyScore: pronunciation_result.accuracyScore,
                    pronunciationScore: pronunciation_result.pronunciationScore,
                    completenessScore: pronunciation_result.completenessScore,
                    fluencyScore: pronunciation_result.fluencyScore,
                });

                reco.stopContinuousRecognitionAsync();
            };

            reco.canceled = function (s, e) {
                if (e.reason === sdk.CancellationReason.Error) {
                    console.error('Cancellation Error:', e.errorDetails);
                    res.status(500).json({ error: e.errorDetails });
                } else {
                    res.status(500).json({ error: 'Recognition was canceled.' });
                }
                reco.stopContinuousRecognitionAsync();
            };

            reco.sessionStopped = function (s, e) {
                reco.stopContinuousRecognitionAsync();
                reco.close();
            };

            reco.startContinuousRecognitionAsync();
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: '발음 평가 중 오류가 발생했습니다.' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
