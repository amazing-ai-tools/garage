import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Activity,
  CalendarClock,
  Car,
  CircleDollarSign,
  Gauge,
  LogIn,
  LogOut,
  Moon,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sun,
  Wrench,
} from 'lucide-react';
import {
  buildApiUrl,
  createGarageRecord,
  CurrentUser,
  GarageData,
  loadCurrentUser,
  loadGarageData,
  loadUserPreferences,
  logout,
  saveUserPreferences,
  Vehicle,
} from './garage';
import {
  countryOptions,
  currencyOptions,
  formatCostPerKm,
  formatCurrency,
  formatDistance,
  getInitialPreferences,
  languageOptions,
  preferenceStorageKey,
  serializePreferences,
  UserPreferences,
} from './preferences';
import { getInitialTheme, themeStorageKey, toggleTheme, ThemeMode } from './theme';
import { unavailableServiceCopy } from './uiCopy';
import './styles.css';

const bugzeroAppKey = import.meta.env.VITE_BUGZERO_APP_KEY || '';
const bugzeroWidgetUrl =
  import.meta.env.VITE_BUGZERO_WIDGET_URL || 'https://bugzero.amazing-ai.tools/widget.js';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function ensureBugZeroWidget() {
  if (!bugzeroAppKey || document.querySelector('script[data-bugzero-widget]')) {
    return;
  }

  if (window.matchMedia('(max-width: 760px)').matches) {
    return;
  }

  const script = document.createElement('script');
  script.src = bugzeroWidgetUrl;
  script.async = true;
  script.dataset.bugzeroWidget = 'true';
  script.dataset.appKey = bugzeroAppKey;
  document.body.appendChild(script);
}

type VehicleFormState = {
  name: string;
  make: string;
  model: string;
  year: string;
  odometer_km: string;
};

type ExpenseFormState = {
  vehicle_id: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  odometer_km: string;
};

type PartFormState = {
  vehicle_id: string;
  date: string;
  name: string;
  brand: string;
  reference: string;
  cost: string;
};

type ReminderFormState = {
  vehicle_id: string;
  title: string;
  due_date: string;
  due_odometer_km: string;
};

const today = new Date().toISOString().slice(0, 10);
const defaultVehicleForm: VehicleFormState = { name: '', make: '', model: '', year: '', odometer_km: '' };
const defaultExpenseForm: ExpenseFormState = {
  vehicle_id: '',
  date: today,
  category: 'Entretien',
  description: '',
  amount: '',
  odometer_km: '',
};
const defaultPartForm: PartFormState = {
  vehicle_id: '',
  date: today,
  name: '',
  brand: '',
  reference: '',
  cost: '',
};
const defaultReminderForm: ReminderFormState = {
  vehicle_id: '',
  title: '',
  due_date: '',
  due_odometer_km: '',
};

function selectVehicleName(vehicles: Vehicle[], vehicleId: number): string {
  return vehicles.find((vehicle) => vehicle.id === vehicleId)?.name || 'Vehicule';
}

