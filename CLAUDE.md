# PNLE project: how we work

This project is a PNLE (Philippine Nurse Licensure Exam) question bank and a free practice-exam website. Claude writes the questions from review materials; the site is static and deployed by Vercel from GitHub. Setup and architecture are in [README.md](README.md).

## When the user says "update the project"

Do the whole pipeline without stopping for check-ins, through deployment. The user has authorized committing and pushing to `main` for this (2026-10-30). Questions Claude writes are approved automatically (`--approve`); the user does not review them one by one.

1. **New materials.** Look for new files in `materials/` and any path the user names (often `Downloads`). Copy them into `materials/`, then run `npm run extract` (text goes to `materials/_text/`, one block per page). Scanned pages need OCR before you can read them.
2. **Write questions** into `imports/<source>-<area>-<n>.json`, about 20–30 per file, following the rules below. Format: [imports/README.md](imports/README.md).
3. **Import each file once:**
   ```bash
   npm run import -- imports/<file>.json --approve
   ```
   This is all or nothing: an invalid item or an unknown topic cancels the import and lists the valid topics. A file name can only be imported once, so never re-run an import that succeeded (use a new file name for new questions).
4. **Fix the warnings it prints.** Put the fixes in a scratch JSON file (`{"<id>": {"stem": "...", "options": [...]}}`) and run:
   ```bash
   npm run fix -- <fixes.json> imports/<file>.json
   ```
   This updates the bank and the import file together, then re-checks the question. Typical fixes:
   - **"correct option much longer":** shorten the options to similar lengths, keeping the answer in the same position.
   - **"Negative stem":** reword it. This one is also triggered by "at least" and "NOT".
   - **"Very similar to #N":** reword it, or drop it if it's a true duplicate. It is fine for items in one situational set.
5. **Repeat steps 2–4** until the material is covered.
6. **Check and publish:**
   ```bash
   npm run typecheck
   npm run publish:exam      # writes client/exam-public/questions.json (approved, non-sample questions)
   npm run build:exam        # confirms the site builds
   ```
7. **Deploy:**
   ```bash
   git add -A
   git commit -m "<what changed, e.g. Add 120 NP II questions from Udan Vol 2>"
   git push
   npx vercel deploy --prod --yes   # publishes the live site
   ```
   The remote is `https://vea-nurse-2026@github.com/vea-nurse-2026/pnle-exam.git` (public; the user chose this). The local git identity is already set to vea-nurse-2026. The live site is https://pnle-exam-vea-alonzo.vercel.app (Vercel project `pnle-exam-vea-alonzo`, team vea-the-nurse). That project is **not** connected to GitHub, so a push alone does not update the site; the `vercel deploy --prod` step does. This folder is already linked (`.vercel/`) and the CLI is logged in. `.vercelignore` keeps `materials/`, `server/data/` and `.env*` out of the upload. Afterwards, check that `/questions.json` on the live site has the new count. If a build fails, the old version stays live.
8. **Report to the user:** questions added per subject, new totals, what you skipped and why, and the commit. Remind them to back up `server/data/pnle.db` (see Backups).

For small changes (site design, a fix), the same flow applies: change, `npm run typecheck`, `npm run build:exam`, commit, push.

## Rules for writing questions

- **Original items only.** Never copy a source's questions. Use 4 options with one best answer, in a Philippine context (DOH programs, PH laws, local settings and names). Say "nursing attendant", not "UAP".
- **Philippine law only.** Skip US-only legal and regulatory content: advance directives and living wills, HIPAA, US torts, LPN delegation, US racial risk statistics, and US-specific practice.
- **Cite every item.** The `source` field is "Book, section (PDF p. N)", e.g. "Saunders Q&A Review for the NCLEX-RN, 7th ed., Q123 (PDF p. 45)" or "TRA Nursing Module, Hemophilia (PDF p. 302)". The `quote` field holds a short verbatim excerpt that supports the answer.
- **Don't teach errors.** Review handouts contain mistakes and outdated facts, so check them before turning them into questions. Leave out what's wrong. Examples found so far:
  - bromocriptine called a dopamine "antagonist"
  - primary and secondary gain swapped
  - old status epilepticus timing (30 min)
  - repealed laws (RA 6425, RA 8504, RA 3573)
  - outdated CPD unit counts
  - spousal consent "required" for sterilization (struck down in Imbong v. Ochoa, 2014; only the client consents)
  - RA 9211 minimum age for buying tobacco (raised from 18 to 21 by RA 11467, 2020)
  - Udan books: old CPR/ACLS (100/min, lidocaine for PVCs, atropine for asystole, bicarbonate), annual Pap/CXR/DRE screening, old DM cutoffs, Lente insulin, renal-dose dopamine, MAST trousers, nothing by mouth for 48 h after burns, 50–100 mL tube-feed residual limits, paper-bag rebreathing, aspirin or gold as the mainstay for RA, elevating a limb above the heart in compartment syndrome, bed rest for disc herniation, "limit dairy" for calcium stones, blood transfusion during hemodialysis, frequent sex as a prostate cancer cause, withdrawn drugs (phenylbutazone, propoxyphene, chymopapain, Xigris, DES)
- **Topics must be the exact Annex A names below.** A misspelled topic would create a new topic, so `--approve` refuses it instead. NP II and NP V have no "Health Education" topic, and "Acute Biologic Crisis & Emergency Care" exists only under NP V.
- **Mix the difficulty and Bloom levels.** Keep the correct option's length similar to the others, and avoid NOT/EXCEPT stems.

### Topics (PRC Annex A)

