# QSU Faculty Training Needs Recommender System

Hello! Sa audio guide na ito, i-e-explain ko sa'yo nang buo ang architecture, features, setup, at thesis methodology ng ating QSU Faculty Training Needs Recommender System Version 3.0.

Naka-organize ang presentation na ito sa siyam na sections para madaling sundan:

Una, overview at layunin ng project para sa Quirino State University;
Pangalawa, ang high-level system architecture gamit ang Next.js 14, FastAPI, at MySQL;
Pangatlo, ang multi-campus setup sa Diffun, Maddela, at Cabarroguis, kasama ang role-based access control;
Pang-apat, kung paano gumagana ang 8-part questionnaire at faculty lifecycle status;
Panlima, ang Machine Learning engine gamit ang Random Forest at transparent catalog matching;
Pang-anim, ang quick start setup guide para i-run ang backend at frontend locally;
Pampito, ang paggamit ng Google Colab notebook para mag-train at mag-export ng model artifacts;
Pang-walo, ang mga pre-seeded test accounts para sa mabilisang demo at testing;
At sa Section 9, maririnig mo ang formal academic thesis defense presentation sa English, kung saan ipapaliwanag ang research methodology, mathematical formulas, target leakage prevention, at evaluation metrics.

Simulan na natin sa Section 1.

---

# Section 1: Introduksyon at Pangkalahatang Pananaw ng Proyekto

Hello! I-e-explain ko sa'yo nang detalyado ang architecture at mga features ng ating Quirino State University Faculty Training Needs Recommender System Version 3.0.

Ang project na ito ay isang production-grade, AI-driven institutional platform na ginawa natin para sa Quirino State University, o QSU. Sa traditional process ng university, ang pag-alam sa training needs ng mga faculty ay karaniwang dumadaan sa manual paper forms o generic surveys. Dahil manual, mabagal ang consolidation ng data, hindi personalized ang training, at nahihirapan ang admin na i-match ang training budget sa totoong kailangan ng mga instructors.

Dito pumapasok ang ating system. May tatlong main goals ang QSU Recommender:

Una, magbigay ng Personalized Training Recommendations sa bawat individual faculty batay sa kanilang competency assessment, emerging tech needs, at personal preferences.

Pangalawa, mag-generate ng Aggregated Department at Campus Priorities para sa Department Chairs at Campus Directors para maging data-driven ang kanilang annual faculty development plans.

At pangatlo, magpatupad ng Transparent at Explainable AI. Hindi ito black-box system. Malinaw na nakikita ng bawat faculty at admin kung bakit lumabas ang specific recommendation, ano ang match score, at paano ito kinalkula ng ating Random Forest model.

Covered ng system ang tatlong campus ng QSU: ang Diffun Main Campus, Maddela Campus, at Cabarroguis Campus. Lahat ito ay integrated sa iisang modern web app gamit ang official school colors ng QSU: Forest Green at Gold.

---

# Section 2: High-Level System Architecture at Tech Stack

Ngayon, tingnan natin ang system architecture. 

Nahahati ang system sa tatlong main layers: ang Frontend Client, ang FastAPI Backend Server, at ang Database kasama ang Machine Learning Pipeline.

Sa Frontend, gumamit tayo ng Next.js 14 App Router kasama ang TypeScript at Tailwind CSS. Pinili natin ang Next.js 14 dahil kailangan natin ng fast rendering, type safety, modular components, at smooth transitions. Naka-organize ang pages sa role-based route groups: may sariling folders para sa faculty, department admin, campus admin, at system admin. May kasama rin itong custom SVG donut charts at interactive analytics gamit ang Recharts.

Sa Backend, pinili natin ang FastAPI gamit ang Python 3.11. Kilala ang FastAPI sa mataas na speed, automatic OpenAPI documentation via Swagger UI, at native support para sa Pydantic validation. Bawat request na pumapasok sa API ay dumadaan sa strict validation schemas.

Para sa Database, gumagamit tayo ng MySQL gamit ang SQLAlchemy 2.0 ORM at PyMySQL driver. Madali itong paganahin sa standard XAMPP environment o sa cloud. May kasama rin itong Alembic para sa database migrations.

