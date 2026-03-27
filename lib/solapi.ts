import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'solapi-config.json');

interface SolapiConfig {
  apiKey: string;
  apiSecret: string;
  sender: string;
}

interface SMSResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 설정 파일에서 Solapi 설정 읽기
function getSolapiConfig(): SolapiConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data) as SolapiConfig;

      // 필수 필드 검증
      if (config.apiKey && config.apiSecret && config.sender) {
        console.log('[DEBUG] 모든 필수 필드가 설정됨');
        return config;
      } else {
        console.log('[DEBUG] 필수 필드 누락:', {
          hasApiKey: !!config.apiKey,
          hasApiSecret: !!config.apiSecret,
          hasSender: !!config.sender,
        });
      }
    } else {
      console.log('[DEBUG] 설정 파일이 존재하지 않음');
    }
  } catch (error) {
    console.error('Solapi 설정 파일 읽기 실패:', error);
  }
  return null;
}

// 환경 변수 (fallback)
const API_KEY = process.env.SOLAPI_API_KEY;
const API_SECRET = process.env.SOLAPI_API_SECRET;
const SENDER = process.env.SOLAPI_SENDER;

function generateAuthorization(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString().split('.')[0] + 'Z';
  const salt = crypto.randomBytes(16).toString('hex');
  const hmacData = date + salt;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(hmacData)
    .digest('hex');

  return {
    Authorization: `HMAC-SHA256 ApiKey=${apiKey},Date=${date},Salt=${salt},Signature=${signature}`,
    Date: date,
    Salt: salt,
  };
}

export async function sendSMS(
  phone: string,
  code: string
): Promise<SMSResponse> {
  console.log(phone);
  // 전화번호 형식 검증
  if (!phone || !/^01[0-9]\d{7,8}$/.test(phone)) {
    throw new Error('유효하지 않은 전화번호 형식입니다.');
  }

  // 인증번호 형식 검증
  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error('유효하지 않은 인증번호 형식입니다.');
  }

  // 설정 파일에서 먼저 읽기
  const config = getSolapiConfig();

  let apiKey: string, apiSecret: string, sender: string;

  if (config) {
    // 설정 파일에서 읽은 값 사용
    apiKey = config.apiKey;
    apiSecret = config.apiSecret;
    sender = config.sender;
  } else if (API_KEY && API_SECRET && SENDER) {
    // 환경 변수 사용 (fallback)
    apiKey = API_KEY;
    apiSecret = API_SECRET;
    sender = SENDER;
  } else {
    return {
      success: true,
      message: '개발 모드 - SMS 시뮬레이션',
      data: { phone, code, message: `@ISAID.co.kr #${code}` },
    };
  }

  const {
    Authorization,
    Date: date,
    Salt: salt,
  } = generateAuthorization(apiKey, apiSecret);

  const payload = {
    messages: [
      {
        to: phone,
        from: sender,
        text: `ISAID 회원가입 인증번호입니다.\n` + `${code}`,
      },
    ],
  };

  try {
    const response = await fetch(
      'https://api.solapi.com/messages/v4/send-many',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization,
          Date: date,
          Salt: salt,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Solapi API 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Solapi API 오류: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ SMS 전송 중 오류 발생:', error);
    throw new Error('SMS 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}
