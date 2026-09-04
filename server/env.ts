import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export function envString(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

export function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}
