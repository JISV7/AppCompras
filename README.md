# CéntimosVE 💰 - Tu Presupuesto Inteligente en Venezuela (V1.0.0)

**CéntimosVE** es una solución integral diseñada para combatir la incertidumbre económica en Venezuela. No es solo una lista de compras; es una herramienta de análisis que permite a los usuarios rastrear tasas de cambio, comparar precios por ubicación y optimizar cada bolívar invertido en el mercado.

---

## 🌟 Funcionalidades Detalladas

### 1. Control Maestro de Divisas 💹
La app no depende de un solo dato. El backend cuenta con un servicio de scraping automatizado:
*   **Fuentes:** Obtiene la tasa oficial directamente del **BCV** (Banco Central de Venezuela) con un sistema de fallback a **DolarAPI**.
*   **Actualización Automática:** Un scheduler interno (`APScheduler`) refresca los datos diariamente.
*   **Histórico:** Visualiza cómo ha variado la tasa para decidir si comprar hoy o esperar.
*   **Convertidor Dinámico:** Cambia entre USD y VES al instante con la tasa más reciente.

### 2. Gestión de Listas de Compras Inteligentes 🛒
*   **Presupuesto vs. Realidad:** Define un presupuesto límite por lista. La app te avisará si tus estimaciones superan tu capacidad.
*   **Flujo de Compra:** Marca artículos como "comprados" mientras recorres el pasillo. Al finalizar la lista, los precios se registran automáticamente en la base de datos comunitaria.
*   **Reapertura:** ¿Olvidaste algo? Puedes reabrir listas completadas para seguir editando.

### 3. Escaneo y Catálogo de Productos 🔍
*   **Integración OFF:** Utiliza la API de **OpenFoodFacts** para obtener información e imágenes de productos internacionales y locales con solo escanear el código de barras.
*   **Carga de Imágenes:** Si un producto no existe, puedes crearlo y subir una foto que se almacena de forma segura en **Supabase Storage**.
*   **Normalización GTIN-13:** Los códigos se procesan para evitar duplicados entre formatos EAN y UPC.

### 4. Geolocalización y Tiendas 📍
*   **PostGIS Power:** Gracias a las extensiones geográficas de PostgreSQL, la app calcula la distancia real entre tú y los supermercados.
*   **Comparativa de Precios:** ¿Dónde está la harina más barata? La app te muestra un ranking de tiendas cercanas con los últimos precios reportados por la comunidad.
*   **Navegación:** Integración directa con **Google Maps** para llegar a la tienda seleccionada.

---

## 🛠️ Stack Tecnológico

### **Backend (Cerebro)**
*   **FastAPI:** Framework moderno y asíncrono para Python.
*   **SQLAlchemy + Alembic:** Gestión de base de datos y migraciones de esquema.
*   **PostgreSQL + PostGIS:** Almacenamiento relacional con capacidades geoespaciales.
*   **Pydantic V2:** Validación de datos y esquemas de API.

### **Frontend (Experiencia)**
*   **React Native + Expo (SDK 54):** Desarrollo nativo multiplataforma.
*   **Expo Router:** Navegación basada en archivos (tipo Next.js).
*   **Reanimated:** Animaciones fluidas de 60fps para una interfaz moderna.
*   **Axios:** Cliente HTTP con interceptores para manejo automático de tokens JWT.

---

## 🚀 Guía de Instalación Rápida

### Requisitos Previos
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL con PostGIS instalado.

### 1. Servidor (Backend)
```bash
cd backend
python -m venv .venv
# Activar entorno (Windows: .venv\Scripts\activate | Linux: source .venv/bin/activate)
pip install -r requirements.txt
# Configura tu .env con POSTGRES_USER, SECRET_KEY, etc.
alembic upgrade head
fastapi dev src/main.py
```

### 2. Aplicación (Frontend)
```bash
cd centimos
npm install
# Configura EXPO_PUBLIC_API_URL en tu .env
npx expo start
```

---

## 📦 Estructura del Proyecto
```text
├── backend/                # API REST y lógica de negocio
│   ├── alembic/            # Migraciones de DB
│   └── src/
│       ├── api/v1/         # Endpoints (auth, products, lists...)
│       ├── core/           # Configuración, seguridad y utilidades
│       ├── models/         # Modelos SQLAlchemy
│       ├── schemas/        # Validaciones Pydantic
│       └── services/       # Lógica de scraping y servicios externos
├── centimos/               # App Móvil Expo
│   └── src/
│       ├── app/            # Vistas y Rutas (Expo Router)
│       ├── components/     # Componentes UI modulares
│       ├── context/        # Manejo de estado global (Auth)
│       └── services/       # Clientes de API
└── README.md
```

---

## 📝 Próximos Pasos (V1.1.0)
- [ ] Gráficas de tendencias de precios.
- [ ] Exportación de facturas en PDF.
- [ ] Modo oscuro automático.

---
**Desarrollado con ❤️**
