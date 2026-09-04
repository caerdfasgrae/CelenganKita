# CelenganKita — AI Agent Workspace Rules & System Instructions

> **MANDATORY FOR ALL AI AGENTS & DEVELOPERS**  
> Repositori ini diatur oleh 3 dokumen *Single Source of Truth* di root project.  
> Setiap AI coding agent (Antigravity, Claude, Cursor, Copilot, dll) **WAJIB MEMATUHI** hierarki dan aturan dalam dokumen berikut sebelum menyarankan atau melakukan perubahan kode:

1. **[AGENT.md](file:///c:/Users/SMI-CPU014/Documents/Abyan/CelenganKita/AGENT.md)** — **Engineering Governance & Rules of Engagement**
   - Protokol 7 langkah sebelum modifikasi (*Understand → Inspect → Impact Analysis → Plan → Implement → Verify → Report*).
   - Larangan arsitektur: Dilarang menambah Spring Boot/Java (ADR-01) atau memindahkan OCR ke server (ADR-02).
   - Aturan keamanan: Browser tidak dipercaya, RLS PostgreSQL mutlak dipertahankan, `search_path = public, pg_temp` pada `SECURITY DEFINER`, kredensial service-role hanya di server.
   - Aturan konkurensi: Operasi approval dan deduplikasi webhook wajib atomic di level database.
   - Aturan visual: Anti-AI slop (tidak ada decorative blobs, bento-grid berantakan, atau glassmorphism menyala).
   - Definition of Done (DoD) & Standard Change Report format.

2. **[PRD.md](file:///c:/Users/SMI-CPU014/Documents/Abyan/CelenganKita/PRD.md)** — **Product Requirements & Business Invariants**
   - Invarian produk: Data terisolasi per Space, notifikasi webhook bukan transaksi resmi sebelum di-approve (*Human-in-the-Loop*), target Always Free Tier Rp0.

3. **[SRS.md](file:///c:/Users/SMI-CPU014/Documents/Abyan/CelenganKita/SRS.md)** — **Technical Specifications & Threat Model**
   - Data dictionary 6 tabel, RLS policy matrix, spesifikasi webhook 32KB / token SHA-256, idempotency formula, dan WCAG 2.2 AA.

---
*File ini dimuat secara otomatis oleh Antigravity Workspace Rules Engine untuk menjamin tata kelola kode yang konsisten dan aman.*

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`

Direction & Product Soul: Read `DESIGN.md` before applying visual changes.
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->