const copy = {
  en: {
    brand: 'Private atelier',
    checkingTitle: 'Checking your session',
    checkingText: 'Opening your secure garage notebook...',
    heroTitle: 'A clear service record for every vehicle.',
    heroText:
      'Track maintenance, parts, expenses, and reminders in a calm workspace connected to your Google account.',
    continueGoogle: 'Continue with Google',
    previewLabel: 'Garage notebook',
    upToDate: 'UP TO DATE',
    nextDue: 'Next due',
    inspection: 'Technical inspection',
    previewMeta: 'In 18 days - Ford Transit',
    vehicles: 'Vehicles',
    reminders: 'Reminders',
    dashboard: 'Garage dashboard',
    pilot: 'Driver',
    googleSession: 'Google session',
    refresh: 'Refresh',
    logout: 'Sign out',
    expensesTotal: 'Total expenses',
    openReminders: 'Open reminders',
    costPerKm: 'Main cost/km',
    unavailable: 'Not available',
    fleetEyebrow: 'Fleet',
    activeGarage: 'Active garage',
    emptyVehicles: 'Add your first vehicle to start tracking expenses and reminders.',
    newVehicle: 'New vehicle',
    vehicleNamePlaceholder: 'Name: Daily, work van...',
    make: 'Make',
    model: 'Model',
    year: 'Year',
    odometer: 'Odometer',
    add: 'Add',
    expense: 'Expense',
    chooseVehicle: 'Choose a vehicle',
    category: 'Category',
    description: 'Description',
    amount: 'Amount',
    save: 'Save',
    partChanged: 'Changed part',
    part: 'Part',
    brandField: 'Brand',
    reference: 'Reference',
    cost: 'Cost',
    reminder: 'Reminder',
    reminderPlaceholder: 'Inspection, oil change...',
    limitKm: 'Km limit',
    schedule: 'Schedule',
    recentExpenses: 'Recent expenses',
    noExpenses: 'No expenses recorded.',
    noReminders: 'No open reminders.',
    parts: 'Parts',
    noParts: 'No parts tracked.',
    noReference: 'No reference',
    date: 'Date',
    loading: 'Loading',
    preferences: 'Preferences',
    language: 'Language',
    country: 'Country',
    currency: 'Currency',
  },
  'fr-CA': {
    brand: 'Atelier privé',
    checkingTitle: 'Vérification de la session',
    checkingText: 'Ouverture sécurisée de ton carnet de garage...',
    heroTitle: 'Le carnet clair de tous tes véhicules.',
    heroText:
      'Suis entretiens, pièces, dépenses et rappels dans un espace calme, relié à ton compte Google.',
    continueGoogle: 'Continuer avec Google',
    previewLabel: 'Carnet garage',
    upToDate: 'À JOUR',
    nextDue: 'Prochaine échéance',
    inspection: 'Contrôle technique',
    previewMeta: 'Dans 18 jours - Ford Transit',
    vehicles: 'Véhicules',
    reminders: 'Rappels',
    dashboard: 'Tableau de bord garage',
    pilot: 'Pilote',
    googleSession: 'Session Google',
    refresh: 'Rafraîchir',
    logout: 'Se déconnecter',
    expensesTotal: 'Dépenses totales',
    openReminders: 'Rappels ouverts',
    costPerKm: 'Coût/km principal',
    unavailable: 'Non disponible',
    fleetEyebrow: 'Parc',
    activeGarage: 'Garage actif',
    emptyVehicles: 'Ajoute ton premier véhicule pour activer les dépenses et rappels.',
    newVehicle: 'Nouveau véhicule',
    vehicleNamePlaceholder: 'Nom: Daily, van atelier...',
    make: 'Marque',
    model: 'Modèle',
    year: 'Année',
    odometer: 'Kilométrage',
    add: 'Ajouter',
    expense: 'Dépense',
    chooseVehicle: 'Choisir un véhicule',
    category: 'Catégorie',
    description: 'Description',
    amount: 'Montant',
    save: 'Enregistrer',
    partChanged: 'Pièce changée',
    part: 'Pièce',
    brandField: 'Marque',
    reference: 'Référence',
    cost: 'Coût',
    reminder: 'Rappel',
    reminderPlaceholder: 'Contrôle technique, vidange...',
    limitKm: 'Km limite',
    schedule: 'Planifier',
    recentExpenses: 'Dépenses récentes',
    noExpenses: 'Aucune dépense enregistrée.',
    noReminders: 'Aucun rappel ouvert.',
    parts: 'Pièces',
    noParts: 'Aucune pièce suivie.',
    noReference: 'Sans référence',
    date: 'Date',
    loading: 'Chargement',
    preferences: 'Préférences',
    language: 'Langue',
    country: 'Pays',
    currency: 'Devise',
  },
  pt: {
    brand: 'Atelier privado',
    checkingTitle: 'Verificando a sessão',
    checkingText: 'Abrindo seu caderno de garagem com segurança...',
    heroTitle: 'Um histórico claro para todos os seus veículos.',
    heroText:
      'Acompanhe manutenções, peças, despesas e lembretes em um espaço calmo conectado à sua conta Google.',
    continueGoogle: 'Continuar com Google',
    previewLabel: 'Caderno da garagem',
    upToDate: 'ATUALIZADO',
    nextDue: 'Próximo prazo',
    inspection: 'Inspeção técnica',
    previewMeta: 'Em 18 dias - Ford Transit',
    vehicles: 'Veículos',
    reminders: 'Lembretes',
    dashboard: 'Painel da garagem',
    pilot: 'Motorista',
    googleSession: 'Sessão Google',
    refresh: 'Atualizar',
    logout: 'Sair',
    expensesTotal: 'Despesas totais',
    openReminders: 'Lembretes abertos',
    costPerKm: 'Custo/km principal',
    unavailable: 'Indisponível',
    fleetEyebrow: 'Frota',
    activeGarage: 'Garagem ativa',
    emptyVehicles: 'Adicione seu primeiro veículo para ativar despesas e lembretes.',
    newVehicle: 'Novo veículo',
    vehicleNamePlaceholder: 'Nome: Daily, van oficina...',
    make: 'Marca',
    model: 'Modelo',
    year: 'Ano',
    odometer: 'Quilometragem',
    add: 'Adicionar',
    expense: 'Despesa',
    chooseVehicle: 'Escolha um veículo',
    category: 'Categoria',
    description: 'Descrição',
    amount: 'Valor',
    save: 'Salvar',
    partChanged: 'Peça trocada',
    part: 'Peça',
    brandField: 'Marca',
    reference: 'Referência',
    cost: 'Custo',
    reminder: 'Lembrete',
    reminderPlaceholder: 'Inspeção, troca de óleo...',
    limitKm: 'Km limite',
    schedule: 'Agendar',
    recentExpenses: 'Despesas recentes',
    noExpenses: 'Nenhuma despesa registrada.',
    noReminders: 'Nenhum lembrete aberto.',
    parts: 'Peças',
    noParts: 'Nenhuma peça acompanhada.',
    noReference: 'Sem referência',
    date: 'Data',
    loading: 'Carregando',
    preferences: 'Preferências',
    language: 'Idioma',
    country: 'País',
    currency: 'Moeda',
  },
  es: {
    brand: 'Atelier privado',
    checkingTitle: 'Verificando la sesión',
    checkingText: 'Abriendo tu cuaderno de garaje de forma segura...',
    heroTitle: 'Un historial claro para todos tus vehículos.',
    heroText:
      'Controla mantenimiento, piezas, gastos y recordatorios en un espacio tranquilo conectado a tu cuenta Google.',
    continueGoogle: 'Continuar con Google',
    previewLabel: 'Cuaderno del garaje',
    upToDate: 'AL DÍA',
    nextDue: 'Próximo vencimiento',
    inspection: 'Inspección técnica',
    previewMeta: 'En 18 días - Ford Transit',
    vehicles: 'Vehículos',
    reminders: 'Recordatorios',
    dashboard: 'Panel del garaje',
    pilot: 'Conductor',
    googleSession: 'Sesión Google',
    refresh: 'Actualizar',
    logout: 'Cerrar sesión',
    expensesTotal: 'Gastos totales',
    openReminders: 'Recordatorios abiertos',
    costPerKm: 'Costo/km principal',
    unavailable: 'No disponible',
    fleetEyebrow: 'Flota',
    activeGarage: 'Garaje activo',
    emptyVehicles: 'Agrega tu primer vehículo para activar gastos y recordatorios.',
    newVehicle: 'Nuevo vehículo',
    vehicleNamePlaceholder: 'Nombre: Daily, van taller...',
    make: 'Marca',
    model: 'Modelo',
    year: 'Año',
    odometer: 'Kilometraje',
    add: 'Agregar',
    expense: 'Gasto',
    chooseVehicle: 'Elegir un vehículo',
    category: 'Categoría',
    description: 'Descripción',
    amount: 'Importe',
    save: 'Guardar',
    partChanged: 'Pieza cambiada',
    part: 'Pieza',
    brandField: 'Marca',
    reference: 'Referencia',
    cost: 'Costo',
    reminder: 'Recordatorio',
    reminderPlaceholder: 'Inspección, cambio de aceite...',
    limitKm: 'Km límite',
    schedule: 'Programar',
    recentExpenses: 'Gastos recientes',
    noExpenses: 'No hay gastos registrados.',
    noReminders: 'No hay recordatorios abiertos.',
    parts: 'Piezas',
    noParts: 'No hay piezas registradas.',
    noReference: 'Sin referencia',
    date: 'Fecha',
    loading: 'Cargando',
    preferences: 'Preferencias',
    language: 'Idioma',
    country: 'País',
    currency: 'Moneda',
  },
} as const;

