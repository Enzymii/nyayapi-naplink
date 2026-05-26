import tencentcloud from 'tencentcloud-sdk-nodejs-ocr';

import { CONFIG } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import type { OcrTextDetection } from './parser.js';

const OcrClient = tencentcloud.ocr.v20181119.Client;

let ocrClient: InstanceType<typeof OcrClient> | null = null;

function getOcrClient(): InstanceType<typeof OcrClient> {
  if (!ocrClient) {
    ocrClient = new OcrClient({
      credential: {
        secretId: CONFIG.tencentOcr.secretId,
        secretKey: CONFIG.tencentOcr.secretKey,
      },
      profile: {
        signMethod: 'TC3-HMAC-SHA256',
        httpProfile: {
          reqMethod: 'POST',
          reqTimeout: 30,
        },
      },
    });
  }

  return ocrClient;
}

export async function recognizeImageUrl(
  imageUrl: string,
): Promise<OcrTextDetection[]> {
  const client = getOcrClient();
  const response = await client.GeneralBasicOCR({ ImageUrl: imageUrl });

  logger.debug('OCR 识别完成', {
    imageUrl,
    count: response.TextDetections?.length ?? 0,
  });

  return (response.TextDetections ?? []) as OcrTextDetection[];
}
