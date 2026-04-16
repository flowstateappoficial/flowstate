# FLOWSTATE — React

App de gestão financeira e literacia para portugueses.

## Setup

```bash
npm install
npm run dev
```

## Estrutura

```
src/
├── App.jsx              # App principal + state management
├── main.jsx             # Entry point
├── assets/
│   └── logo.js          # Logo base64
├── components/
│   ├── Navbar.jsx       # Navegação
│   ├── TransactionModal.jsx
│   ├── GoalModal.jsx
│   ├── AtivoModal.jsx
│   ├── OnboardingOverlay.jsx
│   ├── PaywallOverlay.jsx
│   └── LegalOverlay.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── AuthPage.jsx
│   ├── DashboardPage.jsx
│   ├── TransactionsPage.jsx
│   ├── InvestmentsPage.jsx
│   ├── CalculatorPage.jsx
│   └── PricingPage.jsx
├── utils/
│   ├── constants.js     # Configuração, categorias, keywords
│   ├── helpers.js       # Funções utilitárias
│   ├── supabase.js      # Cliente Supabase + CRUD
│   └── dicas.js         # Dicas financeiras diárias
└── styles/
    └── app.css          # CSS (1:1 com original)
```

## Tech Stack

- React 18 + Vite
- Supabase (auth + database)
- Chart.js (gráficos)
- xlsx (importação de extratos)
