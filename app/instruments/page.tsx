import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

// 서버 컴포넌트: Supabase에 접속해 instruments 테이블 전체를 읽어 온다
async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase.from("instruments").select();

  if (error) {
    return <p>Error loading instruments: {error.message}</p>;
  }

  // 읽어 온 행들을 보기 좋은 JSON 문자열로 출력한다
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}

export default function Instruments() {
  return (
    // 데이터를 기다리는 동안 보여 줄 대체 화면
    <Suspense fallback={<div>Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}
