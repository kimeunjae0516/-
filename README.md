# TalkThermo

대화 온도 체크 & 복기 코치 웹앱 MVP입니다.

## 핵심 특징
- 입력 모드 3가지: 이미지 OCR / 텍스트 복붙 / 상황 설명
- 분석 결과: 요약, 톤 점수, 오해 포인트, 갈등 신호(가능성), 다음 메시지 3종
- 프라이버시 우선: 기본 저장 OFF, 저장 ON 시에도 메타데이터만 로컬 저장
- 패턴 대시보드: 톤 추세 + 갈등 태그 빈도 + 다음 액션 템플릿

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn 스타일 UI 컴포넌트
- Zustand 상태 관리
- Recharts 차트
- OCR: tesseract.js (클라이언트)
- AI: OpenAI API via Route Handler
- Validation: zod

## 실행 방법
1. 의존성 설치
```bash
npm install
```
2. 환경변수 설정
```bash
cp .env.example .env.local
```
`.env.local`:
```bash
OPENAI_API_KEY=your_key
# optional
OPENAI_MODEL=gpt-4o-mini
```
3. 개발 서버 실행
```bash
npm run dev
```
4. 브라우저: `http://localhost:3000`

## API
### `POST /api/analyze`
입력:
```json
{
  "mode": "ocr | paste | situation",
  "text": "...",
  "situation": {
    "relationship": "",
    "goal": "",
    "myEmotion": "",
    "coreMessage": "",
    "lastMessage": ""
  },
  "language": "ko | en",
  "options": {
    "relationshipType": "",
    "goal": "",
    "saveEnabled": false,
    "personId": ""
  }
}
```

## 주의
- 본 서비스는 의료/상담 대체 서비스가 아닙니다.
- 고위험/위기 상황은 전문가 또는 긴급 지원 체계를 이용하세요.
