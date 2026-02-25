import type { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const JWT_SECRET = process.env.JWT_SECRET!;
const client = new OAuth2Client(CLIENT_ID);

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/google — verifica credential de Google, devuelve perfil + JWT
  app.post<{ Body: { credential: string } }>(
    '/google',
    {
      schema: {
        tags: ['auth'],
        summary: 'Verificar Google ID Token y obtener perfil + JWT',
        body: {
          type: 'object',
          required: ['credential'],
          properties: { credential: { type: 'string', description: 'Google ID Token (JWT)' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              token: { type: 'string', description: 'JWT para autenticación' },
              user: {
                type: 'object',
                properties: {
                  sub: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  picture: { type: 'string' },
                  bio: { type: 'string' },
                  location: { type: 'string' },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: { success: { type: 'boolean' }, error: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const ticket = await client.verifyIdToken({
          idToken: req.body.credential,
          audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) return reply.status(401).send({ success: false, error: 'Token inválido' });

        // Upsert perfil en MongoDB
        const profile = await User.findOneAndUpdate(
          { googleId: payload.sub },
          {
            $set: {
              name: payload.name,
              email: payload.email,
              picture: payload.picture ?? null,
              lastLogin: new Date(),
            },
            $setOnInsert: { googleId: payload.sub },
          },
          { upsert: true, new: true, runValidators: true }
        );

        // Generar JWT (expira en 7 días)
        const token = jwt.sign(
          { sub: payload.sub, email: payload.email, name: payload.name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return reply.send({
          success: true,
          token,
          user: {
            sub: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            bio: profile.bio,
            location: profile.location,
            _id: profile._id,
          },
        });
      } catch {
        return reply.status(401).send({ success: false, error: 'Token inválido o expirado' });
      }
    }
  );
}
