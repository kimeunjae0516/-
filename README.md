# TalkThermo

대화 온도 체크 & 복기 코치 웹앱 (Next.js 14) 입니다.

## 핵심 기능
- `/analyze` 멀티모달 입력: **텍스트 / 캡쳐(OCR) / 음성(STT)**
- 2단계 분석 파이프라인:
  1) Normalize(정리/구조화)
  2) Analyze(코칭 결과 생성)
- 결과 카드: 요약, 톤 점수(0~100), 오해 포인트, 갈등 신호(가능성), 다음 메시지 3종(soft/clear/short), 신뢰도, 보완 질문
- Privacy-first 기본값:
  - 저장 토글 기본 OFF
  - 저장 ON이어도 **원문 텍스트 저장 금지**
  - 요약/점수/태그/선택 스타일/시각 등 메타데이터만 저장

## 음성 입력 안내
- 브라우저 Web Speech API 기반 (Chrome/Edge 권장)
- 지원 브라우저에서는 실시간 전사가 textarea에 누적됩니다.
- 미지원 브라우저에서는 안내 메시지를 보여주고 수동 입력으로 동작합니다.
- 오디오는 서버 업로드하지 않습니다.

## OCR 입력 안내
- `tesseract.js`를 클라이언트에서 실행합니다.
- ko+eng 인식, 진행률(0~100) 표시
- OCR 후 텍스트 수정 가능
- 보조 버튼:
  - 줄바꿈 정리
  - 화자 라벨 추정
  - 이상한 문자 제거
  - 정리 버튼(로컬 정규화)

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn 스타일 컴포넌트
- Zustand
- Recharts
- OpenAI Chat Completions (서버 라우트)
- zod validation

## 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`
```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

## API: `POST /api/analyze`
입력 예시:
```json
{
  "mode": "text",
  "text": "나: ...\n상대: ...",
  "language": "ko",
  "situation": {
    "relationship": "친구",
    "goal": "조율",
    "myEmotion": "혼란",
    "coreMessage": "...",
    "lastMessage": "..."
  }
}
```

## 안전/주의
- 상대의 속마음을 단정하지 않습니다.
- 본 서비스는 의료/상담 대체 서비스가 아닙니다.
- 자해/폭력 등 위험 신호가 있으면 상세 묘사 대신 전문가 도움을 권합니다.