Sa Machine Learning layer, ginamit natin ang scikit-learn, pandas, numpy, at joblib. Ang core model ay isang One-vs-Rest Random Forest Multi-Label Classifier. Naka-decouple ang model prediction mula sa catalog matching, kaya puwedeng magdagdag ang Admin ng bagong training courses sa catalog nang hindi na kailangang mag-retrain ng machine learning model.

Sa communication ng Frontend at Backend, gumagamit tayo ng RESTful APIs na protektado ng JSON Web Tokens, o JWT, at Bcrypt password hashing. May built-in proxy rewrites ang Next.js papuntang FastAPI port 8000, kaya seamless ang connection at walang CORS issues sa local development.

---

# Section 3: Multi-Campus Hierarchy at Role-Based Access Control

Pag-usapan naman natin ang Multi-Campus Hierarchy at Role-Based Access Control, o RBAC.

Ang Quirino State University ay may tatlong campuses: Diffun Main Campus, Maddela Campus, at Cabarroguis Campus. Bawat campus ay may kanya-kanyang academic departments tulad ng BSIT, BSED, BSBA, BEED, BSCE, BSHM, at BSMidwifery.

Para sa data privacy at security alinsunod sa Data Privacy Act, nag-implement tayo ng apat na user roles:

Una: Ang Faculty Role.
Ang bawat faculty member ay may access lang sa sarili nilang account. Puwede nilang sagutan at i-update ang kanilang 8-part questionnaire, i-track ang kanilang progress bar, at mag-request ng personalized recommendation. Wala silang access sa data ng ibang guro o sa admin features.

Pangalawa: Ang Department Admin o Department Chair.
Naka-isolate ang scope ng Department Chair sa kanilang department at campus lamang. Halimbawa, ang Chair ng BSIT sa Diffun ay puwede lang makakita ng faculty members sa BSIT Diffun. Puwede silang mag-generate ng recommendations para sa kanilang faculty, magpatakbo ng Department Synthesis, at mag-register ng bagong faculty members sa kanilang department.

Pangatlo: Ang Campus Admin o Campus Director.
Ang Campus Director ay may access sa lahat ng academic departments sa loob ng kanilang assigned campus. Puwede silang mag-transfer ng faculty sa ibang department, mag-manage ng programs, at mag-generate ng Campus-Wide Aggregated Recommendations.

Pang-apat: Ang System Admin o IT Administrator.
Ito ang pinakamataas na access level na may global scope sa tatlong campuses. Sila ang nagma-manage ng master user accounts, training catalog, audit logs, at ang pagpapatakbo ng Machine Learning Training Pipeline.

Lahat ng ito ay protektado sa server-side gamit ang security functions tulad ng enforce campus scope, enforce department scope, at enforce faculty scope sa backend. Hindi puwedeng i-bypass ng user ang parameters dahil chine-check ng server ang authenticated token bago mag-return ng data.

---

# Section 4: Ang 8-Part Questionnaire at Faculty Lifecycle

Tingnan naman natin kung paano kinokolekta ang assessment data mula sa mga faculty.

Ang questionnaire ay hango mismo sa official training needs tool ng QSU, at hinati natin ito sa 8 clear parts:

Part 1: Personal Profile — Dito kinukuha ang age, sex, employment status, at department.

Part 2: Educational Background — Highest degree tulad ng Master's o Doctorate, at ang field of specialization.

Part 3: Professional Background — Academic rank, years of teaching, administrative designation, at bilang ng trainings sa nakaraang tatlong taon.

Part 4: Training History — Checklist ng training areas at modalities na dinaluhan na dati.

Part 5: Competency Assessment — Ito ang core evaluation section. Sinusuri dito ang Core, Functional, at Leadership competencies. Bawat competency ay may rating mula 1 hanggang 5 para sa Proficiency at 1 hanggang 5 para sa Importance. Dito kinukuha ng system ang Competency Gap.

Part 6: Emerging Training Needs — Siyam na tech domains ang nire-rate mula 1 hanggang 5 batay sa urgency: Artificial Intelligence, Machine Learning, Data Analytics, Cybersecurity, Cloud Computing, LMS, Educational Technology, Statistical Software, at Research Methods.

Part 7: Learning Preferences — Preferred modalities tulad ng Face-to-Face, Webinar, o Blended learning, kasama ang schedule at duration.

Part 8: Barriers to Training — Mga challenges tulad ng workload, budget, travel distance, at internet connectivity.

