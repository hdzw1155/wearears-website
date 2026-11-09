import type { APIRoute } from 'astro';
import { brands, compatibility } from '../data/compatibility';
import { appRevision } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ schemaVersion: 1, sourceRevision: appRevision, brands, records: compatibility }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
