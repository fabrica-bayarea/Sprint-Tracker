'use client';

export default function Error({ reset }: { reset: () => void }) {

  return (
    <div className="h-screen flex flex-col justify-center items-center text-center">
      <h1 className="text-[4rem] mb-4 font-bold">Erro inesperado</h1>
      <p className="text-[1.5rem] mb-4">Ocorreu um erro. Tente recarregar a página.</p>
      <button 
        onClick={() => reset()} 
        className="px-6 py-3 bg-red-600 text-white rounded-md font-semibold border-none cursor-pointer shadow-[0_4px_6px_rgba(220,38,38,0.5)] transition-colors duration-300 hover:bg-[#991b1b]"
      >
        Tentar novamente
      </button>
    </div>
  );
}