export function checkAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'degelsin123'
  return password === adminPassword
}