### Ang Status Lifecycle ng Faculty:

May automated progress tracking ang system:

Una, ang status na not started. Ito ay para sa bagong account na wala pang nasisimulang questionnaire part.

Pangalawa, ang in progress status. Ibig sabihin, nakapag-save na ng kahit isang part pero hindi pa tapos ang required sections. May sequential progression rule: hindi puwedeng sagutan ang Part 2 kung hindi pa tapos at na-validate ang Part 1.

Pangatlo, ang eligible status. Ito ay kapag nakumpleto na ng faculty ang limang required parts: Part 1, 2, 3, 5, at 6. Dito magiging clickable na ang button para mag-generate ng recommendation.

At pang-apat, ang has recommendation status. Ito ay kapag na-run na ang model at na-save na ang recommended programs sa database.

Kapag nag-generate ang Department Chair ng department recommendation, tanging mga faculty members na may status na eligible o has recommendation ang isasama sa calculation. Ang mga incomplete faculty ay awtomatikong mapupunta sa listahan ng skipped faculty kasama ang dahilan para madali silang ma-follow up.

---

# Section 5: Machine Learning Engine at Transparent Catalog Matching

Pag-usapan naman natin ang pinaka-core ng system: ang Machine Learning Engine at Recommendation Service.

Paano nga ba nabubuo ang mga rekomendasyon?

Nagsisimula ito sa Feature Pipeline. Pagka-submit ng faculty, kino-convert ng feature extractor ang survey data papuntang flat feature vector na may mahigit 70 features. Ang categorical columns tulad ng rank at education ay pinoproseso ng One-Hot Encoder, habang ang numerical ratings at Likert scales ay pinararaan sa Standard Scaler.

Pagkatapos, papasok ang data sa ating Random Forest Multi-Label Classifier. Naglalabas ang model ng calibrated probabilities para sa bawat isa sa siyam na training categories. Halimbawa: 87% sa Research Methods, 76% sa Educational Technology, at 72% sa Artificial Intelligence.

Dito pumapasok ang ating Catalog Matching Algorithm. Ang ating ML model ay nagre-recommend ng Topic Categories, habang ang database naman ay naglalaman ng mga active Training Programs sa catalog table.

Para ma-compute ang final Match Score ng bawat training program, ginagamit ng system ang formula na ito:
Nagsisimula ang score sa base probability ng matching category. Pagkatapos, nagdaragdag ang system ng preference bonuses:
May plus 3% bonus kung ang modality tulad ng Webinar o Face-to-Face ay tugma sa gusto ng faculty.
May plus 2% bonus kung tugma ang schedule tulad ng Saturdays o Summer break.
May plus 2% bonus kung pasok sa preferred duration tulad ng two days o one week.
At may karagdagang plus 3% bonus kung ang training program ay direktang sumasagot sa isang competency gap kung saan mas mataas ang Importance kaysa sa current Proficiency ng faculty.

Ang pinakamataas na match score ay 99%.

Habang naghihintay ang user sa resulta, nagpapakita ang frontend ng four-step animated modal: ang Generating Progress Modal. Dito ipinapakita ang progress:
Step 1: Pag-load ng assessment data;
Step 2: Pagpapatakbo ng Random Forest inference;
Step 3: Pag-match sa training catalog at scoring;
Step 4: Pag-save ng resulta sa faculty record.

Pagkatapos, ipapakita ang Model Transparency Card kung saan nakatala ang active model version, algorithm, sample size, at feature counts, kasama ang custom SVG donut charts.

---

# Section 6: Quick Start Setup Guide para sa Backend at Frontend

Kung gusto mong i-run ang project locally mula sa simula, ito ang simple at step-by-step setup guide.

Siguraduhing naka-install sa computer mo ang Python 3.11 o mas mataas, Node.js 18 o mas mataas, at XAMPP na may tumatakbong MySQL service sa port 3306.

### Hakbang 1: Backend Setup

Buksan ang terminal sa root folder ng project.
Una, gumawa ng virtual environment gamit ang command na:
`python -m venv .venv`
I-activate ang virtual environment. Sa Windows PowerShell, i-type ang:
`.venv\Scripts\activate`

Pangalawa, i-install ang Python packages gamit ang:
`pip install -r requirements.txt`

