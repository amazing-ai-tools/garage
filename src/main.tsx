import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalendarClock,
  Car,
  CircleDollarSign,
  Gauge,
  LogIn,
  LogOut,
  PackageCheck,
  Plus,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import {
  buildApiUrl,
  createGarageRecord,
  CurrentUser,
  formatEuros,
  GarageData,
  getCostPerKm,
  loadCurrentUser,
  loadGarageData,
  logout,
  Vehicle,
} from './garage';
import './styles.css';

const bugzeroAppKey = import.meta.env.VITE_BUGZERO_APP_KEY || '';
const bugzeroWidgetUrl =
  import.meta.env.VITE_BUGZERO_WIDGET_URL || 'https://bugzero.amazing-ai.tools/widget.js';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function ensureBugZeroWidget() {
  if (!bugzeroAppKey || document.querySelector('script[data-bugzero-widget]')) {
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

function VehicleSelect({
  vehicles,
  value,
  onChange,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required>
      <option value="">Choisir un vehicule</option>
      {vehicles.map((vehicle) => (
        <option key={vehicle.id} value={vehicle.id}>
          {vehicle.name}
        </option>
      ))}
    </select>
  );
}

function App() {
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [data, setData] = React.useState<GarageData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = React.useState(defaultVehicleForm);
  const [expenseForm, setExpenseForm] = React.useState(defaultExpenseForm);
  const [partForm, setPartForm] = React.useState(defaultPartForm);
  const [reminderForm, setReminderForm] = React.useState(defaultReminderForm);

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
        setCurrentUser(user);
        if (user) {
          await refresh();
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

  if (isCheckingAuth) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">Garage connecte</span>
          <h1>Verification de la session</h1>
          <p>Connexion au backend garage...</p>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">Garage prive</span>
          <h1>Connecte-toi avec Google</h1>
          <p>Ton parc, tes depenses, tes pieces et tes rappels restent associes a ton compte.</p>
          {error ? <code>{error}</code> : null}
          <a className="login-button" href={buildApiUrl(apiBaseUrl, '/api/auth/google/login')}>
            <LogIn size={18} />
            Continuer avec Google
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Garage connecte</span>
          <h1>Suivi vehicules, pieces et entretiens</h1>
          <p className="user-line">{currentUser.name || currentUser.email}</p>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={refresh} aria-label="Rafraichir">
            <RefreshCw size={18} />
          </button>
          <button className="icon-button" type="button" onClick={submitLogout} aria-label="Se deconnecter">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error ? (
        <section className="notice error">
          <strong>API indisponible.</strong>
          <span>Verifie que le backend VPS est lance et que VITE_API_BASE_URL pointe dessus.</span>
          <code>{error}</code>
        </section>
      ) : null}

      <section className="metric-grid" aria-label="Indicateurs garage">
        <article>
          <Car size={20} />
          <span>Vehicules</span>
          <strong>{isLoading ? '...' : summary?.vehicle_count ?? 0}</strong>
        </article>
        <article>
          <CircleDollarSign size={20} />
          <span>Depenses totales</span>
          <strong>{isLoading ? '...' : formatEuros(summary?.total_expenses)}</strong>
        </article>
        <article>
          <CalendarClock size={20} />
          <span>Rappels ouverts</span>
          <strong>{isLoading ? '...' : summary?.open_reminder_count ?? 0}</strong>
        </article>
        <article>
          <Gauge size={20} />
          <span>Cout/km principal</span>
          <strong>
            {firstVehicle ? getCostPerKm(firstVehicle.expense_total, firstVehicle.odometer_km) : 'Non disponible'}
          </strong>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="panel wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Parc</span>
              <h2>Vehicules</h2>
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
                      <span>{vehicle.odometer_km.toLocaleString('fr-FR')} km</span>
                      <span>{formatEuros(vehicleSummary?.expense_total)}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty">Ajoute ton premier vehicule pour activer les depenses et rappels.</p>
            )}
          </div>
        </div>

        <form className="panel form-panel" onSubmit={submitVehicle}>
          <div className="panel-heading">
            <h2>Nouveau vehicule</h2>
            <Plus size={20} />
          </div>
          <input
            value={vehicleForm.name}
            onChange={(event) => setVehicleForm({ ...vehicleForm, name: event.target.value })}
            placeholder="Nom: Daily, Van atelier..."
            required
          />
          <div className="field-row">
            <input
              value={vehicleForm.make}
              onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })}
              placeholder="Marque"
              required
            />
            <input
              value={vehicleForm.model}
              onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })}
              placeholder="Modele"
              required
            />
          </div>
          <div className="field-row">
            <input
              value={vehicleForm.year}
              onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })}
              placeholder="Annee"
              type="number"
            />
            <input
              value={vehicleForm.odometer_km}
              onChange={(event) => setVehicleForm({ ...vehicleForm, odometer_km: event.target.value })}
              placeholder="Kilometrage"
              type="number"
              min="0"
            />
          </div>
          <button type="submit">Ajouter</button>
        </form>
      </section>

      <section className="workspace-grid three">
        <form className="panel form-panel" onSubmit={submitExpense}>
          <div className="panel-heading">
            <h2>Depense</h2>
            <CircleDollarSign size={20} />
          </div>
          <VehicleSelect
            vehicles={data?.vehicles ?? []}
            value={expenseForm.vehicle_id}
            onChange={(vehicle_id) => setExpenseForm({ ...expenseForm, vehicle_id })}
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
            placeholder="Categorie"
            required
          />
          <input
            value={expenseForm.description}
            onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })}
            placeholder="Description"
            required
          />
          <div className="field-row">
            <input
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
              placeholder="Montant"
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
            Enregistrer
          </button>
        </form>

        <form className="panel form-panel" onSubmit={submitPart}>
          <div className="panel-heading">
            <h2>Piece changee</h2>
            <PackageCheck size={20} />
          </div>
          <VehicleSelect
            vehicles={data?.vehicles ?? []}
            value={partForm.vehicle_id}
            onChange={(vehicle_id) => setPartForm({ ...partForm, vehicle_id })}
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
            placeholder="Piece"
            required
          />
          <div className="field-row">
            <input
              value={partForm.brand}
              onChange={(event) => setPartForm({ ...partForm, brand: event.target.value })}
              placeholder="Marque"
            />
            <input
              value={partForm.reference}
              onChange={(event) => setPartForm({ ...partForm, reference: event.target.value })}
              placeholder="Reference"
            />
          </div>
          <input
            value={partForm.cost}
            onChange={(event) => setPartForm({ ...partForm, cost: event.target.value })}
            placeholder="Cout"
            type="number"
            min="0"
            step="0.01"
          />
          <button type="submit" disabled={!data?.vehicles.length}>
            Enregistrer
          </button>
        </form>

        <form className="panel form-panel" onSubmit={submitReminder}>
          <div className="panel-heading">
            <h2>Rappel</h2>
            <CalendarClock size={20} />
          </div>
          <VehicleSelect
            vehicles={data?.vehicles ?? []}
            value={reminderForm.vehicle_id}
            onChange={(vehicle_id) => setReminderForm({ ...reminderForm, vehicle_id })}
          />
          <input
            value={reminderForm.title}
            onChange={(event) => setReminderForm({ ...reminderForm, title: event.target.value })}
            placeholder="Controle technique, vidange..."
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
            placeholder="Km limite"
            type="number"
            min="0"
          />
          <button type="submit" disabled={!data?.vehicles.length}>
            Planifier
          </button>
        </form>
      </section>

      <section className="history-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Depenses recentes</h2>
            <Wrench size={20} />
          </div>
          <ul className="event-list">
            {data?.expenses.slice(0, 6).map((expense) => (
              <li key={expense.id}>
                <div>
                  <strong>{expense.description}</strong>
                  <span>
                    {selectVehicleName(data.vehicles, expense.vehicle_id)} - {expense.date}
                  </span>
                </div>
                <b>{formatEuros(expense.amount)}</b>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Rappels</h2>
            <CalendarClock size={20} />
          </div>
          <ul className="event-list">
            {data?.reminders.slice(0, 6).map((reminder) => (
              <li key={reminder.id}>
                <div>
                  <strong>{reminder.title}</strong>
                  <span>
                    {selectVehicleName(data.vehicles, reminder.vehicle_id)}
                    {reminder.due_date ? ` - ${reminder.due_date}` : ''}
                  </span>
                </div>
                <b>{reminder.due_odometer_km ? `${reminder.due_odometer_km.toLocaleString('fr-FR')} km` : 'Date'}</b>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Pieces</h2>
            <PackageCheck size={20} />
          </div>
          <ul className="event-list">
            {data?.parts.slice(0, 6).map((part) => (
              <li key={part.id}>
                <div>
                  <strong>{part.name}</strong>
                  <span>
                    {selectVehicleName(data.vehicles, part.vehicle_id)} - {part.reference || 'Sans reference'}
                  </span>
                </div>
                <b>{part.cost ? formatEuros(part.cost) : '-'}</b>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
