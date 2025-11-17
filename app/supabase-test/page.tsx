'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseTestPage() {
  const [message, setMessage] = useState('Testando Supabase...');
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    async function test() {
      setMessage('Testando requisição na tabela "user"...');
      setDetails(null);

      try {
        const { data, error, status, statusText, count } = await supabase
          .from('user')
          .select('*', { count: 'exact' });

        if (error) {
          console.error('Supabase error', { error, status, statusText });
          setMessage(`Conectou, mas a query retornou erro: ${error.message}`);
          setDetails(`Status ${status} ${statusText ?? ''}`.trim());
        } else {
          console.log('Supabase data', data);
          setMessage(
            `Conectado ao Supabase! Recebidos ${data?.length ?? 0} registros. Total (count): ${
              count ?? 'n/d'
            }`
          );
          setDetails(JSON.stringify(data, null, 2));
        }
      } catch (err) {
        console.error('Network/Fetch error', err);
        setMessage('Falha de rede/fetch ao chamar o Supabase.');
        setDetails(String(err));
      }
    }

    test();
  }, []);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold">Teste Supabase</h1>
      <p className="text-sm text-slate-600">
        URL configurada: <span className="font-mono">{supabaseUrl ?? '(sem URL)'}</span>
      </p>
      <p>{message}</p>
      {details ? (
        <pre className="rounded-md bg-slate-100 p-3 text-sm text-slate-800 overflow-x-auto">
          {details}
        </pre>
      ) : null}
    </div>
  );
}