Pangatlo, i-set up ang environment file. I-copy ang dot env example papuntang dot env gamit ang:
`Copy-Item .env.example .env`
Siguraduhin na ang MySQL settings sa dot env file ay tugma sa XAMPP mo. Default nito ay host 127.0.0.1, port 3306, user root, at walang password.

Pang-apat, buuin ang database at i-populate ang seed data. Patakbuhin ang:
`python scripts/create_mysql_db.py`
At sundan ito ng:
`python scripts/seed_db.py`
Awtomatikong gagawin ng command na ito ang lahat ng tables, roles, campuses, departments, test accounts, at training catalog.

Panlima, simulan ang FastAPI server gamit ang:
`uvicorn app.main:app --reload`
Available na ang backend API sa http://127.0.0.1:8000, at ang Swagger documentation sa http://127.0.0.1:8000/docs.

### Hakbang 2: Frontend Setup

Magbukas ng bagong terminal window at pumasok sa frontend folder gamit ang:
`cd frontend`

I-install ang packages gamit ang:
`npm install`

Kopyahin ang environment configuration gamit ang:
`Copy-Item .env.example .env.local`

At simulan ang Next.js development server gamit ang:
`npm run dev`

Bukas na ang frontend sa http://localhost:3000. Ang built-in Next.js proxy ang awtomatikong magko-connect sa frontend papunta sa FastAPI backend sa port 8000.

---

# Section 7: Paggamit ng Google Colab Notebook at Model Artifacts

Kung gusto mong mag-explore at mag-train ng Machine Learning model sa cloud nang libre, puwede mong gamitin ang aming Google Colab Notebook.

Nasa folder na `notebooks/` ang file na:
`QSU_Faculty_Training_Recommender_Colab.ipynb`.

Napakadali nitong gamitin bilang plug-and-play cloud training tool. Narito ang steps:

Pumunta sa Google Colab sa colab.research.google.com.
I-click ang File, piliin ang Upload Notebook, at i-upload ang ipynb file.
Sa menu bar, pindutin ang Runtime, at i-click ang Run All.
Kapag lumabas ang upload prompt, i-upload lang ang dataset file mula sa project: `data/raw/faculty_training.csv`.

Ang mga cells sa notebook ay sumusunod sa malinis na workflow:
Ang Cell 1 ay nag-i-install ng scikit-learn, joblib, at pandas.
Ang Cell 2 at 3 ay naglo-load ng dataset, nagpapakita ng statistics, label distribution charts, at missing value checks.
Ang Cell 4 ay nagpapatakbo ng Feature Engineering na kaparehong-kapareho ng logic sa ating backend.
Ang Cell 5 ay sinasanay ang Random Forest Multi-Label model.
Ang Cell 6 ay nagko-compute ng metrics tulad ng Micro F1, Macro F1, Precision, Recall, at nagpapakita ng bar chart ng per-class performance.
Ang Cell 6b ay isang interactive demo ng Transparent API response format.
At ang Cell 7 ay awtomatikong binabalot ang model artifacts sa isang zip file na may pangalang qsu model v timestamp dot zip.

### Paano I-deploy ang Model sa System?

Kapag na-download mo na ang zip file mula sa Colab, i-extract lang ang apat na files nito papunta sa `models/` directory ng backend:
Una, ang training recommender joblib file — ito ang trained pipeline.
Pangalawa, ang labels joblib file — ito ang label binarizer.
Pangatlo, ang metadata json file — naglalaman ng training metrics at parameters.
At pang-apat, ang active dot json file — ito ang pointer file na nagsasabi sa FastAPI kung aling version ng model ang gagamitin sa live inference.

Dahil binabasa ng system ang `models/active.json`, puwede tayong magpalit ng active model on-the-fly nang hindi na kailangang i-restart ang server.

---

# Section 8: Seeded Test Accounts at Interactive Features

Para mabilis nating ma-test ang iba't ibang roles nang hindi na kailangang gumawa ng bagong accounts, nag-seed na tayo ng ready-to-use test accounts.

Sa login page sa http://localhost:3000/login, may makikita kang drawer na Quick-Fill Test Accounts. Sa isang click lang ng button, kusa nang pupunan ang username at password fields.

Narito ang mga test accounts:

Para sa System Administrator:
Username: `admin`, Password: `admin123`.
Ito ay may system-wide access sa User Management, Catalog Management, ML Retraining, at Audit Logs.

