/* ═══════════════════════════════════════════════════
   TABACRAZY · env.js — configuração pública do projeto
   ───────────────────────────────────────────────────
   Site estático (sem build) NÃO lê process.env / .env.local —
   essa é a fonte de config que o navegador realmente usa.

   A SUPABASE_ANON_KEY abaixo é a "publishable key" (formato novo,
   equivalente à anon key): é PÚBLICA por design e segura no
   front-end, pois a tabela game_scores tem RLS permitindo só
   SELECT e INSERT públicos. NUNCA coloque aqui a service_role key.
   ═══════════════════════════════════════════════════ */
window.TABACRAZY_ENV = {
  SUPABASE_URL: 'https://mzecbmkqscdmbtaqgndg.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_nSCXx3KkPGTwjZ5-xnB_vQ_3g1TCout'
};
