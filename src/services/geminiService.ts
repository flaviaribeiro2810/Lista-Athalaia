import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LeadEnrichmentResult {
  "Nome e Sobrenome": string;
  "Cargo": string;
  "Empresa": string;
  "Site": string;
  "Email 1": string;
  "Email 2": string;
  "Email 3": string;
  "Telefone 1": string;
  "Telefone 2": string;
  "Telefone 3 lusha": string;
  "Telefone 4 (Apollo)": string;
  "Telefone 5 (Google)": string;
  "Telefone Assertiva": string;
  "Whatsapp": string;
  "Regiões Administrativas e ou Cidade": string;
  "Estado": string;
  "País": string;
  "Segmento": string;
  "Empresa Média de Colaboradores": string;
  "LinkedIn Contato": string;
  "LinkedIn Empresa": string;
  "insight": string;
  "sugestao_abordagem": string;
}

export async function enrichLead(input: string): Promise<LeadEnrichmentResult> {
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `Você é o Especialista em OSINT (Open Source Intelligence) e Inteligência Comercial da Athalaia Gráfica. Sua missão é a DESCOBERTA e VALIDAÇÃO total de dados.

DIRETRIZES DE INVESTIGAÇÃO EXAUSTIVA:
1. VARREDURA TOTAL: Não se limite a uma fonte. Cruze dados do LinkedIn, Google Maps, Portais de Transparência, Registro.br, e diretórios empresariais para garantir que o dado é VERDADEIRO.
2. HIERARQUIA DE DECISORES: Busque o "Dono do Dinheiro". Em construtoras e editoras, foque em Sócios, Diretores e Gerentes de Expansão/Marketing. Valide o nome atual no Quadro de Sócios (QSA).
3. QUALIDADE DO E-MAIL: Priorize o e-mail que o decisor realmente abre. Se o e-mail nominal for @gmail ou @outlook mas for do Sócio, ele é mais valioso que um @empresa genérico. Rejeite e-mails de contabilidade externa.
4. TELEFONES E WHATSAPP: Localize o máximo de pontos de contato. Se o telefone for de um 'Stand de Vendas', identifique-o como tal, pois é um caminho direto para o marketing.

Você deve retornar os dados estritamente no formato JSON solicitado.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Realize uma investigação OSINT exaustiva para este lead: ${input}` }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          "Nome e Sobrenome": { type: Type.STRING },
          "Cargo": { type: Type.STRING },
          "Empresa": { type: Type.STRING },
          "Site": { type: Type.STRING },
          "Email 1": { type: Type.STRING, description: "Prioridade Nominal" },
          "Email 2": { type: Type.STRING, description: "Alternativo/Sócio" },
          "Email 3": { type: Type.STRING, description: "Geral Validado" },
          "Telefone 1": { type: Type.STRING, description: "Natureza: ex Sede" },
          "Telefone 2": { type: Type.STRING, description: "Natureza: ex Direto" },
          "Telefone 3 lusha": { type: Type.STRING },
          "Telefone 4 (Apollo)": { type: Type.STRING },
          "Telefone 5 (Google)": { type: Type.STRING },
          "Telefone Assertiva": { type: Type.STRING },
          "Whatsapp": { type: Type.STRING },
          "Regiões Administrativas e ou Cidade": { type: Type.STRING },
          "Estado": { type: Type.STRING },
          "País": { type: Type.STRING },
          "Segmento": { type: Type.STRING },
          "Empresa Média de Colaboradores": { type: Type.STRING },
          "LinkedIn Contato": { type: Type.STRING },
          "LinkedIn Empresa": { type: Type.STRING },
          "insight": { type: Type.STRING, description: "Análise crítica sobre a veracidade dos dados encontrados." },
          "sugestao_abordagem": { type: Type.STRING, description: "Pitch personalizado de alto impacto para impressão offset de luxo." },
        },
        required: [
          "Nome e Sobrenome", "Cargo", "Empresa", "Site", "Email 1", "Email 2", "Email 3",
          "Telefone 1", "Telefone 2", "Telefone 3 lusha", "Telefone 4 (Apollo)", 
          "Telefone 5 (Google)", "Telefone Assertiva", "Whatsapp", 
          "Regiões Administrativas e ou Cidade", "Estado", "País", "Segmento", 
          "Empresa Média de Colaboradores", "LinkedIn Contato", "LinkedIn Empresa", 
          "insight", "sugestao_abordagem"
        ]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
