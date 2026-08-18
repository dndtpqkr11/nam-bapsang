import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '남의 반찬 | 15분 맞춤형 OTT 플레이리스트 공유',
  description: '식사 시간(약 15분)에 딱 맞춘 요약 영상 플레이리스트 공유 및 소셜 시청 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
