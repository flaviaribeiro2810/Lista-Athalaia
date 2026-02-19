import streamlit as st
import pandas as pd
import google.generativeai as genai
import json
import time
import io

# Configuração da Página
st.set_page_config(page_title="Athalaia Elite", layout="wide")
st.title("💜 Athalaia:lista inteligente")

# Barra Lateral
with st.sidebar:
    st.header("Configuração")
    api_key = st.text_input("Cole sua Gemini API Key:", type="password")

if not api_key:
    st.warning("Insira a API Key para começar.")
else:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    file = st.file_uploader("Subir Planilha", type=['csv', 'xlsx'])

    if file:
        df = pd.read_excel(file) if file.name.endswith('.xlsx') else pd.read_csv(file)
        if st.button("🚀 Iniciar Análise"):
            final_data = []
            bar = st.progress(0)
            for i, row in df.iterrows():
                prompt = f"Investigue este lead para a Athalaia Gráfica: {row.to_dict()}"
                try:
                    response = model.generate_content(prompt)
                    # Tenta extrair o JSON da resposta
                    res_text = response.text.replace('```json', '').replace('```', '').strip()
                    final_data.append(json.loads(res_text))
                except:
                    final_data.append({"Empresa": "Erro no Lead", "status_icp": "Verificar"})
                time.sleep(4)
                bar.progress((i + 1) / len(df))
            
            df_final = pd.DataFrame(final_data)
            st.dataframe(df_final)
            
            # Botão de Download
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df_final.to_excel(writer, index=False)
            st.download_button("📥 Baixar Planilha Pronta", output.getvalue(), "leads_athalaia.xlsx")
