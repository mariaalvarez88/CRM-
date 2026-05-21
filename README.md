# DermaFlow CRM — Micropigmentación

CRM para gestión de centros, clientas y consentimientos informados con firma digital desde el móvil.

---

## 🚀 Puesta en marcha (paso a paso)

### 1. Crear cuenta en Supabase (base de datos gratuita)

1. Ve a [supabase.com](https://supabase.com) → **Start for free**
2. Crea un nuevo proyecto (elige nombre y contraseña)
3. Espera ~2 minutos a que arranque

### 2. Crear las tablas en Supabase

1. En Supabase, ve a **SQL Editor** (icono en el menú izquierdo)
2. Copia todo el contenido del archivo `supabase-schema.sql`
3. Pégalo en el editor y pulsa **Run**

### 3. Crear tu usuario de acceso

1. En Supabase, ve a **Authentication → Users**
2. Pulsa **Add user** → **Create new user**
3. Introduce tu email y contraseña

### 4. Copiar las credenciales de Supabase

1. En Supabase, ve a **Settings → API**
2. Copia:
   - **Project URL** → es tu `VITE_SUPABASE_URL`
   - **anon public key** → es tu `VITE_SUPABASE_ANON_KEY`

### 5. Configurar el proyecto

1. En la carpeta del proyecto, crea un archivo llamado `.env`
2. Pega esto y rellena con tus valores:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 6. Instalar y ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## 🌐 Publicar en Vercel (hosting gratuito recomendado)

1. Crea una cuenta en [vercel.com](https://vercel.com) con tu email
2. Instala Git y sube el proyecto a GitHub (o usa el CLI de Vercel)
3. En Vercel, pulsa **New Project** → importa el repositorio
4. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL` → tu Project URL
   - `VITE_SUPABASE_ANON_KEY` → tu anon key
5. Pulsa **Deploy** → en 1-2 minutos tendrás la URL pública

### Subir a hosting tradicional (cPanel/FTP)

```bash
npm run build
```
Sube **toda la carpeta `dist/`** a la carpeta raíz de tu hosting (normalmente `public_html`).

> ⚠️ Si usas este método, necesitas hacer el build local con el `.env` configurado.

---

## 📱 Cómo funciona el enlace de consentimiento

1. En la ficha de una clienta, pulsa **"Crear enlace"**
2. El enlace se copia al portapapeles automáticamente
3. Pulsa el icono de WhatsApp (💬) para abrir WhatsApp con el mensaje pre-redactado
4. La clienta abre el enlace en su móvil, rellena el formulario y firma
5. Al guardar, el consentimiento aparece como **"Firmado"** en la app
6. Puedes descargar el **PDF** con todos los datos y la firma

---

## 📋 Funcionalidades

- ✅ Login seguro con email y contraseña
- ✅ Múltiples centros por profesional
- ✅ Clientas por centro con toda su información
- ✅ Generación de enlace de consentimiento (con token único)
- ✅ Compartir por WhatsApp con mensaje pre-redactado
- ✅ Formulario móvil: datos personales + info médica + firma táctil
- ✅ Descarga de consentimiento firmado en PDF (A4)
- ✅ Búsqueda y filtros de clientas
- ✅ Estado de consentimiento en tiempo real

---

## 🔒 Privacidad y LOPD

- Los datos se almacenan en tu cuenta de Supabase (servidores en Europa)
- Solo tú puedes acceder a los datos de tus clientas (Row Level Security)
- El formulario de consentimiento es de un solo uso por enlace
- Una vez firmado, no puede modificarse
