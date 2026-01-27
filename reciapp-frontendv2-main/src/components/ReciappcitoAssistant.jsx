import { useState, useEffect, useRef } from 'react';
import { X, Bot, Send, Loader2, Sparkles } from 'lucide-react';

export default function ReciappcitoAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy **Reciappcito**. 🌱 ¿En qué puedo ayudarte hoy con tu reciclaje?", sender: "bot" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 💡 Sugerencias rápidas para que no "se quede así"
  const quickActions = [
    "¿Cómo reciclo plástico?",
    "¿Qué gano por reciclar?",
    "Ver mi impacto CO2",
    "¿Quién es Reciappcito?"
  ];

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input.trim();
    if (!messageText) return;

    setMessages((prev) => [...prev, { text: messageText, sender: "user" }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("https://n8n.rubro.pe/webhook/c749da76-4750-4f74-b84d-6249c0122e5b/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      console.log("Respuesta de n8n:", data); // 👈 Revisa esto en la consola (F12)

      // Intentamos obtener la respuesta de varios lugares comunes en n8n
      const botReply = data.output || data.text || data.response || data.message || 
                       "¡Excelente pregunta! Estoy aprendiendo más sobre eso para ayudarte mejor. 🌱";
      
      setMessages((prev) => [...prev, { text: botReply, sender: "bot" }]);
    } catch (error) {
      console.error("Error en la conexión:", error);
      setMessages((prev) => [...prev, { text: "Ups, mi conexión ecológica falló. 🛜 ¿Podemos intentar de nuevo?", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 bg-emerald-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all border-4 border-white animate-bounce-slow"
        >
          <div className="absolute -top-2 -right-2 bg-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse text-slate-900 uppercase italic">IA Activa</div>
          <Bot className="text-white w-8 h-8" />
        </button>
      )}

      {isOpen && (
        <div className="w-[350px] md:w-[400px] h-[580px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-emerald-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
          
          <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                <Sparkles className="text-amber-300 w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-black text-sm tracking-tight leading-none italic">Reciappcito Intelligence</p>
                <p className="text-[10px] font-bold text-emerald-200 mt-1 uppercase tracking-widest">Guía de Sostenibilidad</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-emerald-50/10 custom-scrollbar">
             {messages.map((msg, idx) => (
               <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border 
                    ${msg.sender === 'bot' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    <Bot size={14}/>
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border max-w-[80%] 
                    ${msg.sender === 'bot' 
                      ? 'bg-white rounded-bl-none border-emerald-50 text-slate-700 font-medium' 
                      : 'bg-emerald-600 rounded-br-none border-emerald-500 text-white font-bold'}`}>
                    {msg.text}
                  </div>
               </div>
             ))}
             
             {isTyping && (
               <div className="flex gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-spin"><Loader2 size={16} /></div>
                  <div className="bg-white/50 p-3 rounded-2xl rounded-bl-none border border-emerald-50 text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Procesando eco-datos...</div>
               </div>
             )}

             {/* 🟢 Sugerencias Rápidas para interactuar */}
             {!isTyping && messages.length < 3 && (
                <div className="pt-4 flex flex-wrap gap-2">
                   {quickActions.map(action => (
                     <button 
                        key={action}
                        onClick={() => handleSend(action)}
                        className="bg-white border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                     >
                        {action}
                     </button>
                   ))}
                </div>
             )}
          </div>

          <div className="p-4 bg-white border-t border-emerald-50">
             <div className="bg-slate-50 rounded-2xl p-1 flex items-center border border-slate-100 focus-within:border-emerald-300 transition-all shadow-inner">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe aquí..." 
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-medium text-slate-600"
                />
                <button 
                  onClick={() => handleSend()}
                  className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg active:scale-90"
                >
                   <Send size={18} />
                </button>
             </div>
             <p className="text-center text-[8px] text-slate-300 font-black uppercase mt-3 tracking-[0.3em]">ReciYAP! Intelligence Unit v2.6</p>
          </div>
        </div>
      )}
    </div>
  );
}