Para sa Campus Administrators:
Diffun Campus: Username `admin_diffun`, Password `diffun123`.
Maddela Campus: Username `admin_maddela`, Password `maddela123`.
Cabarroguis Campus: Username `admin_cabarroguis`, Password `cabarroguis123`.
Scope nito ang buong campus, department oversight, faculty transfer, at campus recommendations.

Para sa Department Chairs:
BSIT Diffun Chair: Username `dept_bsit`, Password `dept123`.
BSED Diffun Chair: Username `dept_bsed`, Password `dept123`.
BSIT Maddela Chair: Username `dept_bsit_maddela`, Password `dept123`.
BSIT Cabarroguis Chair: Username `dept_bsit_cabarroguis`, Password `dept123`.

Para sa Faculty Test Accounts sa iba't ibang lifecycle stages:
Si Professor Santos sa BSIT Diffun, Password `faculty123`. Ang status niya ay has recommendation, kaya puwedeng makita agad ang top training recommendations at radar charts.
Si Professor Reyes sa BSIT Diffun, Password `faculty123`. Ang status niya ay eligible dahil tapos na ang required parts 1, 2, 3, 5, at 6, kaya handa nang subukan ang Run Recommendation button.
Si Professor Cruz sa BSIT Diffun, Password `faculty123`. Ang status niya ay in progress dahil Parts 1 at 2 pa lang ang tapos, para ma-test ang sequential step rules simula Part 3.
Si Professor Garcia sa BSIT Diffun, Password `faculty123`. Ang status niya ay not started para ma-test ang fresh onboarding experience mula Part 1.
May accounts din para kay Professor Torres sa BSED Diffun at Professor Navarro sa Maddela BSIT para sa cross-campus validation.

Gamit ang mga accounts na ito, napakadaling i-demo ang bawat feature ng system.

---

# Section 9: Thesis Methodology & Oral Defense Narrative

Honorable members of the thesis panel, academic advisers, colleagues, and guests, a very pleasant day to each of you. [...]

I will now present the formal research methodology, theoretical foundation, mathematical modeling, and evaluation framework of our study entitled: **"A Multi-Campus Faculty Training Needs Recommender System Utilizing Multi-Label Random Forest Classification and Transparent Catalog Synthesis for Quirino State University."**

### 1. Research Problem and Operational Motivation

Higher Education Institutions in the Philippines are mandated by the Commission on Higher Education to foster continuous faculty capability development. However, institutions operating across geographically distributed satellite campuses—such as Quirino State University across Diffun, Maddela, and Cabarroguis—face three persistent operational bottlenecks:

First, assessment data collected through unstandardized manual instruments result in protracted data consolidation cycles and delayed institutional planning.

Second, conventional frequency-based aggregation fails to capture non-linear, multidimensional interactions between professional demographics, competency proficiencies, emerging technological imperatives, and scheduling constraints.

And third, commercial off-the-shelf recommender systems function as opaque black boxes, violating institutional trust, faculty autonomy, and academic accreditation transparency standards.

Our research directly resolves these challenges by designing, engineering, and validating an end-to-end, multi-tier intelligent recommender architecture grounded in Design Science Research and the Cross-Industry Standard Process for Data Mining methodology.

### 2. Conceptual Framework and System Pipeline

Our conceptual model follows a structured Input-Process-Output paradigm:

Under Inputs, we capture high-dimensional assessment records comprising faculty demographics, historical training records, ordinal Likert ratings from one to five across twenty core, functional, and leadership competencies, nine emerging technology needs, nine delivery modalities, five temporal schedules, and seven institutional barriers.

Under Process, the system executes four sequential stages:
Stage one: Automated pre-processing, imputation, and column transformations;
Stage two: Multi-label Random Forest classification with One-vs-Rest decomposition;
Stage three: Contextual catalog synthesis with preference-matching heuristics; and
Stage four: Multi-level hierarchical aggregation across individual, departmental, and campus scopes.

Under Outputs, the system surfaces transparent posterior probability distributions, calibrated match scores ranging from zero to ninety-nine percent, explainability rationale statements, and aggregated institutional priority rosters.

### 3. Machine Learning Formulation and Multi-Label Modeling

