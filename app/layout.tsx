import './globals.css';
import { Vazirmatn } from 'next/font/google';

const vazir = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-vazirmatn',
});

export const metadata = {
  title: 'V•Media Form',
  description: 'Brand Brief Form',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="bg-[#0a0a0a] text-white font-[var(--font-vazirmatn)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
