import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// Rutas públicas — no requieren token
const PUBLIC_PREFIXES = ['/auth/', '/health', '/docs'];

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    jwtUser?: JwtPayload;
  }
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const url = req.routeOptions?.url ?? req.url;

  // Omitir rutas públicas
  if (PUBLIC_PREFIXES.some((p) => url.startsWith(p))) return;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, error: 'No autorizado — se requiere token' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.jwtUser = decoded;
  } catch {
    return reply.status(401).send({ success: false, error: 'Token inválido o expirado' });
  }
}