In our mathematical formulation, each faculty respondent is represented as a high-dimensional feature vector x in real space of approximately seventy dimensions. This vector comprises numerical vectors scaled through standard z-score normalization, where z equals x minus mu divided by sigma, and categorical vectors mapped into binary indicator dimensions through one-hot encoding.

Unlike traditional single-label recommendation problems, faculty professional development is inherently multi-label: a faculty member concurrently requires professional development across multiple distinct competencies. Let our target label space be defined across nine priority professional development domains: Research Methods, Educational Technology, Artificial Intelligence, Outcomes-Based Education, Data Analytics, Leadership and Management, Quality Assurance, Cybersecurity, and Instructional Design.

Each faculty instance is associated with a binary label vector y in binary space of dimension nine, derived from the respondent's actual Top Five priority choices.

To model this space, we employ an ensemble of decorrelated decision trees through a Random Forest Classifier paired with One-vs-Rest decomposition. The ensemble comprises four hundred estimators, parameterized with a minimum samples leaf of two, and subsample-balanced class weights to counterbalance empirical class imbalance across specialized academic disciplines.

### 4. Critical Safeguard: Prevention of Target Leakage

A paramount methodological contribution of this research concerns the strict mathematical prevention of Target Leakage.

In naively constructed educational recommender systems, researchers frequently compute the competency gap by subtracting proficiency from importance, and subsequently derive the target training label directly from this arithmetic difference.

When target labels are derived from an input feature gap, the machine learning classifier merely learns a trivial arithmetic identity rather than genuine latent preferences. This produces artificially inflated training accuracies of ninety-nine percent that immediately collapse when deployed in real-world scenarios.

In our methodology, the target labels y are strictly and independently established by the faculty member's stated top priorities from Part VIII of the survey instrument. The competency proficiency and importance ratings remain exclusively on the feature input side. This rigorous decoupling guarantees true empirical generalization.

### 5. Transparent Catalog Synthesis Formulation

Our machine learning model outputs calibrated posterior probabilities for each category given the faculty feature vector. To bridge the gap between abstract academic categories and tangible university course offerings, we formulate a deterministic Matching Function.

For each active catalog program j associated with a predicted category, the final match score is computed as the minimum of zero point nine nine, and the sum of the predicted category probability plus our empirical preference bonuses.

Specifically, these bonuses are bounded as follows:
A three percent bonus is awarded if the delivery modality of the course intersects with the faculty member's preferred modalities;
A two percent bonus is awarded if the offering schedule aligns with the faculty member's preferred schedule;
A two percent bonus is awarded if the course duration matches the preferred duration; and
An additional three percent bonus is awarded if the target competency of the program directly addresses an identified competency gap where importance exceeds current proficiency.

This mathematical separation ensures that university administrators can modify, introduce, or deactivate courses in the database without necessitating costly and disruptive model retraining cycles.

### 6. Quantitative Evaluation and Benchmarking Framework

Our evaluation protocol employs a held-out test split of twenty percent, evaluated against four primary quantitative metrics:

First, Micro-averaged and Macro-averaged F-one scores, defined as twice precision times recall divided by precision plus recall, accounting for global accuracy and rare-class resilience respectively.
Second, Precision and Recall at rank k, specifically Recall at five, ensuring that relevant institutional training categories are represented within the top five recommendations.
And third, Normalized Discounted Cumulative Gain at rank k to evaluate ranking sensitivity.

Furthermore, our model's performance is systematically benchmarked against a Heuristic Baseline based on direct competency gap ranking, and validated against the actual respondent ground truth.

### 7. Ethical Compliance, Governance, and Conclusion

In full compliance with Republic Act 10173, known as the Philippine Data Privacy Act of 2012:
All faculty records undergo rigorous anonymization through surrogate relational identifiers;
Raw survey inputs are compartmentalized in isolated database tables; and
All transactional modifications, recommendation requests, and administrative transfers generate immutable, timestamped audit log trails recording IP addresses and differential JSON changes.

In conclusion, the Quirino State University Faculty Training Needs Recommender System Version 3.0 successfully demonstrates how modern web engineering, role-governed multi-campus data isolation, and transparent, multi-label machine learning can be synthesized into an institutional decision-support system. It transforms faculty development from an administrative chore into a transparent, personalized, and data-driven catalyst for academic excellence.

Thank you very much, and we are now ready for the questions and constructive recommendations of the distinguished panel.
