# TalkThermo v3

> 대화 온도 체크 & 복기 코치

Next.js 14(App Router) 기반의 커뮤니케이션 코칭 웹앱입니다.

## 주요 기능
- 입력 3모드: **텍스트 / 캡쳐 OCR / 음성 STT**
- 분석 결과: 2~3문장 요약, 톤 점수(0~100), 오해 포인트 TOP3, 갈등 신호 태그, 답장 제안 3종
- 2단계 파이프라인: **NORMALIZE → ANALYZE**
- 패턴 대시보드: tone 추세(Line), conflict tag 빈도(Bar), 제안 스타일 분포(Pie)
- 저장 기본 OFF + Save ON이어도 **메타데이터만 저장**

## Privacy 보장
- 기본값: 저장 OFF
- 원문 대화 텍스트는 서버/클라이언트 어디에도 저장하지 않음
- Save ON일 때 저장 항목: toneScore, toneLabel, conflictTags 등 메타데이터
- 결과 내 quote/evidence는 20자 이하로 제한
- `/privacy` 페이지에서 정책을 명시

## 설치 및 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저: http://localhost:3000

## 환경 변수
`.env.local`
```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

## 배포 (Vercel)
1. GitHub 저장소 연결
2. Environment Variables에 `OPENAI_API_KEY`, `OPENAI_MODEL` 등록
3. Deploy

## STT 브라우저 지원
- Web Speech API(`SpeechRecognition`)를 사용합니다.
- 최신 Chrome 계열 브라우저에서 가장 안정적으로 동작합니다.
- 미지원 브라우저에서는 안내 메시지를 표시하고 텍스트 입력으로 대체할 수 있습니다.

## API
### `POST /api/analyze`
```json
{
  "mode": "text|ocr|voice",
  "language": "ko|en",
  "rawText": "...",
  "situation": {
    "relationshipType": "친구",
    "goal": "조율",
    "myEmotion": "혼란",
    "keyMessage": "...",
    "lastMessage": "..."
  },
  "options": {
    "saveEnabled": false,
    "personId": "optional"
  }
}
```

## 주의
- 본 서비스는 치료/진단 목적이 아닌 커뮤니케이션 코칭 도구입니다.
- 자해/위험 표현이 감지되면 일반적인 도움 요청 안내를 우선 제공합니다.
