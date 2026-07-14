import pool from "@/lib/db";

export async function logError(source: string, message: string): Promise<void> {
  try {
    await pool.query("INSERT INTO error_logs (source, message) VALUES ($1, $2)", [source, message]);
  } catch { /* silent */ }
}

export interface VisitorEntry {
  ip: string;
  country?: string;
  region?: string;
  page: string;
  referrer?: string;
  userAgent?: string;
}

export async function logVisit(entry: VisitorEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO visitor_logs (ip, country, region, page, referrer, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entry.ip, null, null, entry.page, entry.referrer || null, entry.userAgent || null],
    );
  } catch {
    // Analytics should never block the request
  }
}

export interface DailyStats {
  date: string;
  totalVisits: number;
  uniqueCountries: number;
  topCountries: { country: string; visits: number }[];
  topPages: { page: string; visits: number }[];
}

export async function getDailyStats(days: number = 7): Promise<DailyStats[]> {
  const { rows } = await pool.query(
    `SELECT
       DATE(created_at) AS date,
       COUNT(*)::int AS total_visits,
       COUNT(DISTINCT country)::int AS unique_countries
     FROM visitor_logs
     WHERE created_at >= NOW() - INTERVAL '1 day' * $1
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [days],
  );

  const stats: DailyStats[] = [];
  for (const row of rows) {
    const { rows: countries } = await pool.query(
      `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*)::int AS visits
       FROM visitor_logs
       WHERE DATE(created_at) = $1
       GROUP BY country
       ORDER BY visits DESC LIMIT 10`,
      [row.date],
    );
    const { rows: pages } = await pool.query(
      `SELECT page, COUNT(*)::int AS visits
       FROM visitor_logs
       WHERE DATE(created_at) = $1
       GROUP BY page
       ORDER BY visits DESC LIMIT 10`,
      [row.date],
    );
    stats.push({
      date: row.date,
      totalVisits: row.total_visits,
      uniqueCountries: row.unique_countries,
      topCountries: countries,
      topPages: pages,
    });
  }
  return stats;
}

export async function getRealtimeStats(): Promise<{
  todayVisits: number;
  todayCountries: number;
  onlineNow: number;
  totalVisits: number;
}> {
  const [todayR, onlineR, totalR] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS visits, COUNT(DISTINCT country)::int AS countries FROM visitor_logs WHERE DATE(created_at) = CURRENT_DATE"),
    pool.query("SELECT COUNT(*)::int AS online FROM visitor_logs WHERE created_at >= NOW() - INTERVAL '5 minutes'"),
    pool.query("SELECT COUNT(*)::int AS total FROM visitor_logs"),
  ]);
  const today = todayR.rows[0] as Record<string, number> | undefined;
  const online = onlineR.rows[0] as Record<string, number> | undefined;
  const total = totalR.rows[0] as Record<string, number> | undefined;
  return {
    todayVisits: today?.visits || 0,
    todayCountries: today?.countries || 0,
    onlineNow: online?.online || 0,
    totalVisits: total?.total || 0,
  };
}
