# Linting & Formatting

Este proyecto usa **ESLint** para linting y **Prettier** para formateo de código.

## Prebuild Script

Se incluye un script `prebuild.sh` que ejecuta linting y formateo en backend y frontend:

```bash
./prebuild.sh
```

Este script se ejecuta **automáticamente antes de cada push** gracias al git hook `pre-push`.

## Configuración

- **Prettier:** `.prettierrc.json` (compartido entre backend y frontend)
- **ESLint Backend:** `backend/.eslintrc.json`
- **ESLint Frontend:** Configurado en `frontend/eslint.config.js`

## Scripts Disponibles

### Backend (`/var/www/mindverse/backend`)

```bash
# Verificar errores de linting
npm run lint

# Auto-fix errores de linting
npm run lint:fix

# Formatear código con Prettier
npm run format

# Verificar formato sin modificar
npm run format:check
```

### Frontend (`/var/www/mindverse/frontend`)

```bash
# Verificar errores de linting
npm run lint

# Auto-fix errores de linting
npm run lint:fix

# Formatear código con Prettier
npm run format

# Verificar formato sin modificar
npm run format:check
```

## Workflow Recomendado

### Antes de commit:

```bash
# Backend
cd backend
npm run lint:fix
npm run format

# Frontend
cd frontend
npm run lint:fix
npm run format
```

### En desarrollo:

Configurá tu editor (VSCode) para formatear al guardar:

**`.vscode/settings.json`:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Reglas de Prettier

- **Semi:** `;` al final
- **Single quotes:** `'string'` en lugar de `"string"`
- **Print width:** 100 caracteres
- **Tab width:** 2 espacios
- **Trailing commas:** ES5 (objetos/arrays)

## Reglas de ESLint

### Backend:
- TypeScript strict mode
- Permite `any` con warning
- Variables no usadas: warning (ignora `_prefixed`)
- Console.log permitido

### Frontend:
- React hooks linting
- TypeScript strict
- React refresh rules
