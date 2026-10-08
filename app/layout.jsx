import './globals.css';

export const metadata = {
  title: 'EggMate 吃蛋記帳',
  description: '早餐吃蛋記帳與分帳助手',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="bg-slate-50 min-h-screen text-slate-800 antialiased">{children}</body>
    </html>
  );
}