**NP I** (Community Health Nursing): `Care of Individuals: Communicable & Non-Communicable Diseases` · `Care of Families (Normal & At Risk)` · `Care of Population Groups` · `Care of the Community: Health System, PHC, Epidemiology & Disaster` · `Health Education` · `Utilization of Research` · `Integrated: Professional Practice, Ethics & Law`

**NP II** (Mother, Adolescent & Human Growth and Development): `Care of Mother Before Birth` · `Care of Mother During Labor and Birth` · `Care of Mother Following Birth` · `Care of Mother with Complications of Childbearing` · `Reproductive Health (Male & Female)` · `Maternal Care: Ethico-Moral, Legal & Management` · `Theories of Growth and Development` · `Care of the Well Child (Neonate to Adolescent)` · `Care of the At-Risk and Sick Child` · `Child Care: Legal, Collaboration & Teamwork` · `Integrated: Professional Practice, Ethics & Law`

**NP III** (Surgery, Oxygenation, F&E, Immunologic Response, Cellular Aberrations): `Care of Patients Undergoing Surgery` · `Oxygenation (Airway, Gas Exchange, Perfusion)` · `Fluids, Electrolytes & Acid-Base Balance` · `Infectious, Inflammatory & Immunologic Disorders` · `Cellular Aberrations` · `Health Education` · `Quality Improvement & Research` · `Integrated: Professional Practice, Ethics & Law`

**NP IV** (Nutrition, GI, Metabolism & Endocrine, Perception & Coordination): `Nutrition & Gastrointestinal Disorders` · `Metabolic & Endocrine Disorders` · `Perception & Coordination Disorders` · `Health Education` · `Collaboration & Teamwork` · `Reporting & Recording` · `Personal & Professional Development` · `Integrated: Professional Practice, Ethics & Law`

**NP V** (Maladaptive Behavior; Life-Threatening & Emergency Care): `Concepts of Mental Health & Therapeutic Models` · `Psychiatric Nursing Process, Disorders & Treatment` · `Acute Biologic Crisis & Emergency Care` · `Therapeutic Communication` · `Documentation in Psychiatric Nursing` · `Collaboration & Teamwork` · `Equipment for High-Acuity & Emergency Care` · `Integrated: Professional Practice, Ethics & Law`

## Sources

| Source | Status |
| --- | --- |
| Saunders Q&A Review for the NCLEX-RN, 7th ed. | Done (all usable items; skips logged) |
| Toprank Review Academy (TRA) Complete Handout, pp. 1–530 | Done (`imports/tra-*.json`) |
| Udan, Comprehensive Nursing Licensure Review Vol. 2 (2024) (`materials/udan/Udan-NLE-V2-2024.pdf`; OCR text in `materials/_text/Udan-NLE-V2-2024.ocr.txt`, PDF page ≈ printed page + 2) | Done, Ch. 1–17 (`imports/udan-nle2-*.json`) |
| Udan, Healthcare Ethics (2023) (`materials/udan/Udan-Healthcare-Ethics-2023.pdf`) | Done (`imports/udan-eth-*.json`) |
| Udan, Medical-Surgical Nursing 2nd ed. (`materials/udan/Udan-MS-2e.pdf`, scanned two-up; OCR text in `materials/_text/Udan-MS-2e.ocr.txt`, words often run together) | Done for what NLE Vol. 2 lacked: Ch. 1 adult development, Ch. 3 perioperative, Ch. 19–21 (female reproductive, STIs, immunologic), comprehensive exams (`imports/udan-ms-*.json`). Ch. 4–18 and the practice tests repeat NLE Vol. 2, so they were skipped |
| Udan: Fundamentals overview (Scribd 25006096, 29 pp.) | Waiting for the download |
| DOH Philippine Clinical Standards Manual on Family Planning (2014) | Ch. 1–11 done (`imports/dohfp-*.json`); STI and FP-management chapters left |
| Philippine laws, full text from Lawphil (30 laws in `materials/laws/`, text in `materials/_text/laws/`) | Started: `imports/law-*.json` (professional practice, maternal/child, mental health, community). Check each law for later amendments before writing |
| Other free sources in `materials/openstax/` and `materials/doh/` (MNCHN MOP, NTP MOP, Dengue CPG 2023, mhGAP 2.0, PNF; OpenStax nursing books) | Downloaded and extracted; not yet converted |

Bank on 2026-10-31: 4,266 approved (4,250 published; the other 16 are samples). Published by subject: NP I 501 · NP II 722 · NP III 1,394 · NP IV 1,075 · NP V 558. Update this line after each update.

## Never

- Commit `materials/` (copyrighted books), `server/data/` (the database) or `.env`. `.gitignore` already covers them; check `git status` before committing.
- Re-run a successful import, or create new topics.
- Draw or recreate copyrighted characters. The site logo and favicon are images the user supplied (`client/exam-public/`).

## Running things locally

- **Studio** (import, review, publish): `npm run dev` gives the studio at http://localhost:5190 and the API on port 4100. Sign-in is off; set `REQUIRE_LOGIN=true` in `server/.env` to turn it on. With sign-in off, the API only listens on this computer.
- **Exam site preview:** `npm run dev:exam` gives http://localhost:5191.
- **Themes:** Light, Dark and Grayscale, each with an optional Liquid glass layer, in [client/src/index.css](client/src/index.css) and [client/src/exam/theme.tsx](client/src/exam/theme.tsx). The accent is baby blue; components keep their `teal-*` class names, and those now point to the blue palette.
- **Examinee progress** lives only in each person's browser (localStorage). There are no accounts and no server.

## Backups

`server/data/pnle.db` is the master copy of the bank and is not on GitHub. It uses WAL mode, so copy it while the studio server is stopped, or copy every `pnle.db*` file together. The `imports/*.json` files (on GitHub) can rebuild it if needed.