type PreferenceLabels = {
  preferences: string;
  language: string;
  country: string;
  currency: string;
};

function readSystemThemePreference(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function useThemeMode() {
  const [theme, setTheme] = React.useState<ThemeMode>(() =>
    getInitialTheme(window.localStorage.getItem(themeStorageKey), readSystemThemePreference()),
  );

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((currentTheme) => toggleTheme(currentTheme)),
  };
}

function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const isDark = theme === 'dark';

  return (
    <button className="theme-toggle" type="button" onClick={onToggle} aria-label="Changer le theme">
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
    </button>
  );
}

function useUserPreferences() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(() =>
    getInitialPreferences(window.localStorage.getItem(preferenceStorageKey)),
  );

  React.useEffect(() => {
    window.localStorage.setItem(preferenceStorageKey, serializePreferences(preferences));
    document.documentElement.lang = preferences.language;
  }, [preferences]);

  return { preferences, setPreferences };
}

function PreferenceControls({
  preferences,
  labels,
  onChange,
}: {
  preferences: UserPreferences;
  labels: PreferenceLabels;
  onChange: (preferences: UserPreferences) => void;
}) {
  function updateCountry(country: UserPreferences['country']) {
    const countryOption = countryOptions.find((option) => option.value === country);
    onChange({
      ...preferences,
      country,
      currency: countryOption?.defaultCurrency ?? preferences.currency,
    });
  }

  return (
    <fieldset className="preference-controls" aria-label={labels.preferences}>
      <label>
        <span>{labels.language}</span>
        <select
          value={preferences.language}
          onChange={(event) =>
            onChange({ ...preferences, language: event.target.value as UserPreferences['language'] })
          }
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{labels.country}</span>
        <select value={preferences.country} onChange={(event) => updateCountry(event.target.value as UserPreferences['country'])}>
          {countryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{labels.currency}</span>
        <select
          value={preferences.currency}
          onChange={(event) =>
            onChange({ ...preferences, currency: event.target.value as UserPreferences['currency'] })
          }
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

function VehicleSelect({
  vehicles,
  value,
  onChange,
  placeholder,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required>
      <option value="">{placeholder}</option>
      {vehicles.map((vehicle) => (
        <option key={vehicle.id} value={vehicle.id}>
          {vehicle.name}
        </option>
      ))}
    </select>
  );
}

function App() {
  const { theme, toggle } = useThemeMode();
  const { preferences, setPreferences } = useUserPreferences();
  const t = copy[preferences.language];
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [data, setData] = React.useState<GarageData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = React.useState(defaultVehicleForm);
  const [expenseForm, setExpenseForm] = React.useState(defaultExpenseForm);
  const [partForm, setPartForm] = React.useState(defaultPartForm);
  const [reminderForm, setReminderForm] = React.useState(defaultReminderForm);

  const updatePreferences = React.useCallback(
    async (nextPreferences: UserPreferences) => {
      setPreferences(nextPreferences);
      if (currentUser) {
        try {
          const savedPreferences = await saveUserPreferences(apiBaseUrl, nextPreferences);
          setPreferences(savedPreferences);
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : 'Preference update failed');
        }
      }
    },
    [currentUser, setPreferences],
  );

  React.useEffect(() => {
    ensureBugZeroWidget();
  }, []);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextData = await loadGarageData(apiBaseUrl);
      setData(nextData);
      const firstVehicleId = String(nextData.vehicles[0]?.id || '');
      setExpenseForm((current) => ({ ...current, vehicle_id: current.vehicle_id || firstVehicleId }));
      setPartForm((current) => ({ ...current, vehicle_id: current.vehicle_id || firstVehicleId }));
      setReminderForm((current) => ({ ...current, vehicle_id: current.vehicle_id || firstVehicleId }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur API inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    async function bootstrap() {
      setIsCheckingAuth(true);
      setError(null);
      try {
        const user = await loadCurrentUser(apiBaseUrl);
        if (user) {
          const savedPreferences = await loadUserPreferences(apiBaseUrl);
          setPreferences(savedPreferences);
          setCurrentUser(user);
          await refresh();
        } else {
          setCurrentUser(null);
        }
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Erreur auth inconnue');
      } finally {
        setIsCheckingAuth(false);
        setIsLoading(false);
      }
    }

    bootstrap();
  }, [refresh]);

  async function submitLogout() {
    await logout(apiBaseUrl);
    setCurrentUser(null);
    setData(null);
  }

  async function submitVehicle(event: React.FormEvent) {
    event.preventDefault();
    await createGarageRecord(apiBaseUrl, '/api/vehicles', {
      ...vehicleForm,
      year: vehicleForm.year ? Number(vehicleForm.year) : null,
      odometer_km: Number(vehicleForm.odometer_km || 0),
    });
    setVehicleForm(defaultVehicleForm);
    await refresh();
  }

  async function submitExpense(event: React.FormEvent) {
    event.preventDefault();
    await createGarageRecord(apiBaseUrl, '/api/expenses', {
      ...expenseForm,
      vehicle_id: Number(expenseForm.vehicle_id),
      odometer_km: expenseForm.odometer_km ? Number(expenseForm.odometer_km) : null,
    });
    setExpenseForm((current) => ({ ...defaultExpenseForm, vehicle_id: current.vehicle_id }));
    await refresh();
  }

  async function submitPart(event: React.FormEvent) {
    event.preventDefault();
    await createGarageRecord(apiBaseUrl, '/api/parts', {
      ...partForm,
      vehicle_id: Number(partForm.vehicle_id),
      brand: partForm.brand || null,
      reference: partForm.reference || null,
      cost: partForm.cost || null,
    });
    setPartForm((current) => ({ ...defaultPartForm, vehicle_id: current.vehicle_id }));
    await refresh();
  }

  async function submitReminder(event: React.FormEvent) {
    event.preventDefault();
    await createGarageRecord(apiBaseUrl, '/api/reminders', {
      ...reminderForm,
      vehicle_id: Number(reminderForm.vehicle_id),
      due_date: reminderForm.due_date || null,
      due_odometer_km: reminderForm.due_odometer_km ? Number(reminderForm.due_odometer_km) : null,
      status: 'open',
    });
    setReminderForm((current) => ({ ...defaultReminderForm, vehicle_id: current.vehicle_id }));
    await refresh();
  }

  const summary = data?.summary;
  const firstVehicle = summary?.vehicles[0];
  const userLabel = currentUser ? currentUser.name || currentUser.email : '';
  const money = React.useCallback(
    (value: string | number | null | undefined) => formatCurrency(value, preferences),
    [preferences],
  );
  const distance = React.useCallback(
    (value: number | null | undefined) => formatDistance(value, preferences),
    [preferences],
  );

  if (isCheckingAuth) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-panel loading-card">
          <div className="auth-mini-top">
            <span className="brand-mark">G</span>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
          <span className="eyebrow">{t.brand}</span>
          <h1>{t.checkingTitle}</h1>
          <p>{t.checkingText}</p>
          <div className="loading-bar" aria-hidden="true" />
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-hero">
          <div className="auth-copy">
            <div className="auth-mini-top">
              <span className="brand-mark">G</span>
              <ThemeToggle theme={theme} onToggle={toggle} />
            </div>
            <span className="eyebrow">{t.brand}</span>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <PreferenceControls preferences={preferences} labels={t} onChange={updatePreferences} />
            {error ? <code>{error}</code> : null}
            <a className="login-button" href={buildApiUrl(apiBaseUrl, '/api/auth/google/login')}>
              <LogIn size={18} />
              {t.continueGoogle}
            </a>
          </div>
          <aside className="auth-dashboard" aria-label="Apercu garage">
            <div className="dash-topline">
              <span>{t.previewLabel}</span>
              <strong>{t.upToDate}</strong>
            </div>
            <div className="journal-card">
              <span>{t.nextDue}</span>
              <strong>{t.inspection}</strong>
              <small>{t.previewMeta}</small>
            </div>
            <div className="auth-stat-grid">
              <span>
                <b>4</b>
                {t.vehicles}
              </span>
              <span>
                <b>12</b>
                {t.reminders}
              </span>
              <span>
                <b>{formatCurrency(0.21, preferences)}</b>
                /km
              </span>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-cluster">
            <span className="brand-mark">G</span>
          <div>
            <span className="eyebrow">{t.brand}</span>
            <h1>{t.dashboard}</h1>
            <p className="user-line">{t.pilot}: {userLabel}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <PreferenceControls preferences={preferences} labels={t} onChange={updatePreferences} />
          <ThemeToggle theme={theme} onToggle={toggle} />
          <span className="session-pill">
            <ShieldCheck size={16} />
            {t.googleSession}
          </span>
          <button className="icon-button" type="button" onClick={refresh} aria-label={t.refresh}>
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" type="button" onClick={submitLogout} aria-label={t.logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error ? (
        <section className="notice error">
          <strong>{unavailableServiceCopy.title}</strong>
          <span>{unavailableServiceCopy.message}</span>
          <code>{error}</code>
        </section>
      ) : null}

      <section className="metric-grid" aria-label="Indicateurs garage">
        <article className="metric-card">
          <Car size={20} />
          <span>{t.vehicles}</span>
          <strong>{isLoading ? '...' : summary?.vehicle_count ?? 0}</strong>
        </article>
        <article className="metric-card highlight">
          <CircleDollarSign size={20} />
          <span>{t.expensesTotal}</span>
          <strong>{isLoading ? '...' : money(summary?.total_expenses)}</strong>
        </article>
        <article className="metric-card">
          <CalendarClock size={20} />
          <span>{t.openReminders}</span>
          <strong>{isLoading ? '...' : summary?.open_reminder_count ?? 0}</strong>
        </article>
        <article className="metric-card">
          <Gauge size={20} />
          <span>{t.costPerKm}</span>
          <strong>
            {firstVehicle
              ? formatCostPerKm(firstVehicle.expense_total, firstVehicle.odometer_km, preferences, t.unavailable)
              : t.unavailable}
          </strong>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="panel wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t.fleetEyebrow}</span>
              <h2>{t.activeGarage}</h2>
            </div>
            <Car size={22} />
          </div>
          <div className="vehicle-list">
            {data?.vehicles.length ? (
              data.vehicles.map((vehicle) => {
                const vehicleSummary = summary?.vehicles.find((item) => item.id === vehicle.id);
                return (
                  <article className="vehicle-row" key={vehicle.id}>
                    <div>
                      <strong>{vehicle.name}</strong>
                      <span>
                        {vehicle.make} {vehicle.model} {vehicle.year ? `- ${vehicle.year}` : ''}
                      </span>
                    </div>
                    <div>
                      <span>{distance(vehicle.odometer_km)}</span>
                      <span>{money(vehicleSummary?.expense_total)}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty">{t.emptyVehicles}</p>
            )}
          </div>
        </div>

        <form className="panel form-panel" onSubmit={submitVehicle}>
          <div className="panel-heading">
            <h2>{t.newVehicle}</h2>
            <Plus size={20} />
          </div>
          <input
            value={vehicleForm.name}
            onChange={(event) => setVehicleForm({ ...vehicleForm, name: event.target.value })}
            placeholder={t.vehicleNamePlaceholder}
            required
          />
          <div className="field-row">
            <input
              value={vehicleForm.make}
              onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })}
              placeholder={t.make}
              required
            />
            <input
              value={vehicleForm.model}
              onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })}
              placeholder={t.model}
              required
            />
          </div>
          <div className="field-row">
            <input
              value={vehicleForm.year}
              onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })}
              placeholder={t.year}
              type="number"
            />
            <input
              value={vehicleForm.odometer_km}
              onChange={(event) => setVehicleForm({ ...vehicleForm, odometer_km: event.target.value })}
              placeholder={t.odometer}
              type="number"
              min="0"
            />
          </div>
          <button type="submit">{t.add}</button>
        </form>
      </section>

      <section className="workspace-grid three">
        <form className="panel form-panel" onSubmit={submitExpense}>
          <div className="panel-heading">
            <h2>{t.expense}</h2>
            <CircleDollarSign size={20} />
          </div>
          <VehicleSelect
            vehicles={data?.vehicles ?? []}
            value={expenseForm.vehicle_id}
            onChange={(vehicle_id) => setExpenseForm({ ...expenseForm, vehicle_id })}
            placeholder={t.chooseVehicle}
          />
          <input
            type="date"
            value={expenseForm.date}
            onChange={(event) => setExpenseForm({ ...expenseForm, date: event.target.value })}
            required
          />
          <input
            value={expenseForm.category}
            onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}
            placeholder={t.category}
            required
          />
          <input
            value={expenseForm.description}
            onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })}
            placeholder={t.description}
            required
          />
          <div className="field-row">
            <input
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
              placeholder={t.amount}
              type="number"
              min="0"
              step="0.01"
              required
            />
            <input
              value={expenseForm.odometer_km}
              onChange={(event) => setExpenseForm({ ...expenseForm, odometer_km: event.target.value })}
              placeholder="Km"
              type="number"
              min="0"
            />
          </div>
          <button type="submit" disabled={!data?.vehicles.length}>
            {t.save}
          </button>
        </form>

        <form className="panel form-panel" onSubmit={submitPart}>
          <div className="panel-heading">
            <h2>{t.partChanged}</h2>
            <PackageCheck size={20} />
          </div>
          <VehicleSelect
            vehicles={data?.vehicles ?? []}
            value={partForm.vehicle_id}
            onChange={(vehicle_id) => setPartForm({ ...partForm, vehicle_id })}
            placeholder={t.chooseVehicle}
          />
          <input
            type="date"
            value={partForm.date}
            onChange={(event) => setPartForm({ ...partForm, date: event.target.value })}
            required
          />
          <input
            value={partForm.name}
            onChange={(event) => setPartForm({ ...partForm, name: event.target.value })}
            placeholder={t.part}
            required
          />
          <div className="field-row">
            <input
              value={partForm.brand}
              onChange={(event) => setPartForm({ ...partForm, brand: event.target.value })}
              placeholder={t.brandField}
            />
            <input
              value={partForm.reference}
              onChange={(event) => setPartForm({ ...partForm, reference: event.target.value })}
              placeholder={t.reference}
            />
          </div>
          <input
            value={partForm.cost}
            onChange={(event) => setPartForm({ ...partForm, cost: event.target.value })}
            placeholder={t.cost}
            type="number"
            min="0"
            step="0.01"
          />
          <button type="submit" disabled={!data?.vehicles.length}>
            {t.save}
          </button>
        </form>

        <form className="panel form-panel" onSubmit={submitReminder}>
          <div className="panel-heading">
            <h2>{t.reminder}</h2>
            <CalendarClock size={20} />
          </div>
          <VehicleSelect
            vehicles={data?.vehicles ?? []}
            value={reminderForm.vehicle_id}
            onChange={(vehicle_id) => setReminderForm({ ...reminderForm, vehicle_id })}
            placeholder={t.chooseVehicle}
          />
          <input
            value={reminderForm.title}
            onChange={(event) => setReminderForm({ ...reminderForm, title: event.target.value })}
            placeholder={t.reminderPlaceholder}
            required
          />
          <input
            type="date"
            value={reminderForm.due_date}
            onChange={(event) => setReminderForm({ ...reminderForm, due_date: event.target.value })}
          />
          <input
            value={reminderForm.due_odometer_km}
            onChange={(event) => setReminderForm({ ...reminderForm, due_odometer_km: event.target.value })}
            placeholder={t.limitKm}
            type="number"
            min="0"
          />
          <button type="submit" disabled={!data?.vehicles.length}>
            {t.schedule}
          </button>
        </form>
      </section>

      <section className="history-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>{t.recentExpenses}</h2>
            <Activity size={20} />
          </div>
          <ul className="event-list">
            {data?.expenses.length ? (
              data.expenses.slice(0, 6).map((expense) => (
                <li key={expense.id}>
                  <div>
                    <strong>{expense.description}</strong>
                    <span>
                      {selectVehicleName(data.vehicles, expense.vehicle_id)} - {expense.date}
                    </span>
                  </div>
                  <b>{money(expense.amount)}</b>
                </li>
              ))
            ) : (
              <li className="empty-line">
                <Wrench size={16} />
                {t.noExpenses}
              </li>
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t.reminders}</h2>
            <CalendarClock size={20} />
          </div>
          <ul className="event-list">
            {data?.reminders.length ? (
              data.reminders.slice(0, 6).map((reminder) => (
                <li key={reminder.id}>
                  <div>
                    <strong>{reminder.title}</strong>
                    <span>
                      {selectVehicleName(data.vehicles, reminder.vehicle_id)}
                      {reminder.due_date ? ` - ${reminder.due_date}` : ''}
                    </span>
                  </div>
                  <b>{reminder.due_odometer_km ? distance(reminder.due_odometer_km) : t.date}</b>
                </li>
              ))
            ) : (
              <li className="empty-line">
                <CalendarClock size={16} />
                {t.noReminders}
              </li>
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t.parts}</h2>
            <PackageCheck size={20} />
          </div>
          <ul className="event-list">
            {data?.parts.length ? (
              data.parts.slice(0, 6).map((part) => (
                <li key={part.id}>
                  <div>
                    <strong>{part.name}</strong>
                    <span>
                      {selectVehicleName(data.vehicles, part.vehicle_id)} - {part.reference || t.noReference}
                    </span>
                  </div>
                  <b>{part.cost ? money(part.cost) : '-'}</b>
                </li>
              ))
            ) : (
              <li className="empty-line">
                <PackageCheck size={16} />
                {t.noParts}
              </li>
            )}
          </ul>
        </article>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
