'use strict';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Check, ChevronRight, GraduationCap, Users, DollarSign, AlertCircle, Info } from 'lucide-react';
import { ConcurrencyTag } from '@/types/concurrency';

interface MatchWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: 'Notas do ENEM', icon: GraduationCap },
  { id: 2, title: 'Cotas', icon: Users },
  { id: 3, title: 'Renda', icon: DollarSign },
];

export default function MatchWizard({ onComplete }: MatchWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
        if (!user) return;
        try {
            // Get Geolocation on Mount
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Wizard Location:", position.coords);
                        setGeoLocation({
                            lat: position.coords.latitude,
                            long: position.coords.longitude
                        });
                    },
                    (err) => console.log("Geolocation denied/error:", err)
                );
            }

            // 1. Load Scores
            const { data: scores } = await supabase
                .from('user_enem_scores')
                .select('*')
                .eq('user_id', user.id);

            // 2. Load Preferences (Quotas & Income & Step)
            const { data: prefs } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            let targetStep = 1;
            
            // Hydrate Scores (Keep for UI Display)
            if (scores && scores.length > 0) {
                const newScores: any = {};
                let hasFullYear = false;
                
                scores.forEach(s => {
                    newScores[s.year] = {
                        linguagens: s.nota_linguagens?.toString().replace('.', ',') || '',
                        humanas: s.nota_ciencias_humanas?.toString().replace('.', ',') || '',
                        natureza: s.nota_ciencias_natureza?.toString().replace('.', ',') || '',
                        matematica: s.nota_matematica?.toString().replace('.', ',') || '',
                        redacao: s.nota_redacao?.toString().replace('.', ',') || '',
                    };
                    
                    if (s.nota_redacao !== null) hasFullYear = true;
                    if (s.nota_linguagens === 0 && s.nota_redacao === 0) {
                        setDidNotTakeEnem(true);
                        hasFullYear = true;
                    }
                });
                setAllScores(newScores);
            }

            // Hydrate Preferences & Determine Step from DB
            if (prefs) {
                // Restore UI state
                if (prefs.quota_types && prefs.quota_types.length > 0) {
                    setSelectedQuotas(prefs.quota_types);
                }
                if (prefs.family_income_per_capita) {
                    // Reverse engineer income fields? 
                    // No easy way to split back to family members, but we can set defaults if needed.
                    // For now, let's assume if they are revisiting, they might need to re-enter income details 
                    // OR we just leave it empty. The user per_capita is saved.
                }

                // [STATE MACHINE LOGIC]
                const step = prefs.registration_step;
                if (step === 'quotas') targetStep = 2;
                else if (step === 'income') targetStep = 3;
                else if (step === 'completed') {
                    onComplete(); // Already done?
                    return; 
                }
                // 'intro' or 'scores' or null -> Step 1
            }
            
            setCurrentStep(targetStep);

        } catch (err) {
            console.error("Error loading wizard data", err);
        } finally {
            setIsLoading(false);
        }
    }
    
    loadData();
  }, [user]);

  // --- STEP 1 STATE: ENEM SCORES ---
  const AVAILABLE_YEARS = ['2023', '2024', '2025'];
  const [selectedYear, setSelectedYear] = useState('2025');
  
  // Store scores per year
  const [allScores, setAllScores] = useState<Record<string, any>>({});
  
  const [didNotTakeEnem, setDidNotTakeEnem] = useState(false);

  // --- STEP 2 STATE: QUOTAS ---
  const [selectedQuotas, setSelectedQuotas] = useState<string[]>([]);
  const QUOTA_OPTIONS = [
    { id: ConcurrencyTag.AMPLA_CONCORRENCIA, label: 'Ampla Concorrência', description: 'Vagas sem critérios específicos de cota.' },
    { id: ConcurrencyTag.ESCOLA_PUBLICA, label: 'Escola Pública', description: 'Para quem cursou todo o ensino médio em escola pública.' },
    { id: ConcurrencyTag.PPI, label: 'PPI (Pretos, Pardos e Indígenas)', description: 'Para estudantes autodeclarados pretos, pardos ou indígenas.' },
    { id: ConcurrencyTag.PRETOS_E_PARDOS, label: 'Pretos e Pardos', description: 'Para estudantes autodeclarados pretos ou pardos.' },
    { id: ConcurrencyTag.INDIGENAS, label: 'Indígenas', description: 'Para estudantes indígenas, conforme critérios específicos do edital.' },
    { id: ConcurrencyTag.QUILOMBOLAS, label: 'Quilombolas', description: 'Para estudantes pertencentes a comunidades quilombolas.' },
    { id: ConcurrencyTag.PCD, label: 'Pessoa com Deficiência (PCD)', description: 'Para pessoas com deficiência, conforme laudo exigido no edital.' },
    { id: ConcurrencyTag.TRANS, label: 'Trans / Travesti', description: 'Para pessoas trans ou travestis, quando previsto pela instituição.' },
    { id: ConcurrencyTag.RURAL, label: 'Rural / Campo', description: 'Para estudantes oriundos de áreas rurais ou do campo.' },
    { id: ConcurrencyTag.AGRICULTURA_FAMILIAR, label: 'Agricultura Familiar', description: 'Para estudantes de famílias que vivem da agricultura familiar.' },
    { id: ConcurrencyTag.REFUGIADOS, label: 'Refugiados', description: 'Para pessoas com status de refugiado reconhecido no Brasil.' },
    { id: ConcurrencyTag.CIGANOS, label: 'Ciganos', description: 'Para estudantes pertencentes a comunidades ciganas.' },
    { id: ConcurrencyTag.AUTISMO, label: 'Autismo', description: 'Para pessoas no espectro autista, quando previsto no edital.' },
    { id: ConcurrencyTag.ALTAS_HABILIDADES, label: 'Altas Habilidades', description: 'Para estudantes com altas habilidades ou superdotação.' },
    { id: ConcurrencyTag.EJA_ENCCEJA, label: 'EJA / ENCCEJA', description: 'Para quem concluiu os estudos pelo EJA ou ENCCEJA.' },
    { id: ConcurrencyTag.PROFESSOR, label: 'Professor da Rede Pública', description: 'Para professores que atuam na rede pública de ensino.' },
    { id: ConcurrencyTag.MILITAR, label: 'Militares e Familiares', description: 'Para policiais, bombeiros, militares ou seus familiares, conforme regras específicas.' },
    { id: ConcurrencyTag.EFA, label: 'Escolas Família Agrícola (EFA)', description: 'Para egressos de Escolas Família Agrícola.' },
    { id: ConcurrencyTag.PRIVACAO_LIBERDADE, label: 'Privação de Liberdade', description: 'Para pessoas em privação de liberdade ou que cumprem medidas socioeducativas.' },
    { id: ConcurrencyTag.PCD_AUDITIVA, label: 'Deficiência Auditiva / Surdos', description: 'Para pessoas com deficiência auditiva, candidatos a cursos como Letras-Libras.' },
    { id: ConcurrencyTag.ESCOLA_PRIVADA_BOLSA_INTEGRAL, label: 'Escola Privada com Bolsa', description: 'Para quem estudou em escola privada com bolsa integral.' },
    { id: ConcurrencyTag.OUTROS_ESPECIFICO, label: 'Outros Critérios Específicos', description: 'Outros critérios de cota específicos não listados acima.' },
  ];
  const [noQuota, setNoQuota] = useState(false);

  // --- STEP 3 STATE: INCOME ---
  // Using 2025 Minimum Wage
  const SALARIO_MINIMO = 1518.00;
  
  const [familyCount, setFamilyCount] = useState<string>('');
  const [memberIncomes, setMemberIncomes] = useState<string[]>([]);
  const [socialBenefits, setSocialBenefits] = useState<string>('');
  const [alimony, setAlimony] = useState<string>('');
  const [noIncomeInfo, setNoIncomeInfo] = useState(false);
  
  // --- LOCATION STATE ---
  const [geoLocation, setGeoLocation] = useState<{lat: number, long: number} | null>(null);

  // --- HANDLERS ---

  const handleScoreChange = (year: string, field: string, value: string) => {
    // Digits and optional comma with up to 2 decimal places
    // e.g., "123", "123,", "123,4", "123,45"
    if (value === '' || /^\d+(,\d{0,2})?$/.test(value)) {
        // Validation for Max Value (1000)
        // Parse "123,45" -> 123.45 for comparison
        const num = Number(value.replace(',', '.'));
        if (value === '' || (!isNaN(num) && num <= 1000)) {
            setAllScores(prev => ({
                ...prev,
                [year]: {
                    ...(prev[year] || { linguagens: '', humanas: '', natureza: '', matematica: '', redacao: '' }),
                    [field]: value
                }
            }));
        }
    }
  };

  const getScore = (year: string, field: string) => {
      return allScores[year]?.[field] || '';
  };

  const toggleQuota = (id: string) => {
    if (noQuota) setNoQuota(false);
    setSelectedQuotas(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const handleNoQuota = () => {
    setNoQuota(!noQuota);
    if (!noQuota) setSelectedQuotas([]);
  };

  const handleFamilyCountChange = (val: string) => {
      setFamilyCount(val);
      const count = parseInt(val);
      if (!isNaN(count) && count > 0) {
          setMemberIncomes(prev => {
              const newIncomes = [...prev];
              // Resize array: trim if smaller, add empty if larger
              if (newIncomes.length > count) {
                  return newIncomes.slice(0, count);
              }
              while (newIncomes.length < count) {
                  newIncomes.push('');
              }
              return newIncomes;
          });
      } else {
          setMemberIncomes([]);
      }
  };

  const handleMemberIncomeChange = (index: number, val: string) => {
      setMemberIncomes(prev => {
          const newIncomes = [...prev];
          newIncomes[index] = val;
          return newIncomes;
      });
  };

  const calculateTotalIncome = () => {
      const incomesSum = memberIncomes.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
      const benefits = parseFloat(socialBenefits) || 0;
      const alim = parseFloat(alimony) || 0;
      return incomesSum + benefits + alim;
  };

  const calculatePerCapita = () => {
      const total = calculateTotalIncome();
      const count = parseInt(familyCount) || 1;
      return (total / count).toFixed(2);
  };

  const calculateMinWages = () => {
      const perCapita = parseFloat(calculatePerCapita());
      return (perCapita / SALARIO_MINIMO).toFixed(2);
  };

  // ... (Update handleNext and persistence logic in next steps manually/separately or merged here)

  // ...

                {/* --- STEP 3: INCOME --- */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="text-center">
                             <h2 className="text-xl font-bold text-[#024F86]">Renda</h2>
                             <p className="text-sm text-gray-500">Para cálculo de Prouni e Fies.</p>
                         </div>
                         
                         <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                             
                             {/* 1. Family Count */}
                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Total de pessoas na casa</label>
                                 <input
                                    type="number"
                                    value={familyCount}
                                    onChange={(e) => handleFamilyCountChange(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-gray-900"
                                    placeholder="Incluindo você"
                                    min="1"
                                 />
                             </div>

                             {/* 2. Dynamic Incomes */}
                             {parseInt(familyCount) > 0 && (
                                 <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                                     <p className="text-xs font-semibold text-gray-400 uppercase">Renda de cada pessoa (Bruta Mensal)</p>
                                     {memberIncomes.map((inc, idx) => (
                                         <div key={idx} className="relative">
                                            <label className="text-[10px] font-medium text-gray-400 absolute -top-1.5 left-2 bg-white px-1">
                                                {idx === 0 ? 'Você' : `Pessoa ${idx + 1}`}
                                            </label>
                                            <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                                            <input
                                                type="number"
                                                value={inc}
                                                onChange={(e) => handleMemberIncomeChange(idx, e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                                placeholder="0.00"
                                            />
                                         </div>
                                     ))}
                                 </div>
                             )}

                             {/* 3. Extra Incomes */}
                             {parseInt(familyCount) > 0 && (
                                <div className="space-y-3 pt-2">
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Benefícios Sociais</label>
                                         <div className="relative">
                                             <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                                             <input
                                                type="number"
                                                value={socialBenefits}
                                                onChange={(e) => setSocialBenefits(e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                                placeholder="Bolsa Família, BPC, etc."
                                             />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pensão Alimentícia</label>
                                         <div className="relative">
                                             <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                                             <input
                                                type="number"
                                                value={alimony}
                                                onChange={(e) => setAlimony(e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                                placeholder="Recebida"
                                             />
                                         </div>
                                     </div>
                                </div>
                             )}

                             {/* 4. Results */}
                             {(parseInt(familyCount) > 0) && (
                                 <div className="bg-[#024F86] text-white p-4 rounded-xl shadow-md text-center animate-in zoom-in-95">
                                     <div className="grid grid-cols-2 gap-4 divide-x divide-blue-400/30">
                                         <div>
                                            <p className="text-[10px] text-blue-100 uppercase font-semibold mb-1">Renda Per Capita</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className="text-sm text-blue-200">R$</span>
                                                <span className="text-2xl font-bold">{calculatePerCapita()}</span>
                                            </div>
                                         </div>
                                         <div>
                                            <p className="text-[10px] text-blue-100 uppercase font-semibold mb-1">Salários Mínimos</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className="text-2xl font-bold">{calculateMinWages()}</span>
                                                <span className="text-sm text-blue-200">SM</span>
                                            </div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                    </div>
                )}

  // --- SUBMIT ---

  const handleNext = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user) throw new Error("Usuário não autenticado");

      if (currentStep === 1) {
        // Save Scores
        if (!didNotTakeEnem) {
            // Check if AT LEAST ONE year is fully filled
            const yearsFilled = Object.entries(allScores).filter(([year, scores]) => {
                const values = Object.values(scores);
                return values.length === 5 && values.every(v => v !== '');
            });

            if (yearsFilled.length === 0) {
               throw new Error("Preencha as notas de pelo menos um ano ou marque 'Não tenho notas'.");
            }

            // Save all filled years
            for (const [year, scores] of yearsFilled) {
                const s = scores as any;
                
                const { error: insertError } = await supabase.from('user_enem_scores').upsert({
                    user_id: user.id,
                    year: parseInt(year),
                    nota_linguagens: parseFloat(s.linguagens.replace(',', '.')),
                    nota_ciencias_humanas: parseFloat(s.humanas.replace(',', '.')),
                    nota_ciencias_natureza: parseFloat(s.natureza.replace(',', '.')),
                    nota_matematica: parseFloat(s.matematica.replace(',', '.')),
                    nota_redacao: parseFloat(s.redacao.replace(',', '.')),
                }, { onConflict: 'user_id, year' });

                if (insertError) throw insertError;
            }

        } else {
             // Save 0s Record for current year to mark as completed/skipped
             const { error: insertError } = await supabase.from('user_enem_scores').upsert({
                user_id: user.id,
                year: new Date().getFullYear(),
                nota_linguagens: 0,
                nota_ciencias_humanas: 0,
                nota_ciencias_natureza: 0,
                nota_matematica: 0,
                nota_redacao: 0,
            }, { onConflict: 'user_id, year' });

            if (insertError) throw insertError;
        }

        // [STATE UPDATE] Finished Scores -> Go to Quotas
        await supabase.from('user_preferences').upsert({
            user_id: user.id,
            registration_step: 'quotas',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        setCurrentStep(2);

      } else if (currentStep === 2) {
        // Save Quotas
        let quotasToSave = noQuota ? [] : selectedQuotas;
        
        const { error: prefError } = await supabase.from('user_preferences').upsert({
            user_id: user.id,
            quota_types: quotasToSave,
            registration_step: 'income', // [STATE UPDATE] Finished Quotas -> Go to Income
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (prefError) throw prefError;
        
        setCurrentStep(3);

      } else if (currentStep === 3) {
        // Save Income and Finish
        // Save Income and Finish
        let perCapita: number | null = null;

        if (!noIncomeInfo) {
            const totalIncome = calculateTotalIncome();
            const peopleVal = parseInt(familyCount);

            if (!familyCount || isNaN(peopleVal) || peopleVal <= 0) {
                throw new Error("Por favor, preencha o número de pessoas.");
            }

            perCapita = totalIncome / peopleVal;
        }

        const { error: incomeError } = await supabase.from('user_preferences').update({
            family_income_per_capita: perCapita,
            registration_step: 'completed', // [STATE UPDATE] DONE
            device_latitude: geoLocation?.lat ?? null,
            device_longitude: geoLocation?.long ?? null,
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id);

        if (incomeError) throw incomeError;

        // ALL DONE
        onComplete();
      }



    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- VALIDATION ---
  const isStepValid = () => {
      if (currentStep === 1) {
          if (didNotTakeEnem) return true;
          // Check if at least one year has 5 scores filled
          return Object.values(allScores).some((yearScores: any) => {
              const values = Object.values(yearScores);
              return values.length === 5 && values.every((v: any) => v !== '');
          });
      }
      if (currentStep === 2) {
          return noQuota || selectedQuotas.length > 0;
      }
      if (currentStep === 3) {
          if (noIncomeInfo) return true;
          const count = parseInt(familyCount);
          return !isNaN(count) && count > 0;
      }
      return false;
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
        
        {/* Progress Bar Header */}
        <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                <span>Passo {currentStep} de 3</span>
                <span className="text-[#024F86]">{STEPS[currentStep - 1].title}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-[#024F86] transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                />
            </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="max-w-xl mx-auto space-y-4">
            
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center text-sm border border-red-100">
                        <AlertCircle size={16} className="mr-2" />
                        {error}
                    </div>
                )}

                {/* --- STEP 1: SCORES --- */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-[#024F86]">Notas do ENEM</h2>
                            <p className="text-sm text-gray-500">Informe suas notas dos últimos anos.</p>
                        </div>
                        
                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm space-y-4">
                            
                            {/* Year Tabs */}
                            <div className="flex p-1 bg-gray-100/50 rounded-xl">
                                {AVAILABLE_YEARS.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => {
                                            setSelectedYear(year);
                                            setDidNotTakeEnem(false);
                                        }}
                                        disabled={didNotTakeEnem}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                            selectedYear === year && !didNotTakeEnem
                                            ? 'bg-white text-[#024F86] shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>

                            <div className={`grid grid-cols-1 gap-3 transition-opacity ${didNotTakeEnem ? 'opacity-30 pointer-events-none' : ''}`}>
                                {['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'].map((field) => (
                                    <div key={field} className="grid grid-cols-3 gap-3 items-center">
                                        <label className="text-xs font-semibold text-gray-500 uppercase col-span-1 text-right mr-2">
                                            {field === 'humanas' ? 'Humanas' : 
                                            field === 'natureza' ? 'Natureza' : 
                                            field === 'matematica' ? 'Matemática' : 
                                            field === 'redacao' ? 'Redação' : 
                                            'Linguagens'}
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0,00"
                                            value={getScore(selectedYear.toString(), field)}
                                            onChange={(e) => handleScoreChange(selectedYear, field, e.target.value)}
                                            className="col-span-2 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="noEnem" 
                                checked={didNotTakeEnem} 
                                onChange={(e) => setDidNotTakeEnem(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#024F86] focus:ring-[#024F86]" 
                            />
                            <label htmlFor="noEnem" className="text-sm font-medium text-gray-500 cursor-pointer">
                                Não tenho notas nestes anos / Não informar
                            </label>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: QUOTAS --- */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center">
                             <h2 className="text-xl font-bold text-[#024F86]">Cotas</h2>
                             <p className="text-sm text-gray-500">Selecione suas categorias.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {QUOTA_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleQuota(opt.id)}
                                    disabled={noQuota}
                                    className={`relative p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                                        selectedQuotas.includes(opt.id) 
                                        ? 'border-[#024F86] bg-[#024F86]/5 shadow-sm' 
                                        : 'border-gray-100 bg-white hover:border-[#024F86]/30'
                                    } ${noQuota ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center w-full min-w-0">
                                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                                            selectedQuotas.includes(opt.id) ? 'border-[#024F86] bg-[#024F86]' : 'border-gray-300'
                                        }`}>
                                            {selectedQuotas.includes(opt.id) && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className={`text-xs font-medium leading-tight mr-2 truncate ${selectedQuotas.includes(opt.id) ? 'text-[#024F86]' : 'text-gray-600'}`}>
                                            {opt.label}
                                        </span>
                                        {opt.description && (
                                            <div className="group relative ml-auto shrink-0">
                                                <Info size={14} className="text-gray-400 hover:text-[#024F86] cursor-help" />
                                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    {opt.description}
                                                    <div className="absolute -bottom-1 right-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-100 mt-4">
                            <input 
                                type="checkbox" 
                                id="noQuota" 
                                checked={noQuota} 
                                onChange={handleNoQuota}
                                className="w-4 h-4 rounded border-gray-300 text-[#024F86] focus:ring-[#024F86]" 
                            />
                            <label htmlFor="noQuota" className="text-sm font-medium text-gray-500 cursor-pointer">
                                Não informar
                            </label>
                        </div>
                    </div>
                )}

                {/* --- STEP 3: INCOME --- */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="text-center">
                             <h2 className="text-xl font-bold text-[#024F86]">Renda</h2>
                             <p className="text-sm text-gray-500">Para cálculo de Prouni e Fies.</p>
                         </div>
                         
                         <div className={`bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar transition-opacity duration-300 ${noIncomeInfo ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                             
                             {/* 1. Family Count */}
                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Total de pessoas na casa</label>
                                 <input
                                    type="number"
                                    value={familyCount}
                                    onChange={(e) => handleFamilyCountChange(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-gray-900"
                                    placeholder="Incluindo você"
                                    min="1"
                                 />
                             </div>

                             {/* 2. Dynamic Incomes */}
                             {parseInt(familyCount) > 0 && (
                                 <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                                     <p className="text-xs font-semibold text-gray-400 uppercase">Renda de cada pessoa (Bruta Mensal)</p>
                                     {memberIncomes.map((inc, idx) => (
                                         <div key={idx} className="relative">
                                            <label className="text-[10px] font-medium text-gray-400 absolute -top-1.5 left-2 bg-white px-1">
                                                {idx === 0 ? 'Você' : `Pessoa ${idx + 1}`}
                                            </label>
                                            <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                                            <input
                                                type="number"
                                                value={inc}
                                                onChange={(e) => handleMemberIncomeChange(idx, e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                                placeholder="0.00"
                                            />
                                         </div>
                                     ))}
                                 </div>
                             )}

                             {/* 3. Extra Incomes */}
                             {parseInt(familyCount) > 0 && (
                                <div className="space-y-3 pt-2">
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Benefícios Sociais</label>
                                         <div className="relative">
                                             <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                                             <input
                                                type="number"
                                                value={socialBenefits}
                                                onChange={(e) => setSocialBenefits(e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                                placeholder="Bolsa Família, BPC, etc."
                                             />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pensão Alimentícia</label>
                                         <div className="relative">
                                             <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">R$</span>
                                             <input
                                                type="number"
                                                value={alimony}
                                                onChange={(e) => setAlimony(e.target.value)}
                                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] outline-none transition-all text-sm text-gray-900"
                                                placeholder="Recebida"
                                             />
                                         </div>
                                     </div>
                                </div>
                             )}

                             {/* 4. Results */}
                             {(parseInt(familyCount) > 0) && (
                                 <div className="bg-[#024F86] text-white p-4 rounded-xl shadow-md text-center animate-in zoom-in-95">
                                     <div className="grid grid-cols-2 gap-4 divide-x divide-blue-400/30">
                                         <div>
                                            <p className="text-[10px] text-blue-100 uppercase font-semibold mb-1">Renda Per Capita</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className="text-sm text-blue-200">R$</span>
                                                <span className="text-2xl font-bold">{calculatePerCapita()}</span>
                                            </div>
                                         </div>
                                         <div>
                                            <p className="text-[10px] text-blue-100 uppercase font-semibold mb-1">Salários Mínimos</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className="text-2xl font-bold">{calculateMinWages()}</span>
                                                <span className="text-sm text-blue-200">SM</span>
                                            </div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                         <div className="flex items-center justify-center space-x-2 pt-2">
                             <input 
                                 type="checkbox" 
                                 id="noIncome" 
                                 checked={noIncomeInfo} 
                                 onChange={(e) => setNoIncomeInfo(e.target.checked)}
                                 className="w-4 h-4 rounded border-gray-300 text-[#024F86] focus:ring-[#024F86]" 
                             />
                             <label htmlFor="noIncome" className="text-sm font-medium text-gray-500 cursor-pointer">
                                 Não informar renda
                             </label>
                         </div>
                    </div>
                )}

                {/* --- ACTION BUTTON inside the flow --- */}
                <div className="pt-2">
                    <button
                        onClick={handleNext}
                        disabled={isLoading || !isStepValid()}
                        className="w-full flex justify-center items-center px-6 py-3.5 bg-[#024F86] text-white rounded-xl font-bold hover:bg-[#023B64] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all shadow-lg shadow-[#024F86]/20 disabled:shadow-none"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                        ) : null}
                        {currentStep === 3 ? 'Finalizar Match' : 'Continuar'}
                        {!isLoading && currentStep !== 3 && <ChevronRight className="ml-2" size={20} />}
                    </button>
                </div>

            </div>
        </div>

    </div>
  );
}
