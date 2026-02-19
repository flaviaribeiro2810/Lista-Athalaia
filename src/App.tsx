/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Phone,
  Mail,
  User,
  Building2,
  Briefcase,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { enrichLead, LeadEnrichmentResult } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import Papa from 'papaparse';

interface Lead {
  id: number;
  input_data: string;
  nome_sobrenome: string;
  cargo: string;
  empresa: string;
  site: string;
  email_1: string;
  email_2: string;
  email_3: string;
  telefone_1: string;
  telefone_2: string;
  telefone_3_lusha: string;
  telefone_4_apollo: string;
  telefone_5_google: string;
  telefone_assertiva: string;
  whatsapp: string;
  regioes_administrativas_cidade: string;
  estado: string;
  pais: string;
  segmento: string;
  empresa_media_colaboradores: string;
  linkedin_contato: string;
  linkedin_empresa: string;
  insight: string;
  sugestao_abordagem: string;
  created_at: string;
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [input, setInput] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(lead => 
    lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.input_data?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.nome_sobrenome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const processLead = async (data: string) => {
    const enriched = await enrichLead(data);
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_data: data, ...enriched }),
    });
  };

  const handleEnrich = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      await processLead(input);
      setInput('');
      setIsAdding(false);
      fetchLeads();
    } catch (error) {
      console.error('Error enriching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as string[][];
        const total = rows.length;
        setBulkProgress({ current: 0, total });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i].join(', ');
          if (row.trim()) {
            try {
              await processLead(row);
              setBulkProgress({ current: i + 1, total });
            } catch (err) {
              console.error(`Error processing row ${i}:`, err);
            }
          }
        }

        setBulkProgress(null);
        setLoading(false);
        fetchLeads();
        // Reset input
        e.target.value = '';
      }
    });
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    const csv = Papa.unparse(leads.map(({ id, created_at, input_data, ...rest }) => ({
      ID: id,
      Data: new Date(created_at).toLocaleString('pt-BR'),
      ...rest
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_elite_athalaia_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      fetchLeads();
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-700 text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-white/20 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
            <Database className="text-purple-700 w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif italic text-xl tracking-tight leading-none text-white">LDR_Flá_eriquece_AI</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-70 font-mono mt-1 text-white">Investigação & Inteligência Comercial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
            id="csv-import"
            disabled={loading}
          />
          <label
            htmlFor="csv-import"
            className={cn(
              "flex items-center gap-2 border border-white text-white px-4 py-2 rounded-sm hover:bg-white hover:text-purple-700 transition-all text-sm font-medium cursor-pointer",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Database size={16} />
            <span>Importar CSV</span>
          </label>
          <button 
            onClick={handleExportCSV}
            disabled={leads.length === 0 || loading}
            className={cn(
              "flex items-center gap-2 border border-white text-white px-4 py-2 rounded-sm hover:bg-white hover:text-purple-700 transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            <ExternalLink size={16} />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-sm hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Plus size={16} />
            <span>Nova Investigação</span>
          </button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)]">
        {/* Sidebar / List */}
        <div className="w-1/3 border-r border-white/20 overflow-y-auto bg-black/10 backdrop-blur-sm">
          <div className="p-4 border-b border-white/20 sticky top-0 bg-black/20 z-10">
            <div className="relative text-white">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Filtrar investigações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-sm py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-colors placeholder-white/50"
              />
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {filteredLeads.map((lead: any) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={cn(
                  "w-full text-left p-4 transition-all hover:bg-white/20 text-white group relative",
                  selectedLead?.id === lead.id && "bg-white/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[10px] opacity-50">#{lead.id.toString().padStart(4, '0')}</span>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <h3 className="font-medium truncate pr-6">{lead.empresa || lead.input_data}</h3>
                <p className="text-xs opacity-60 truncate mt-1 font-serif italic">{lead.nome_sobrenome || 'Decisor não identificado'}</p>
                
                <div className="mt-3 flex items-center gap-3 text-[10px] opacity-40 font-mono">
                  <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span className="uppercase">{lead.segmento || 'N/A'}</span>
                </div>

                <ChevronRight className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                  selectedLead?.id === lead.id && "opacity-100"
                )} size={16} />
              </button>
            ))}
            {leads.length === 0 && (
              <div className="p-12 text-center opacity-50 text-white">
                <Database size={48} className="mx-auto mb-4" />
                <p className="text-sm">Nenhuma investigação OSINT realizada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-black/5 relative">
          {bulkProgress && (
            <div className="sticky top-0 left-0 right-0 z-20 bg-purple-900 text-white px-6 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-3 flex-1">
                <span>Varredura OSINT em Lote: {bulkProgress.current} de {bulkProgress.total}</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden max-w-md">
                  <motion.div 
                    className="h-full bg-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
              <Loader2 size={12} className="animate-spin" />
            </div>
          )}
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div 
                key={selectedLead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 max-w-5xl mx-auto text-white"
              >
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-orange-500/20 text-orange-200 border-orange-500/30">
                        Investigação Validada
                      </span>
                      <span className="text-[10px] font-mono opacity-60">OSINT Protocol • {new Date(selectedLead.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <h2 className="text-4xl font-serif italic tracking-tight mb-2">{selectedLead.empresa}</h2>
                    <p className="text-lg opacity-80 font-medium italic">{selectedLead.nome_sobrenome} — {selectedLead.cargo}</p>
                    <a href={selectedLead.site} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-200 hover:underline mt-2 inline-block">{selectedLead.site}</a>
                  </div>
                  <button 
                    onClick={() => deleteLead(selectedLead.id)}
                    className="p-2 hover:bg-red-500 hover:text-white rounded-sm transition-colors opacity-50 hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-12">
                  {/* Decisor & Empresa */}
                  <section className="col-span-1">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-6 border-b border-white/20 pb-2">Perfil do Alvo</h4>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-sm bg-white/10 flex items-center justify-center shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{selectedLead.nome_sobrenome}</p>
                          <p className="text-xs opacity-80">{selectedLead.cargo}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono uppercase opacity-60">Localização</p>
                        <p className="text-sm">{selectedLead.regioes_administrativas_cidade}, {selectedLead.estado} — {selectedLead.pais}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-mono uppercase opacity-60">Empresa</p>
                        <p className="text-sm font-medium">{selectedLead.segmento}</p>
                        <p className="text-xs opacity-80">{selectedLead.empresa_media_colaboradores} colaboradores (est.)</p>
                      </div>

                      <div className="flex flex-col gap-2 pt-4">
                        {selectedLead.linkedin_contato && (
                          <a href={selectedLead.linkedin_contato} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-orange-200 hover:underline">
                            <ExternalLink size={12} /> LinkedIn Decisor
                          </a>
                        )}
                        {selectedLead.linkedin_empresa && (
                          <a href={selectedLead.linkedin_empresa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-orange-200 hover:underline">
                            <ExternalLink size={12} /> LinkedIn Empresa
                          </a>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* E-mails */}
                  <section className="col-span-1">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-6 border-b border-white/20 pb-2">Comunicação Digital</h4>
                    <div className="space-y-4">
                      <div className="p-3 rounded-sm border border-white/10 bg-black/20">
                        <p className="text-[10px] font-mono uppercase opacity-60 mb-1">E-mail 1 (Prioridade)</p>
                        <p className="text-sm font-bold break-all">{selectedLead.email_1 || '---'}</p>
                      </div>
                      <div className="p-3 rounded-sm border border-white/10 bg-black/20">
                        <p className="text-[10px] font-mono uppercase opacity-60 mb-1">E-mail 2 (Alternativo)</p>
                        <p className="text-sm break-all">{selectedLead.email_2 || '---'}</p>
                      </div>
                      <div className="p-3 rounded-sm border border-white/10 bg-black/20">
                        <p className="text-[10px] font-mono uppercase opacity-60 mb-1">E-mail 3 (Geral)</p>
                        <p className="text-sm break-all">{selectedLead.email_3 || '---'}</p>
                      </div>
                    </div>
                  </section>

                  {/* Telefones */}
                  <section className="col-span-1">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-6 border-b border-white/20 pb-2">Pontos de Contato</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">WhatsApp</span>
                        <span className="font-bold text-orange-300">{selectedLead.whatsapp || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">Telefone 1</span>
                        <span>{selectedLead.telefone_1 || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">Telefone 2</span>
                        <span>{selectedLead.telefone_2 || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">Lusha</span>
                        <span>{selectedLead.telefone_3_lusha || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">Apollo</span>
                        <span>{selectedLead.telefone_4_apollo || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">Google</span>
                        <span>{selectedLead.telefone_5_google || '---'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border-b border-white/10">
                        <span className="opacity-60 text-[10px] uppercase font-mono">Assertiva</span>
                        <span>{selectedLead.telefone_assertiva || '---'}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Insights & Pitch */}
                <div className="grid grid-cols-1 gap-8">
                  <section className="p-6 rounded-sm bg-black/30 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={18} className="text-orange-400" />
                      <h4 className="font-serif italic text-lg">Análise Crítica OSINT</h4>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">{selectedLead.insight}</p>
                  </section>

                  <section className="p-6 rounded-sm border-2 border-white/20 bg-black/10">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare size={18} className="text-white" />
                      <h4 className="font-serif italic text-lg">Pitch de Alto Impacto</h4>
                    </div>
                    <div className="p-4 bg-white/5 rounded-sm border-l-4 border-orange-500">
                      <p className="text-sm italic leading-relaxed text-white">"{selectedLead.sugestao_abordagem}"</p>
                    </div>
                  </section>

                  <section className="p-6 rounded-sm border border-white/10">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-4">Dados de Origem</h4>
                    <pre className="text-xs font-mono opacity-70 whitespace-pre-wrap bg-black/20 p-4 rounded-sm">
                      {selectedLead.input_data}
                    </pre>
                  </section>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-white">
                <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center mb-6">
                  <Building2 size={40} className="opacity-50" />
                </div>
                <h3 className="font-serif italic text-2xl mb-2">Selecione uma investigação</h3>
                <p className="text-sm opacity-70 max-w-xs">Escolha um lead na lista lateral para visualizar a varredura OSINT completa e inteligência de dados.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsAdding(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-purple-900 text-white border border-white/20 shadow-2xl rounded-sm overflow-hidden"
            >
              <div className="p-6 border-b border-white/20">
                <h3 className="font-serif italic text-2xl">Novo Enriquecimento</h3>
                <p className="text-xs opacity-70 mt-1">Insira os dados brutos do lead (Nome, Empresa, Site, etc.)</p>
              </div>
              
              <form onSubmit={handleEnrich} className="p-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ex: Construtora Tenda, João Silva, Diretor de Marketing..."
                  className="w-full h-40 bg-white/10 border border-white/20 rounded-sm p-4 text-sm focus:outline-none focus:border-white transition-colors resize-none mb-6 placeholder-white/40 text-white"
                  disabled={loading}
                />
                
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-2 text-sm font-medium hover:underline text-white/70 hover:text-white"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-orange-500 text-white px-8 py-2 rounded-sm hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    disabled={loading || !input.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Enriquecendo...</span>
                      </>
                    ) : (
                      <>
                        <Database size={16} />
                        <span>Processar Lead</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              {loading && (
                <div className="px-6 pb-6">
                  {bulkProgress ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono uppercase opacity-70">
                        <span>Processando Lote...</span>
                        <span>{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-orange-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/30 text-orange-200 p-4 rounded-sm text-[10px] font-mono uppercase tracking-widest animate-pulse">
                      Investigando base de dados, validando ICP e buscando contatos nominais...
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
