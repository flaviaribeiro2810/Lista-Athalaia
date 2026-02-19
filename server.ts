import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("leads.db");

// Initialize database
db.exec(`
  DROP TABLE IF EXISTS leads;
  CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_data TEXT,
    nome_sobrenome TEXT,
    cargo TEXT,
    empresa TEXT,
    site TEXT,
    email_1 TEXT,
    email_2 TEXT,
    email_3 TEXT,
    telefone_1 TEXT,
    telefone_2 TEXT,
    telefone_3_lusha TEXT,
    telefone_4_apollo TEXT,
    telefone_5_google TEXT,
    telefone_assertiva TEXT,
    whatsapp TEXT,
    regioes_administrativas_cidade TEXT,
    estado TEXT,
    pais TEXT,
    segmento TEXT,
    empresa_media_colaboradores TEXT,
    linkedin_contato TEXT,
    linkedin_empresa TEXT,
    insight TEXT,
    sugestao_abordagem TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/leads", (req, res) => {
    const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
    res.json(leads);
  });

  app.post("/api/leads", (req, res) => {
    const { input_data, ...enrichedData } = req.body;
    const stmt = db.prepare(`
      INSERT INTO leads (
        input_data, nome_sobrenome, cargo, empresa, site, email_1, email_2, email_3,
        telefone_1, telefone_2, telefone_3_lusha, telefone_4_apollo, 
        telefone_5_google, telefone_assertiva, whatsapp, 
        regioes_administrativas_cidade, estado, pais, segmento, 
        empresa_media_colaboradores, linkedin_contato, linkedin_empresa, 
        insight, sugestao_abordagem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      input_data,
      enrichedData["Nome e Sobrenome"] || "",
      enrichedData["Cargo"] || "",
      enrichedData["Empresa"] || "",
      enrichedData["Site"] || "",
      enrichedData["Email 1"] || "",
      enrichedData["Email 2"] || "",
      enrichedData["Email 3"] || "",
      enrichedData["Telefone 1"] || "",
      enrichedData["Telefone 2"] || "",
      enrichedData["Telefone 3 lusha"] || "",
      enrichedData["Telefone 4 (Apollo)"] || "",
      enrichedData["Telefone 5 (Google)"] || "",
      enrichedData["Telefone Assertiva"] || "",
      enrichedData["Whatsapp"] || "",
      enrichedData["Regiões Administrativas e ou Cidade"] || "",
      enrichedData["Estado"] || "",
      enrichedData["País"] || "",
      enrichedData["Segmento"] || "",
      enrichedData["Empresa Média de Colaboradores"] || "",
      enrichedData["LinkedIn Contato"] || "",
      enrichedData["LinkedIn Empresa"] || "",
      enrichedData["insight"] || "",
      enrichedData["sugestao_abordagem"] || ""
    );
    
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/leads/:id", (req, res) => {
    db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
