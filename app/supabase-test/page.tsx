'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<string>('Carregando...');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Tenta buscar dados da tabela 'user' (ou outra tabela existente)
        // Se a tabela não existir, o erro será capturado.
        const { data, error } = await supabase
          .from('user') 
          .select('*')
          .limit(5);

        if (error) {
          setStatus(`Erro: ${error.message}`);
          console.error('Supabase Error:', error);
        } else {
          setStatus('Conectado com sucesso!');
          setData(data);
        }
      } catch (err) {
        setStatus('Erro de conexão/rede');
        console.error(err);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão Supabase</h1>
      <div className={`p-4 rounded ${status.includes('Erro') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        Status: {status}
      </div>
      
      {data && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Dados Recebidos:</h2>
          <pre className="bg-gray-900 text-white p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
