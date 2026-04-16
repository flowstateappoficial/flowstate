// ── SUPABASE CONFIG ──
export const SUPABASE_URL = 'https://myjgthxaldqiwxgnxjvd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_bnZApFw7Xo8NnEYr6A6SWA_1Epx6b4H';

// ── LOCALSTORAGE KEYS ──
export const LS_TXS = 'fuga_txs_v1';
export const LS_META = 'fuga_meta_v1';
export const LS_OBJ = 'fs_objetivos_v1';
export const LS_ATIVOS = 'fs_ativos_v2';
export const LS_FE = 'fs_fe_v2';
export const LS_RULES = 'fs_custom_rules_v1';
export const LS_PLAN = 'fs_plan_v1';
export const LS_ONBOARDED = 'fs_onboarded_v1';
export const LS_BUDGET = 'fs_budget_v1';
export const LS_RENDIMENTO = 'fs_rendimento_v1';

// ── CATEGORIES ──
export const CATS = ['Alimentação','Habitação','Transportes','Lazer','Saúde','Investimento','Poupança','Rendimento','Outro'];

export const CC = {
  Alimentação:'#00D764', Habitação:'#7b7fff', Transportes:'#00b4d8',
  Lazer:'#f7931a', Saúde:'#ff6b9d', Investimento:'#06d6a0',
  Poupança:'#06d6a0', Rendimento:'#00D764', Outro:'#6e7491'
};

export const CB = {
  Alimentação:'rgba(0,215,100,.15)', Habitação:'rgba(123,127,255,.15)',
  Transportes:'rgba(0,180,216,.15)', Lazer:'rgba(247,147,26,.15)',
  Saúde:'rgba(255,107,157,.15)', Investimento:'rgba(6,214,160,.15)',
  Poupança:'rgba(6,214,160,.15)', Rendimento:'rgba(0,215,100,.15)',
  Outro:'rgba(110,116,145,.15)'
};

export const TIPO_COLORS = {
  ETF:'#00D764', PPR:'#7b7fff', 'Ação':'#00b4d8',
  Crypto:'#f7931a', 'Obrigação':'#ff6b9d', 'Imobiliário':'#e53935', Outro:'#6e7491'
};

export const KW = {
  Rendimento:['vencimento','salario','salário','ordenado','subsidio','reembolso irs','trf recebida','recebimento','payroll','wages','income','dividendo'],
  Habitação:['renda','condominio','condomínio','epal','edp','galp gas','vodafone','nos internet','meo','seguro habitação','agua','luz','gas','internet'],
  Alimentação:['pingo doce','continente','lidl','aldi','mercadona','minipreço','intermarche','supermercado','jumbo','cafe','restaurante','mcdonald','kfc','burger king','subway','wolt','glovo','uber eats','padaria','pastelaria','tasca','pizza','sushi','takeaway','bakery','grocery'],
  Transportes:['galp combustivel','repsol','bp fuel','shell','via verde','metro','cp comboios','cp portugal','uber','bolt taxi','carris','stcp','ryanair','easyjet','tap','portagem','autoestrada','brisa','parking','parque estacionamento','seguro automovel','inspeção'],
  Saúde:['farmácia','farmacia','clinica','hospital','centro de saude','fisioterapia','psicologia','dentista','oftalmologia','analises','unilabs','germano mota','medis','multicare','ageas','ginásio','gym','health club','vitaminas','suplementos'],
  Lazer:['netflix','spotify','apple tv','disney','hbo','prime video','youtube premium','twitch','steam','playstation','xbox','fnac','worten','cinema','teatro','museu','concerto','ubbo','time out','bowling','escape room'],
  Subscrições:['google storage','icloud','microsoft 365','adobe','dropbox','notion','chatgpt','claude','openai','canva','github','mailchimp'],
  Compras:['amazon','aliexpress','zara','h&m','primark','shein','mango','decathlon','sport zone','ikea','leroy merlin','nike','adidas','el corte ingles'],
  Educação:['faculdade','universidade','escola','udemy','coursera','linkedin learning','propinas'],
  Investimento:['degiro','trade republic','etoro','vanguard','etf','ppr','fundo investimento','bolsa','crypto','coinbase','binance','kraken'],
};

export const KW_VENC = ['vencimento','ordenado','salário','salario','salary'];

export const BUDGET_CATS = [
  {cat:'Habitação',   pct:.30, emoji:'🏠'},
  {cat:'Alimentação', pct:.15, emoji:'🛒'},
  {cat:'Transportes', pct:.10, emoji:'🚗'},
  {cat:'Saúde',       pct:.05, emoji:'💊'},
  {cat:'Lazer',       pct:.10, emoji:'🎬'},
  {cat:'Poupança',    pct:.20, emoji:'💰'},
  {cat:'Outro',       pct:.10, emoji:'📦'},
];

