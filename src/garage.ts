export type Vehicle = {
  id: number;
  name: string;
  make: string;
  model: string;
  year: number | null;
  odometer_km: number;
};

export type Expense = {
  id: number;
  vehicle_id: number;
  date: string;
  category: string;
  description: string;
  amount: string;
  odometer_km: number | null;
};

export type PartChange = {
  id: number;
  vehicle_id: number;
  date: string;
  name: string;
  brand: string | null;
  reference: string | null;
  cost: string | null;
};

export type Reminder = {
  id: number;
  vehicle_id: number;
  title: string;
  due_date: string | null;
  due_odometer_km: number | null;
  status: 'open' | 'done';
};

export type VehicleSummary = {
  id: number;
  name: string;
  make: string;
  model: string;
  odometer_km: number;
  expense_total: string;
  open_reminders: number;
};

export type GarageSummary = {
  vehicle_count: number;
  total_expenses: string;
  open_reminder_count: number;
  vehicles: VehicleSummary[];
};

export type GarageData = {
  summary: GarageSummary;
  vehicles: Vehicle[];
  expenses: Expense[];
  parts: PartChange[];
  reminders: Reminder[];
};

export function buildApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function formatEuros(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

export function getCostPerKm(totalExpenses: string | number, odometerKm: number): string {
  if (!odometerKm) {
    return 'Non disponible';
  }

  return `${(Number(totalExpenses) / odometerKm).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR/km`;
}

async function request<T>(apiBaseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(apiBaseUrl, path), {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function loadGarageData(apiBaseUrl: string): Promise<GarageData> {
  const [summary, vehicles, expenses, parts, reminders] = await Promise.all([
    request<GarageSummary>(apiBaseUrl, '/api/summary'),
    request<Vehicle[]>(apiBaseUrl, '/api/vehicles'),
    request<Expense[]>(apiBaseUrl, '/api/expenses'),
    request<PartChange[]>(apiBaseUrl, '/api/parts'),
    request<Reminder[]>(apiBaseUrl, '/api/reminders'),
  ]);

  return { summary, vehicles, expenses, parts, reminders };
}

export function createGarageRecord<TPayload, TResult>(
  apiBaseUrl: string,
  path: string,
  payload: TPayload,
): Promise<TResult> {
  return request<TResult>(apiBaseUrl, path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
