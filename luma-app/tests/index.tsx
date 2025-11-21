import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  CheckCircle, 
  Mic, 
  Bell, 
  Plus, 
  ArrowUpRight, 
  Sparkles,
  X,
  Loader2,
  ListTodo,
  Send,
  User
} from 'lucide-react';

// --- Configuração da API Gemini ---
const apiKey = ""; // A chave é injetada automaticamente pelo ambiente
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

async function callGemini(prompt: string, systemInstruction: string = "") {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      }
    );

    if (!response.ok) throw new Error('Falha na API');
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui pensar em nada agora.";
  } catch (error) {
    console.error(error);
    return "A Luma está fora do ar momentaneamente. Tente novamente.";
  }
}

// --- Design System Constants ---
const COLORS = {
  ANTIQUE_GOLD: '#C28400', 
  ANTIQUE_GOLD_DARK: '#8F6100',
  LEMON_YELLOW: '#FFF44F',
  GOLDENROD: '#DAA520',
  WHITE: '#FFFFFF',
  TEXT_DARK: '#2C1A00',
  TEXT_LIGHT: '#FFFBE6',
};

// --- Components ---

// 1. Liquid Glass Card Component
const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: delay, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden rounded-[32px] 
        border border-[rgba(218,165,32,0.3)] 
        bg-white/10 backdrop-blur-md 
        shadow-[0_10px_30px_rgba(0,0,0,0.15)]
        flex flex-col justify-between p-6
        min-w-[85%] h-[240px] mr-4 snap-center shrink-0
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full justify-between">
        {children}
      </div>
    </motion.div>
  );
};

// 2. Quick Action Button (Dock)
const ActionButton = ({ icon: Icon, label, onClick, primary = false, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay, type: "spring", stiffness: 200, damping: 20 }}
    className="flex flex-col items-center gap-2"
  >
    <button 
      onClick={onClick}
      className={`
        w-14 h-14 rounded-2xl flex items-center justify-center
        border border-[#FFF44F]/30 transition-transform active:scale-95
        ${primary 
          ? 'bg-[#FFF44F] border-white text-[#2C1A00]' 
          : 'bg-black/20 text-[#FFF44F] backdrop-blur-sm'}
      `}
    >
      <Icon size={24} strokeWidth={2.5} />
    </button>
    <span className="text-xs font-medium text-[#FFF44F]">{label}</span>
  </motion.div>
);

// 3. List Item
const ListItem = ({ icon: Icon, title, subtitle, amount, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: delay, duration: 0.5 }}
    className="
      group relative overflow-hidden rounded-3xl 
      border border-[#FFF44F]/10 bg-black/15 backdrop-blur-md
      mb-3 cursor-pointer hover:bg-black/20 transition-colors
    "
  >
    <div className="flex items-center p-4">
      <div className="w-10 h-10 rounded-xl bg-[#FFF44F]/10 flex items-center justify-center mr-4 text-[#FFF44F]">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h3 className="text-[#FFFBE6] font-semibold text-base">{title}</h3>
        <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>
      </div>
      {amount && (
        <span className="text-white font-semibold text-base">{amount}</span>
      )}
    </div>
  </motion.div>
);

