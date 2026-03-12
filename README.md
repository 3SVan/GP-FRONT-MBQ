# Gestión de Provedores
Este repositorio alberga el código fuente de Gestión de Provedores, una aplicación que separa el backend y el frontend en proyectos independientes. A continuación encontrarás información útil para entender la estructura de ramas, levantar cada servicio y conectar la base de datos y el almacenamiento utilizando Supabase.

## Estructura de ramas
| Rama          | Descripción                                                         |
| ------------- | ------------------------------------------------------------------- |
| **main**      | Rama estable con las versiones listas para producción.              |
| **dev**       | Rama de desarrollo activo donde se integran nuevas funcionalidades. |

## Cómo levantar el frontend
El proyecto frontend se encuentra en `Front‑Gestion‑de‑Provedores` y utiliza Vite con Vue para el desarrollo. Para ponerlo en marcha:

#### 1. Instala las dependencias
```bash
cd Front-Gestion-de-Provedores
npm install
```

#### 2. Ejecuta la aplicación en modo de desarrollo
```bash
npm run dev
```
Este comando iniciará Vite y expondrá la aplicación en un puerto local (normalmente `http://localhost:5173`).

#### 3. Construye y previsualiza la aplicación (opcional)
```bash
# Compila para producción
npm run build

# Sirve el build generado
npm run preview
```
