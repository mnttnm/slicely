import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Link href="/your-pdfs" className="bg-blue-500 text-white p-2 rounded-md">See your PDFs</Link>
    </div>
  );
}
