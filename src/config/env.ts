export function getEnvVar(key: string) {
  const value = process.env[key];
  if (value === undefined) {
    console.warn(`Variável de ambiente ${key} não definida`);
    return '';
  }
  return value;
}
