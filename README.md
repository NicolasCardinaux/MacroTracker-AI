<div align="center">
  <img src="public/favicon.svg" alt="MacroTracker AI Logo" width="120"/>
  <h1>MacroTracker AI</h1>
  <p><strong>Control Nutricional Inteligente impulsado por Voz e Inteligencia Artificial</strong></p>
</div>

---

## 📱 Descripción General
**MacroTracker AI** es una aplicación progresiva (PWA) de salud y fitness de nivel premium. Diseñada para eliminar la fricción de registrar comidas manualmente, permite a los usuarios **dictar sus comidas con lenguaje natural** ("Comí dos huevos revueltos con media palta y un café"). Su motor de Inteligencia Artificial (Gemini) se encarga de analizar, segmentar y calcular automáticamente las calorías y los macronutrientes exactos, al mismo tiempo que te ofrece un sistema completo de control físico y proyecciones.

## ✨ Funcionalidades Principales

### 🎙️ Registro Inteligente
- **Reconocimiento de Voz Nativo:** Dictado en tiempo real rápido y preciso. Escribí o hablá, la IA se encarga del resto.
- **Cerebro de Inteligencia Artificial (Gemini 2.5 Flash):** Capaz de extraer gramos, calorías, proteínas, carbohidratos y grasas con precisión milimétrica analizando oraciones complejas.
- **Diccionario Local-First Autoadaptable:** Cada usuario tiene su propia base de datos clonada. Si editas manualmente las calorías o macros de un alimento (ej. "Manzana"), el sistema **aprende** de tu ajuste y calculará la proporción exacta para la próxima vez basándose en tu propia receta.

### ⚙️ Perfil Físico y Cálculos Precisos
- **Cálculos Clínicos (Mifflin-St Jeor):** El sistema calcula tu Tasa Metabólica Basal (BMR) utilizando una de las fórmulas más precisas de la medicina moderna, adaptándose a tu Sexo, Edad, Altura y Peso.
- **TDEE y Macros Auto-Sugeridos:** Selecciona tu objetivo (Déficit, Mantenimiento o Superávit) y tu nivel de actividad física. El sistema ajustará matemáticamente tu límite calórico, sugiriendo una distribución de macros ideal (2.2g de proteína por kg de peso corporal, 25% grasas, resto carbos).
- **Control de Cuenta:** Modificación de Nombre, Correo Electrónico y Contraseña nativa utilizando la seguridad de Supabase Auth (incluyendo *Secure Email Change*).

### 📈 Analíticas y Progresos
- **Consultor IA Semanal:** Un botón mágico en la pestaña Analíticas agrupa todo lo que consumiste en los últimos 7 días junto a tus metas, y se lo envía a Gemini para que actúe como tu **Nutricionista Virtual**, dándote un análisis rápido, empático y directo sobre cómo vas y qué ajustar.
- **Gráficos Expandibles e Interactivos:** Gráficos semanales de Calorías (Barras con degradados) y Proteínas (Áreas difuminadas) creados con Recharts. Completamente responsivos; cuentan con un modo "pantalla completa" (`Maximizar`) para analizarlos al detalle en tu celular.
- **Evolución de Peso Permanente:** Sistema de seguimiento de peso corporal. Detecta automáticamente tu **Peso Inicial** (para siempre saber de dónde empezaste) y grafica tu evolución en el tiempo con proyecciones sobre cuánto peso perderás o ganarás por mes/semana/día de seguir el mismo ritmo.

### 🎨 Diseño y Experiencia de Usuario (UI/UX)
- **Anillos de Progreso Multisegmentados:** Interfaz premium tipo *Apple Fitness* donde los colores de las diferentes comidas se mezclan fluidamente con efecto de profundidad 3D y desenfoque (blur).
- **PWA Branding Impecable:** Iconos `apple-touch-icon` y `manifest` generados a medida con un fondo verde característico `#10B981`. La aplicación instalada en Android/iOS parece una aplicación 100% nativa de App Store/Google Play.
- **Dark Premium:** UI minimalista, glassmorphism (desenfoque de cristal), animaciones fluidas y modales optimizados para uso con una sola mano en móviles (Bottom Navigation).

---

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React 18, TypeScript, Vite.
- **Estilos:** Tailwind CSS (con variables personalizadas para el modo oscuro profundo y degradados de la marca).
- **Gráficos y Visuales:** Recharts para analíticas responsivas y SVG puro para los anillos de progreso.
- **Backend & Base de Datos:** Supabase (PostgreSQL, Supabase Auth, Edge Functions).
- **IA:** Google Gemini API (`gemini-2.5-flash`) a través del `@google/genai` SDK.
- **Deploy y PWA:** Vercel (Edge network), Vite PWA Plugin.

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
En la configuración de tu proyecto en Vercel (Settings > Environment Variables), debes añadir exactamente las mismas claves que usaste en local (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

### 2. Tablas y Configuración en Supabase
Asegúrate de tener en Supabase las tablas configuradas para el proyecto (`users`, `daily_goals`, `food_logs`, `food_dictionary`, y `body_metrics`). 

Para que la Pestaña de Ajustes y Perfil Físico funcione al máximo, la tabla `daily_goals` tiene las columnas:
```sql
ALTER TABLE daily_goals ADD COLUMN height NUMERIC;
ALTER TABLE daily_goals ADD COLUMN gender TEXT;
ALTER TABLE daily_goals ADD COLUMN age INTEGER;
ALTER TABLE daily_goals ADD COLUMN activity_level TEXT DEFAULT 'sedentary';
ALTER TABLE daily_goals ADD COLUMN physical_goal TEXT DEFAULT 'maintain';
```
Para el guardado de peso y persistencia de evolución, la tabla `body_metrics`:
```sql
CREATE TABLE body_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Edge Function & Gemini API (Backend de IA)
Toda la lógica de la Inteligencia Artificial (procesar el texto, detectar la comida, aprender calorias o evaluar tu semana) corre en el servidor seguro de Supabase.

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

Con estos pasos, **tu aplicación quedará funcionando de forma autónoma, segura e inteligente 100% en la web**.

---
*Diseñado con obsesión por la precisión matemática, la Inteligencia Artificial y las interfaces móviles hermosas.*