// 4. Modal Component
const SmartModal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute z-50 left-4 right-4 top-[10%] bottom-[10%] bg-[#2C1A00] border border-[#DAA520] rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-[#C28400]/20 to-transparent pointer-events-none" />
           <div className="relative z-10 flex flex-col h-full">
             <div className="flex justify-between items-center mb-4 shrink-0">
               <h3 className="text-[#FFF44F] text-xl font-bold flex items-center gap-2">
                 <Sparkles size={20} /> {title}
               </h3>
               <button onClick={onClose} className="text-white/50 hover:text-white p-2">
                 <X size={24} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar">
                {children}
             </div>
           </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default function App() {
  // --- State ---
  const [modalMode, setModalMode] = useState<'finance' | 'task' | 'chat' | 'briefing' | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [taskInput, setTaskInput] = useState("");
  
  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Olá Mateus! Sou a Luma. Como posso ajudar na gestão da casa hoje?" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Mock Data ---
  const userName = "Mateus";
  const financialSummary = { spent: "3.450", limit: "4.000", percent: 86 };
  const pendingTasks = 3;
  const nextTask = "Pagar conta de luz";

  useEffect(() => {
    if (modalMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, modalMode]);

  // --- Handlers ---

  // 1. Feature: Financial Insight
  const handleFinancialInsight = async () => {
    setModalMode('finance');
    setLoading(true);
    setAiResponse("");
    
    const prompt = `
      Analise estes dados financeiros: Gasto: R$${financialSummary.spent}, Limite: R$${financialSummary.limit}. Mês: Novembro.
      O usuário gastou 86% do orçamento. Dê uma dica curta, amigável e direta de como economizar nos últimos dias do mês ou um aviso cauteloso.
      Use emojis. Máximo 2 frases.
    `;
    
    const result = await callGemini(prompt, "Você é a Luma, uma assistente financeira pessoal inteligente.");
    setAiResponse(result);
    setLoading(false);
  };

  // 2. Feature: Smart Task Breakdown
  const handleSmartTask = async () => {
    if (!taskInput.trim()) return;
    setLoading(true);
    setAiResponse("");

    const prompt = `
      O usuário quer realizar a tarefa: "${taskInput}".
      Quebre isso em 3 a 4 subtarefas acionáveis e curtas para um checklist.
      Retorne apenas a lista com emojis. Exemplo:
      - 🛒 Comprar x
      - 🧹 Limpar y
    `;

    const result = await callGemini(prompt, "Você é a Luma, especialista em produtividade.");
    setAiResponse(result);
    setLoading(false);
  };

  // 3. Feature: Daily Briefing (New!)
  const handleDailyBriefing = async () => {
    setModalMode('briefing');
    setLoading(true);
    setAiResponse("");

    const prompt = `
      Gere um "Morning Briefing" executivo e motivacional para o Mateus.
      Dados:
      - Finanças: 86% do budget usado (Alerta).
      - Tarefas: 3 pendentes, principal é "${nextTask}".
      - Clima da casa: Ocupado.
      
      O tom deve ser calmo, sofisticado e direto (Estilo Steve Jobs/Apple).
      Máximo 3 frases curtas.
    `;

    const result = await callGemini(prompt, "Você é a Luma, assistente pessoal sofisticada.");
    setAiResponse(result);
    setLoading(false);
  };

  // 4. Feature: Interactive Chat (New!)
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setLoading(true);

    const context = `
      Usuário: ${userName}.
      Contexto da Casa:
      - Finanças: R$${financialSummary.spent} gastos de R$${financialSummary.limit}.
      - Próxima tarefa: ${nextTask}.
    `;

    const prompt = `
      Contexto: ${context}
      Histórico recente: ${chatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}
      Usuário disse: "${userMsg}"
      Responda de forma útil, amigável e concisa.
    `;

    const response = await callGemini(prompt, "Você é a Luma, assistente de gestão doméstica.");
    
    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] flex items-center justify-center font-sans text-slate-100">
      <div className="w-full max-w-md h-[100dvh] relative overflow-hidden bg-[#C28400] shadow-2xl sm:rounded-[40px] sm:h-[850px] sm:border-8 sm:border-gray-900">
        
        {/* Atmosphere */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${COLORS.ANTIQUE_GOLD} 0%, ${COLORS.ANTIQUE_GOLD_DARK} 100%)` }}
        />

        {/* Status Bar Placeholder */}
        <div className="h-12 w-full z-20 relative" />

        {/* Main Content */}
        <div className="h-full overflow-y-auto pb-24 px-6 no-scrollbar">
          
          {/* Header */}
          <header className="flex justify-between items-center pt-4 pb-8">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-[#FFFBE6]/80 text-lg">Bom dia,</p>
              <h1 className="text-[#FFF44F] text-4xl font-bold tracking-tighter">{userName}</h1>
            </motion.div>
            <button 
              onClick={handleDailyBriefing}
              className="relative w-12 h-12 rounded-full bg-black/20 border border-[#FFF44F]/20 flex items-center justify-center text-[#FFF44F] hover:bg-[#FFF44F]/10 transition-colors"
            >
              <Bell size={24} />
              <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#C28400]" />
            </button>
          </header>

          {/* Cards Deck */}
          <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 -mx-6 px-6 no-scrollbar space-x-4">
            
            {/* Card 1: Finances (AI Powered) */}
            <GlassCard delay={0.2} className="border-[#FFF44F]/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF44F] flex items-center justify-center text-[#C28400]">
                    <Wallet size={20} />
                  </div>
                  <h2 className="text-white font-semibold text-xl">Finanças</h2>
                </div>
                <span className="text-[#FFF44F] font-bold text-sm bg-black/20 px-2 py-1 rounded-lg">NOV</span>
              </div>
              
              <div className="mt-auto">
                 <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold text-white tracking-tight">R$ {financialSummary.spent}</span>
                  <span className="text-white/70">gastos</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${financialSummary.percent}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-[#FFF44F] rounded-full" 
                  />
                </div>
                <button 
                  onClick={handleFinancialInsight}
                  className="w-full py-2 bg-white/10 rounded-xl border border-[#FFF44F]/30 flex items-center justify-center gap-2 text-[#FFF44F] font-medium active:scale-95 transition-transform hover:bg-white/20"
                >
                  <Sparkles size={16} /> Analisar Gastos
                </button>
              </div>
            </GlassCard>

            {/* Card 2: Insight Luma (Link to Chat) */}
            <GlassCard delay={0.3}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center text-[#C28400]">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-white font-semibold text-xl">Insight da Luma</h2>
              </div>
              <p className="text-[#FFFBE6] text-lg italic leading-relaxed opacity-90">
                "A conta de luz está 30% acima da média. Quer que eu analise o consumo?"
              </p>
              <button 
                onClick={() => {
                  setModalMode('chat');
                  setChatHistory(prev => [...prev, { role: 'model', text: "Percebi um aumento na conta de luz. Gostaria de dicas para economizar?" }]);
                }}
                className="flex items-center text-[#FFF44F] font-semibold mt-4 hover:opacity-80"
              >
                Perguntar à Luma <ArrowUpRight size={16} className="ml-1" />
              </button>
            </GlassCard>

            {/* Card 3: Tasks */}
            <GlassCard delay={0.4}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center text-[#C28400]">
                    <CheckCircle size={20} />
                  </div>
                  <h2 className="text-white font-semibold text-xl">Tarefas</h2>
                </div>
                <div className="bg-[#FF6B6B] px-2.5 py-0.5 rounded-lg">
                  <span className="text-white font-bold text-sm">{pendingTasks}</span>
                </div>
              </div>
              <div className="mt-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded border-2 border-[#FFF44F]" />
                  <span className="text-white text-xl font-medium truncate">{nextTask}</span>
                </div>
                <p className="text-white/50 text-sm mb-4">Vence hoje • Atribuído a você</p>
                <button className="flex items-center text-[#FFF44F] font-semibold hover:opacity-80">
                  Ver todas <ArrowUpRight size={16} className="ml-1" />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Dock Actions */}
          <div className="flex justify-around items-end px-4 mb-10">
            <ActionButton 
              icon={ListTodo} 
              label="Planejar" 
              onClick={() => {
                setModalMode('task');
                setAiResponse("");
                setTaskInput("");
              }} 
              delay={0.5} 
            />
            
            <motion.button 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.6, type: "spring" }}
              onClick={() => setModalMode('chat')}
              className="
                relative -top-2 w-20 h-20 rounded-full 
                bg-gradient-to-br from-[#FFF44F] to-[#FFE033]
                shadow-[0_8px_25px_rgba(255,244,79,0.4)]
                border-[3px] border-white
                flex items-center justify-center text-[#C28400]
                z-10 cursor-pointer hover:scale-105 transition-transform
              "
            >
              <Mic size={32} strokeWidth={3} />
            </motion.button>

            <ActionButton 
              icon={Plus} 
              label="Despesa" 
              onClick={() => {}} 
              delay={0.7} 
            />
          </div>

          {/* List Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-white font-semibold text-xl mb-4 ml-1">Resumo do Dia</h3>
            <ListItem icon={Wallet} title="Internet" subtitle="Pagamento agendado hoje" amount="-R$ 120" delay={0.9} />
            <ListItem icon={CheckCircle} title="Limpar Sala" subtitle="Maria • Pendente" delay={1.0} />
          </motion.div>
        </div>

        {/* Modals for AI Interaction */}
        
        {/* 1. Finance Modal */}
        <SmartModal 
          isOpen={modalMode === 'finance'} 
          onClose={() => setModalMode(null)}
          title="Análise Financeira"
        >
           <div className="space-y-4 h-full flex flex-col justify-center">
              {loading ? (
                <div className="flex flex-col items-center py-8">
                   <Loader2 className="animate-spin text-[#FFF44F] mb-2" size={32} />
                   <p className="text-white/50">Calculando...</p>
                </div>
              ) : (
                <div className="bg-black/20 p-6 rounded-2xl border border-white/10">
                  <p className="text-[#FFFBE6] text-lg leading-relaxed whitespace-pre-wrap">
                    {aiResponse}
                  </p>
                </div>
              )}
              <button onClick={() => setModalMode(null)} className="w-full py-3 bg-[#FFF44F] rounded-xl text-[#2C1A00] font-bold hover:bg-[#FFE033] transition-colors">
                Entendido
              </button>
           </div>
        </SmartModal>

        {/* 2. Task Planner Modal */}
        <SmartModal 
          isOpen={modalMode === 'task'} 
          onClose={() => setModalMode(null)}
          title="Planejador Mágico"
        >
           <div className="space-y-4 flex flex-col h-full">
              <p className="text-white/70 text-sm">Diga uma meta e eu crio o plano.</p>
              
              <div className="relative shrink-0">
                <input 
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartTask()}
                  placeholder="Ex: Organizar festa surpresa..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFF44F]"
                />
                <button 
                  onClick={handleSmartTask}
                  disabled={loading || !taskInput}
                  className="absolute right-2 top-2 p-2 bg-[#FFF44F] rounded-lg text-[#2C1A00] disabled:opacity-50 hover:bg-[#FFE033] transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                </button>
              </div>

              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/20 p-4 rounded-2xl border border-white/10 mt-4 flex-1 overflow-y-auto no-scrollbar"
                >
                  <h4 className="text-[#FFF44F] text-sm font-bold mb-2 uppercase tracking-wider">Checklist Sugerido</h4>
                  <div className="text-[#FFFBE6] whitespace-pre-line leading-7">
                    {aiResponse}
                  </div>
                </motion.div>
              )}
              
              {aiResponse && (
                <button onClick={() => setModalMode(null)} className="mt-auto w-full py-3 border border-[#FFF44F]/50 text-[#FFF44F] rounded-lg text-sm font-bold hover:bg-[#FFF44F]/10 transition-colors">
                    Adicionar Tarefas
                </button>
              )}
           </div>
        </SmartModal>

        {/* 3. Daily Briefing Modal */}
        <SmartModal 
          isOpen={modalMode === 'briefing'} 
          onClose={() => setModalMode(null)}
          title="Resumo do Dia"
        >
           <div className="space-y-4 flex flex-col justify-center h-full">
              {loading ? (
                <div className="flex flex-col items-center py-8">
                   <Loader2 className="animate-spin text-[#FFF44F] mb-2" size={32} />
                   <p className="text-white/50">Preparando seu briefing...</p>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-white/10 to-transparent p-6 rounded-2xl border border-white/10">
                  <h4 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Executive Summary</h4>
                  <p className="text-[#FFFBE6] text-xl font-light leading-relaxed italic">
                    "{aiResponse}"
                  </p>
                </div>
              )}
              <button onClick={() => setModalMode(null)} className="w-full py-3 bg-white/10 rounded-xl text-white font-bold hover:bg-white/20 transition-colors">
                Fechar
              </button>
           </div>
        </SmartModal>

        {/* 4. Interactive Chat Modal */}
        <SmartModal 
          isOpen={modalMode === 'chat'} 
          onClose={() => setModalMode(null)}
          title="Luma Chat"
        >
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 no-scrollbar">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-[#FFF44F] flex items-center justify-center text-[#C28400] mr-2 mt-1 shrink-0">
                      <Sparkles size={16} />
                    </div>
                  )}
                  <div 
                    className={`
                      max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user' 
                        ? 'bg-[#FFF44F] text-[#2C1A00] rounded-tr-sm' 
                        : 'bg-white/10 text-[#FFFBE6] border border-white/10 rounded-tl-sm'}
                    `}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white ml-2 mt-1 shrink-0">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                   <div className="w-8 h-8 rounded-full bg-[#FFF44F] flex items-center justify-center text-[#C28400] mr-2">
                      <Loader2 size={16} className="animate-spin" />
                   </div>
                   <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-tl-sm">
                     <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                       <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                       <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                     </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative shrink-0">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pergunte algo à Luma..."
                className="w-full bg-black/30 border border-white/10 rounded-full py-3 pl-4 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFF44F]"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || loading}
                className="absolute right-1 top-1 p-2 bg-[#FFF44F] rounded-full text-[#2C1A00] disabled:opacity-50 disabled:bg-gray-500 transition-all hover:scale-105"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </SmartModal>

        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#523700] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}