export const PRICES = {
  plus:    { mensal: 3.99,  anual: 2.99  },
  freedom: { mensal: 7.99,  anual: 5.99  }
};

export const PT_M = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export const PT_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── IMPORT DETECTION KEYWORDS ──
export const COL_DATE_KW = ['data','date','datum','fecha','dat movim','value date','booking'];
export const COL_DESC_KW = ['descri','descr','memo','narrat','referenc','detail','movement','motivo','payee','merchant'];
export const COL_VAL_KW = ['montante','valor','amount','quantia','importe','transaction amount'];
export const COL_DEBIT_KW = ['débito','debit','saída','saidas','charge','withdrawal'];
export const COL_CREDIT_KW = ['crédito','credit','entrada','entradas','deposit','payment in'];

// ── LEGAL CONTENT ──
export const LEGAL_CONTENT = {
  termos: {
    title: 'Termos e Condições',
    body: `<p style="margin-bottom:1.25rem;"><strong style="color:#fff;">Última atualização:</strong> Abril 2026</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">1. Serviço</strong><br>O FLOWSTATE é uma aplicação de gestão financeira pessoal. Ao criares uma conta, aceitas estes termos. O serviço é prestado tal como está, podendo ser atualizado a qualquer momento.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">2. Subscrições e Pagamentos</strong><br>Os planos pagos (Flow Plus e Flow Max) são cobrados mensalmente ou anualmente, conforme escolheres, com renovação automática até cancelares. Os preços incluem IVA à taxa legal em vigor em Portugal. Podes cancelar a qualquer momento sem penalização — a subscrição mantém-se ativa até ao fim do período já pago.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">3. Direito de Arrependimento</strong><br>Nos termos do Decreto-Lei n.º 24/2014, tens 14 dias após a primeira cobrança para solicitar o reembolso total, sem necessidade de justificação. Para exercer este direito, contacta-nos em suporte@flowstate.app.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">4. Trial Gratuito</strong><br>O período de 7 dias gratuito está disponível para novos utilizadores. Não é cobrado qualquer valor durante o trial. Podes cancelar antes do fim do trial sem qualquer custo.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">5. Responsabilidade</strong><br>O FLOWSTATE é uma ferramenta de acompanhamento financeiro pessoal e não constitui aconselhamento financeiro, fiscal ou de investimento. As decisões financeiras são da exclusiva responsabilidade do utilizador.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">6. Conta e Segurança</strong><br>És responsável pela confidencialidade das tuas credenciais de acesso. Em caso de uso não autorizado da tua conta, deves notificar-nos imediatamente.</p>
<p><strong style="color:#fff;">7. Contacto</strong><br>Para qualquer questão: suporte@flowstate.app</p>`
  },
  privacidade: {
    title: 'Política de Privacidade',
    body: `<p style="margin-bottom:1.25rem;"><strong style="color:#fff;">Última atualização:</strong> Abril 2026</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">1. Responsável pelo Tratamento</strong><br>FLOWSTATE — suporte@flowstate.app. Os teus dados são tratados em conformidade com o RGPD (Regulamento UE 2016/679) e a legislação portuguesa aplicável.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">2. Dados que Recolhemos</strong><br>Recolhemos o teu e-mail e dados de autenticação (via Supabase). Os dados financeiros que introduzes (transações, investimentos, objetivos) são armazenados de forma segura e encriptada, associados à tua conta, e nunca são partilhados com terceiros.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">3. Finalidade do Tratamento</strong><br>Os teus dados são usados exclusivamente para prestar o serviço FLOWSTATE — guardar e mostrar as tuas informações financeiras. Não vendemos, cedemos nem usamos os teus dados para publicidade.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">4. Base Legal</strong><br>O tratamento baseia-se na execução do contrato de serviço (Art. 6.º, n.º 1, al. b) do RGPD) e no teu consentimento para funcionalidades opcionais.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">5. Conservação dos Dados</strong><br>Os teus dados são conservados enquanto mantiveres conta ativa. Após cancelamento, os dados são eliminados no prazo de 30 dias, salvo obrigação legal de conservação.</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">6. Os Teus Direitos</strong><br>Tens direito a aceder, corrigir, apagar, portabilizar e opor-te ao tratamento dos teus dados. Para exercer estes direitos: suporte@flowstate.app. Podes também apresentar reclamação à CNPD (www.cnpd.pt).</p>
<p style="margin-bottom:1rem;"><strong style="color:#fff;">7. Segurança</strong><br>Utilizamos encriptação em trânsito (SSL/TLS) e em repouso. A autenticação é gerida pela Supabase, plataforma certificada SOC 2 Tipo II.</p>
<p><strong style="color:#fff;">8. Cookies</strong><br>Usamos apenas cookies técnicos essenciais ao funcionamento da aplicação. Não usamos cookies de rastreamento ou publicidade.</p>`
  }
};
