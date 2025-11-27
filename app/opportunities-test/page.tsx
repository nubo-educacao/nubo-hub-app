'use client';

import { useEffect, useState } from 'react';
import { fetchOpportunities, FetchOpportunitiesResult } from '../../lib/services/opportunities';

export default function OpportunitiesTestPage() {
  const [result, setResult] = useState<FetchOpportunitiesResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFetchOpportunities();
  }, []);

  const testFetchOpportunities = async () => {
    setLoading(true);
    const data = await fetchOpportunities(0, 10);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-indigo-400">
          Teste de Integração - Oportunidades do Supabase
        </h1>

        {loading && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Carregando dados do Supabase...</p>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-6">
            {/* Metadados */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-indigo-300">Metadados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-neutral-400 text-sm">Total de Oportunidades</p>
                  <p className="text-2xl font-bold text-white">{result.total}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Página Atual</p>
                  <p className="text-2xl font-bold text-white">{result.page + 1}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Itens por Página</p>
                  <p className="text-2xl font-bold text-white">{result.limit}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Tem Mais?</p>
                  <p className="text-2xl font-bold text-white">{result.hasMore ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              {result.error && (
                <div className="mt-4 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400 font-semibold">Erro:</p>
                  <p className="text-neutral-300">{result.error}</p>
                </div>
              )}
            </div>

            {/* Lista de Oportunidades */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-indigo-300">
                Oportunidades Carregadas ({result.data.length})
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {result.data.map((opp, index) => (
                  <div
                    key={opp.id}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-neutral-500 text-sm">#{index + 1}</span>
                          <h3 className="text-lg font-semibold text-white">{opp.title}</h3>
                        </div>
                        <p className="text-neutral-400 text-sm mb-2">{opp.institution}</p>
                      </div>
                      {opp.cutoff_score && (
                        <span className="bg-amber-900/30 text-amber-400 text-xs font-semibold px-2 py-1 rounded">
                          Nota: {opp.cutoff_score.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-neutral-500">Localização:</span>
                        <p className="text-white">{opp.location}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Tipo de Bolsa:</span>
                        <p className="text-white">{opp.scholarship_type}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Turno:</span>
                        <p className="text-white">{opp.modality}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">ID:</span>
                        <p className="text-white font-mono text-xs truncate">{opp.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* JSON Raw */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-indigo-300">JSON Raw (Primeira Oportunidade)</h2>
              <pre className="bg-black p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(result.data[0], null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={testFetchOpportunities}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                Recarregar Dados
              </button>
              <a
                href="/"
                className="px-6 py-3 border border-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-900 hover:text-white transition-colors font-medium"
              >
                Voltar para Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
