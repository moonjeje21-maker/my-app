# my-app: Next.js + Supabase 연결 (2026-10-27)

## Context

목표: `http://localhost:3000/instruments`를 열면 Supabase `instruments` 테이블의 데이터(violin, viola, cello)가 보이는 Next.js 앱을 만든다.

현재 상태를 점검한 결과:

| 붙여넣은 단계 | 상태 | 근거 |
|---|---|---|
| Supabase 프로젝트 만들기 (database.new) | ✅ 이미 있음 | 대시보드에 `MY-APP` 프로젝트 1개 (ref `qtlopkupterkovynwtnu`, ap-southeast-1). 어제 쓰던 프로젝트는 삭제됨 |
| instruments 테이블 SQL 실행 | ✅ 이미 있음 | REST `GET /rest/v1/instruments` → 200, violin·viola·cello 3건. RLS 읽기 정책까지 적용된 상태 |
| 1. 앱 스캐폴딩 | ❌ 없음 | 홈에 `my-app/` 폴더가 없음 (어제 폴더는 삭제됨). 사용자 결정: **새로 스캐폴딩** |
| 2. `.env.local` | ❌ | 새 프로젝트 URL·publishable key는 대시보드에서 확인함 |
| 3. `app/instruments/page.tsx` | ❌ | |
| 4. `npm run dev` + 확인 | ❌ | 포트 3000 비어 있음 |

따라서 Supabase 쪽은 건드리지 않고(새 프로젝트를 또 만들지 않음), Next.js 앱만 처음부터 만든다.

용어:
- **스캐폴딩(scaffolding)**: 템플릿으로 프로젝트 뼈대 파일을 한 번에 만드는 것.
- **publishable key**: 브라우저에 노출해도 되는 공개 키. 데이터 보호는 테이블의 RLS(행 단위 보안) 정책이 담당한다.
- **`.env.local`**: 비밀 설정값을 두는 파일. 템플릿 `.gitignore`가 git에 올라가지 않게 막는다.
- **proxy.ts**: Next.js 16의 미들웨어. 페이지가 그려지기 전에 모든 요청이 먼저 거치는 코드.

## 단계

### 1. 스캐폴딩 (`/Users/ky.moon`에서)
```
npx create-next-app@latest my-app -e with-supabase
```
- `-e with-supabase` 템플릿이라 TypeScript/Tailwind 질문 없이 바로 생성되고, `npm install`까지 자동 실행된다.
- 템플릿이 `git init`도 해 주므로 `my-app/`은 홈 저장소(`home-config`)와 분리된 별도 저장소가 된다. 홈 `CLAUDE.md`에 이미 그렇게 적혀 있어 수정하지 않는다. (GitHub `nextjs-supabase-app`과의 원격 연결은 이번 범위 밖.)
- Supabase 보안 가이드에 따라 `package.json`의 `@supabase/ssr`·`@supabase/supabase-js`가 `"latest"`로 되어 있으면 설치된 정확한 버전(`npm ls`로 확인)으로 고정한다. 패키지가 모르는 사이 바뀌는 것을 막기 위함.

### 2. `.env.local`
- `my-app/.env.example`을 `.env.local`로 이름 변경 후 두 값을 채운다:
  - `NEXT_PUBLIC_SUPABASE_URL=https://qtlopkupterkovynwtnu.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` 대시보드 **API Keys**의 `default` publishable key (`sb_publishable_…`)
- 비밀 키(`sb_secret_…`)는 쓰지 않는다.

### 3. `lib/supabase/proxy.ts` 한 줄 추가
템플릿은 로그인 안 된 방문자를 `/`, `/login*`, `/auth*` 외 경로에서 `/auth/login`으로 보낸다. 어제도 이 때문에 `/instruments`가 307로 막혔다. 공식 문서 6단계대로 조건을 추가한다:
```ts
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/instruments" &&            // 공개 데이터 페이지: 로그인 없이 허용
    !request.nextUrl.pathname.startsWith("/instruments/")
  ) {
```

### 4. `app/instruments/page.tsx` 새로 만들기
공식 문서 코드 그대로 (주석만 한국어):
```tsx
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

// 서버에서 Supabase에 접속해 instruments 테이블 전체를 읽는다
async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase.from("instruments").select();

  if (error) {
    return <p>Error loading instruments: {error.message}</p>;
  }

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}

export default function Instruments() {
  return (
    <Suspense fallback={<div>Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}
```

### 5. 실행
- `my-app/`에서 `npm run dev` (백그라운드, 포트 3000).

### 6. 계획 파일 저장
- 이 계획을 `my-app/plans/2026-10-27-my-app-supabase-plan.md`로 저장하고 끝나면 완료 상태를 적는다.

## 검증
1. `npx tsc --noEmit` 통과 (타입 오류 없음).
2. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/instruments` → `200` (307이면 3단계 누락).
3. `curl -s http://localhost:3000/instruments | grep -c violin` → 1 이상.
4. Chrome으로 http://localhost:3000/instruments 열어 JSON 3건 스크린샷 확인 ("Error loading instruments" 없어야 함).
5. `git -C ~/my-app status --short`에 `.env.local`이 없어야 함 (키 파일 미추적).

## 하지 않는 것
- Supabase 프로젝트 신규 생성, SQL 재실행 (이미 완료).
- GitHub 저장소 연결·커밋·푸시 (요청 없음).
- 홈 `CLAUDE.md` 수정 (이미 `my-app/` 항목이 있음, 미커밋 상태 그대로 둠).

## 완료 상태 (2026-10-27)

- ✅ 1. `npx create-next-app@latest my-app -e with-supabase` 로 `/Users/ky.moon/my-app` 생성 (next 16.4.3). 템플릿이 `git init`을 하지 않아(홈이 이미 git 저장소라서) `git init -b main`을 직접 실행해 별도 저장소로 만듦. 아직 커밋은 없음.
  `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.118.0 으로 버전 고정.
- ✅ 2. `.env.local` 작성 (git에서 무시되는 것 확인: `!! .env.local`).
- ✅ 3. `lib/supabase/proxy.ts` 가드에 `/instruments` 공개 조건 추가.
- ✅ 4. `app/instruments/page.tsx` 생성.
- ✅ 5. `npm run dev` 백그라운드 실행 (포트 3000).
- ✅ 검증: `npx tsc --noEmit` 통과, `curl /instruments` → 200 + violin 포함, Chrome에서 JSON 3건 확인.

## 남은 작업

- 없음. 원하면 다음에 GitHub `nextjs-supabase-app` 저장소에 연결(`git remote add origin …`)하고 커밋·푸시할 수 있다.
