else:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-pro")

    file = st.file_uploader("📂 Subir Lista (CSV ou Excel)", type=["csv", "xlsx"])

    if file:
        df = pd.read_excel(file) if file.name.endswith(".xlsx") else pd.read_csv(file)

        if st.button("🚀 Iniciar Mapeamento Sênior"):
            final_data = []
            bar = st.progress(0)

            for i, row in df.iterrows():
                emp_name = row.get("RAZÃO SOCIAL") or row.get("Empresa") or f"Linha {i+1}"

                prompt = f"""
Você é um analista comercial.
Retorne APENAS um JSON válido com:
- Empresa
- status_icp
- justificativa_curta

Dados:
{row.to_dict()}
"""

                try:
                    response = model.generate_content(prompt)
                    raw = (response.text or "").strip()

                    try:
                        parsed = json.loads(raw)
                    except:
                        cleaned = raw.replace("```json", "").replace("```", "").strip()
                        parsed = json.loads(cleaned)

                    parsed.setdefault("Empresa", emp_name)
                    final_data.append(parsed)

                except Exception as e:
                    final_data.append({
                        "Empresa": emp_name,
                        "status_icp": "Erro",
                        "erro": str(e)
                    })
                    st.exception(e)

                bar.progress((i + 1) / len(df))

            df_final = pd.DataFrame(final_data)
            st.dataframe(df_final)

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df_final.to_excel(writer, index=False)

            st.download_button(
                "📥 Baixar Planilha Elite",
                output.getvalue(),
                "leads_athalaia.xlsx"
            )
