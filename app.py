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
            for i, row in df.iterrows():
                emp_name = row.get('RAZÃO SOCIAL', row.get('Empresa', 'Empresa'))
                prompt = f"Investigue este lead para a Athalaia: {row.to_dict()}"
                try:
                    response = model.generate_content(prompt)
                    clean_res = response.text.replace('```json', '').replace('```', '').strip()
                    final_data.append(json.loads(clean_res))
                except:
                    final_data.append({"Empresa": emp_name, "status_icp": "Erro"})
                time.sleep(4) 
                bar.progress((i + 1) / len(df))
            
            df_final = pd.DataFrame(final_data)
            st.dataframe(df_final)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df_final.to_excel(writer, index=False)
            st.download_button("📥 Baixar Planilha Elite", output.getvalue(), "leads_athalaia.xlsx")
