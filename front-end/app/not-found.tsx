'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col justify-center items-center p-8 bg-muted text-foreground font-sans">
      <h1 className="text-[4rem] mb-4 font-bold">404</h1>
      <h2 className="text-[1.8rem] mb-6">Página não encontrada</h2>
      <p className="mb-8 max-w-100 text-center">
        A página que você está tentando acessar não existe ou foi removida.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-red-600 text-white rounded-md font-semibold shadow-[0_4px_6px_rgba(220,38,38,0.5)] transition-colors duration-300 hover:bg-[#991b1b]"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}