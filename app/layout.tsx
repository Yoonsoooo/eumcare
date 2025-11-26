import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./index.css";
// import "./globals.css"; // 만약 globals.css 파일이 없다면 이 줄은 지우세요!

// 1. 메타데이터 설정 (사이트 제목 등)
export const metadata: Metadata = {
  title: "EumCare",
  description: "어르신 케어 다이어리 서비스",
};

// 2. 레이아웃 컴포넌트 (여기가 중요!)
// export default function ... 형식이 반드시 있어야 합니다.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
