<div align="center">
  <img src="public/favicon.svg" alt="MacroTracker AI Logo" width="120"/>
  <h1>MacroTracker AI</h1>
  <p><strong>Control calórico inteligente impulsado por voz e Inteligencia Artificial</strong></p>
</div>

---

## 📱 Descripción General
**MacroTracker AI** es una aplicación progresiva (PWA) de salud y fitness de nivel premium. Diseñada para eliminar la fricción de registrar comidas manualmente, permite a los usuarios **dictar sus comidas con lenguaje natural** ("Comí dos huevos revueltos con media palta y un café"). Su motor de Inteligencia Artificial (Gemini) se encarga de analizar, segmentar y calcular automáticamente las calorías y los macronutrientes exactos.

## ✨ Funcionalidades Principales
- 🎙️ **Reconocimiento de Voz Nativo:** Dictado en tiempo real sin pausas artificiales.
- 🧠 **Cerebro de Inteligencia Artificial:** Integración con Google Gemini 2.5 Flash para extraer gramos, calorías, proteínas, carbohidratos y grasas con precisión decimal.
- 🍩 **Anillos de Progreso Multisegmentados:** Interfaz premium tipo *Apple Fitness* donde los colores de las diferentes comidas se mezclan fluidamente con efecto de profundidad 3D y desenfoque (blur).
- 📈 **Proyecciones Físicas (Predictor):** Calcula automáticamente el ritmo de aumento o pérdida de peso en base a objetivos (Déficit, Mantener, Superávit) sin exigir un registro diario.
- ⚙️ **Comidas Personalizadas Dinámicas:** Agrega tus propias categorías (Ej: *Batido Post-Entreno* o *Pre-entreno*) directamente en la interfaz.
- 🌙 **Diseño Dark Premium:** UI minimalista, glassmorphism (desenfoque de cristal), animaciones fluidas de 60fps e interfaz optimizada para uso con una sola mano en móviles (Bottom Navigation).

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React 18, TypeScript, Vite.
- **Estilos:** Tailwind CSS (con variables personalizadas para el modo oscuro profundo).
- **Gráficos y Visuales:** Recharts para analíticas, SVG puro con máscaras/filtros para los anillos de progreso.
- **Backend & Base de Datos:** Supabase (PostgreSQL, Auth, Edge Functions).
- **IA:** Google Gemini API (`gemini-2.5-flash`).
- **Deploy y PWA:** Vercel (Edge network), Vite PWA Plugin para instalación nativa en iOS/Android.

---

## 🚀 Cómo instalar el proyecto localmente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/macrotracker-ai.git
   cd macrotracker-ai
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno locales creando un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## 🌐 Deploy a Producción (Vercel)
MacroTracker AI está preparado para desplegarse fácilmente y funcionar automáticamente si configuras correctamente los siguientes secretos en Vercel.

### 1. Variables de Entorno en Vercel
En la configuración de tu proyecto en Vercel (Settings > Environment Variables), debes añadir exactamente las mismas claves que usaste en local:
- `VITE_SUPABASE_URL`: La URL pública de tu proyecto Supabase.
- `VITE_SUPABASE_ANON_KEY`: La clave anónima pública de tu Supabase.

*Con esto configurado, el Front-End conectará automáticamente.*

### 2. Base de Datos en Supabase
Asegúrate de haber corrido las migraciones SQL en Supabase (las tablas de `users`, `daily_goals`, `food_logs` y `body_metrics`). Para las versiones avanzadas, tu tabla `daily_goals` debe tener:
```sql
ALTER TABLE daily_goals ADD COLUMN custom_meals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE daily_goals ADD COLUMN physical_goal TEXT DEFAULT 'maintain';
```

### 3. Edge Function & Gemini API (Backend de IA)
La magia de la IA ocurre en una Edge Function segura dentro de Supabase. Para que funcione en producción, debes alojar allí tu clave de Google Gemini.

1. Instala el CLI de Supabase si no lo tienes: `npm i -g supabase`
2. Inicia sesión: `supabase login`
3. Vincula el proyecto local a tu proyecto en la nube: `supabase link --project-ref tu_project_id`
4. Carga tu API Key de Gemini como secreto en Supabase:
   ```bash
   supabase secrets set GEMINI_API_KEY=tu_api_key_de_google_ai_studio
   ```
5. Sube la función a producción:
   ```bash
   supabase functions deploy gemini-nutrition --no-verify-jwt
   ```

Con estos 3 pasos (Vercel ENVs, SQL ejecutado, y la función de Supabase con el Secret), **tu aplicación quedará funcionando de forma autónoma, segura e inteligente 100% en la web**.

---
*Desarrollado con altos estándares de UI/UX e Inteligencia Artificial.*
