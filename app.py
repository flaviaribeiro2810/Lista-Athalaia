import streamlit as st
import pandas as pd
import google.generativeai as genai
import json
import time
import io

st.set_page_config(page_title="Athalaia Sales Intelligence", layout="wide")
st.title("🕵️ Athalaia: Inteligência Comercial Híbrida")

with st.sidebar:
    st.header("⚙️ Configuração")
    api_key = st.text_input("Sua Gemini API Key:", type="password")

if not api_key:
    st.warning("👈 Insira sua API Key.")
else:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')
    file = st.file_uploader("📂 Subir Lista (CSV ou Excel)", type=['csv', 'xlsx'])

    if file:
        df = pd.read_excel(file) if file.name.endswith('.xlsx') else pd.read_csv(file)
       if st.button("🚀 Iniciar Mapeamento Sênior"):
    final_data = []
    bar = st.progress(0)
    log = st.empty()

    for i, row in df.iterrows():
        emp_name = row.get("RAZÃO SOCIAL") or row.get("Empresa") or f"Linha {i+1}"

        prompt = f"""
Você é um analista comercial. Retorne APENAS um JSON válido (sem markdown, sem texto extra).
Campos obrigatórios:
- Empresa
- status_icp
- justificativa_curta

Dados do lead:
{row.to_dict()}
""".strip()

        try:
            log.write(f"🔎 Processando: **{emp_name}** ({i+1}/{len(df)})")
            response = model.generate_content(prompt)

            raw = (response.text or "").strip()

            # tenta direto
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                # se vier com ```json ... ```
                cleaned = raw.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned)

            # garante que vem com nome
            if isinstance(parsed, dict):
                parsed.setdefault("Empresa", emp_name)
            final_data.append(parsed)

        except Exception as e:
            final_data.append({
                "Empresa": emp_name,
                "status_icp": "Erro",
                "erro_detalhado": str(e)
            })
            st.error(f"Erro em {emp_name}")
            st.exception(e)

        bar.progress((i + 1) / len(df))
            
            df_final = pd.DataFrame(final_data)
            st.dataframe(df_final)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df_final.to_excel(writer, index=False)
            st.download_button("📥 Baixar Planilha Elite", output.getvalue(), "leads_athalaia.xlsx")
