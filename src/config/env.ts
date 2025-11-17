export function getEnvVar(key: string) {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (value === undefined) {
    console.warn(`Variável de ambiente ${key} não definida`);
    return '';
  }
  return value;
}
