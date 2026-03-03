import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { ApiKey } from '../models/ApiKey';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

// Rutas públicas — no requieren token
const PUBLIC_PREFIXES = ['/auth/', '/health', '/docs', '/cinema/'];

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    jwtUser?: JwtPayload;
    apiKeyId?: string; // ID de la API Key si se autenticó con ella
  }
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const url = req.routeOptions?.url ?? req.url;

  // Omitir rutas públicas
  if (PUBLIC_PREFIXES.some((p) => url.startsWith(p))) return;

  // Intentar autenticación con API Key primero
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
  if (apiKeyHeader) {
    try {
      // Buscar todas las API Keys activas y comparar
      const apiKeys = await ApiKey.find({ enabled: true });
      
      let matchedKey: any = null;
      for (const key of apiKeys) {
        const isMatch = await (ApiKey as any).compareKey(apiKeyHeader, key.key);
        if (isMatch) {
          // Verificar si está expirada
          if (key.expiresAt && key.expiresAt < new Date()) {
            return reply.status(401).send({ 
              success: false, 
              error: 'API Key expirada' 
            });
          }
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        return reply.status(401).send({ 
          success: false, 
          error: 'API Key inválida' 
        });
      }

      // Obtener el usuario asociado
      const user = await User.findById(matchedKey.userId);
      if (!user) {
        return reply.status(401).send({ 
          success: false, 
          error: 'Usuario asociado a la API Key no encontrado' 
        });
      }

      // Actualizar lastUsedAt (sin await para no bloquear)
      ApiKey.findByIdAndUpdate(matchedKey._id, { 
        lastUsedAt: new Date() 
      }).catch(() => {});

      // Establecer jwtUser con los datos del usuario
      req.jwtUser = {
        sub: user.googleId,
        email: user.email,
        name: user.name,
      };
      req.apiKeyId = matchedKey._id.toString();
      
      return; // Autenticación exitosa con API Key
    } catch (err) {
      return reply.status(500).send({ 
        success: false, 
        error: 'Error al verificar API Key' 
      });
    }
  }

  // Si no hay API Key, intentar con JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ 
      success: false, 
      error: 'No autorizado — se requiere token JWT o API Key' 
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.jwtUser = decoded;
  } catch {
    return reply.status(401).send({ 
      success: false, 
      error: 'Token JWT inválido o expirado' 
    });
  }
}
