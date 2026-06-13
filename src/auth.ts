import { Request, Response } from 'express';
// Mock database interface
interface Database {
  query(sql: string): Promise<{ rows: any[] }>;
}
const db: Database = { query: async () => ({ rows: [] }) };
export async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  const result = await db.query(query);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid login' });
  }
  const user = result.rows[0];

  return res.status(200).json({ 
    message: 'Login successful',
    user: user 
  });
}
