![NeXO CRM OG Image](https://res.cloudinary.com/dd3hdnfqi/image/upload/v1776987106/nexo_bxb1yk.webp)

# NeXO CRM Landing Page

![Astro](https://img.shields.io/badge/Astro-6.1.8-BC52EE?logo=astro&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2.4-06B6D4?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

Landing page oficial de **NeXO CRM**, un CRM inteligente diseñado para startups que integra WhatsApp y email nativos, automatizaciones de seguimiento y paneles de métricas en tiempo real.

🌐 **Demo**: [nexo-flow-crm.vercel.app](https://nexo-flow-crm.vercel.app/)

---

## 🚀 Tech Stack

- **Framework**: [Astro 6.1.8](https://astro.build/) - Generador de sitios estáticos ultrarrápido
- **Estilos**: [Tailwind CSS 4.2.4](https://tailwindcss.com/) con Vite plugin
- **Tipografía**: DM Sans (Google Fonts) - Pesos 300, 400, 500, 700
- **Animaciones**: tailwind-animations + Lenis (smooth scroll)
- **Lenguaje**: TypeScript (modo estricto)
- **Node.js**: >= 22.12.0

---

## ✨ Secciones de la Landing

- **Hero** - Presentación principal con propuesta de valor
- **Integrations** - Integraciones nativas (WhatsApp, Gmail, Brevo, etc.)
- **Features** - Funcionalidades clave del CRM
- **Plans** - Planes de precios
- **FAQ** - Preguntas frecuentes
- **Policies** - Políticas de privacidad y términos

---

## 📁 Estructura del Proyecto

```
nexo-crm/
├── src/
│   ├── components/
│   │   ├── icons/          # Iconos SVG (WhatsApp, Gmail, Instagram, etc.)
│   │   ├── ui/             # Componentes reutilizables (Button, Badge, Logo, Link)
│   │   ├── sections/       # Secciones de la landing page
│   │   │   ├── hero/
│   │   │   ├── features/
│   │   │   ├── integrations/
│   │   │   ├── plans/
│   │   │   ├── faq/
│   │   │   └── policies/
│   │   └── layout/         # Header, Footer, Background, Curtain
│   ├── pages/              # Rutas de Astro (index, 404, privacy, terms)
│   ├── layouts/            # Layout base (Layout.astro)
│   ├── styles/             # CSS global
│   ├── scripts/            # TypeScript (config Lenis, utilidades)
│   └── data/               # Datos JSON
├── public/                 # Assets estáticos
├── astro.config.mjs        # Configuración de Astro + fuentes
├── tsconfig.json           # Configuración de TypeScript
├── package.json            # Dependencias y scripts
└── LICENSE                 # MIT License
```

---

## 🛠️ Instalación y Uso

### Prerrequisitos

- Node.js >= 22.12.0
- pnpm (recomendado) o npm

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone <repo-url>
   cd nexo-crm
   ```

2. **Instalar dependencias**

   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Ejecutar en desarrollo**

   ```bash
   pnpm dev
   # o
   npm run dev
   ```

   La página se abrirá automáticamente en `http://localhost:4321`

4. **Build para producción**

   ```bash
   pnpm build
   # o
   npm run build
   ```

5. **Preview del build**

   ```bash
   pnpm preview
   # o
   npm run preview
   ```

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo con recarga en caliente |
| `pnpm build` | Genera la build de producción en `/dist` |
| `pnpm preview` | Previsualiza la build localmente |
| `pnpm astro` | Ejecuta comandos directos de Astro CLI |

---

## 🎨 Características de Diseño

- **Diseño responsivo** optimizado para móviles y desktop
- **Smooth scroll** con Lenis para una experiencia fluida
- **Animaciones sutiles** con tailwind-animations
- **Tipografía moderna** con DM Sans
- **Componentes modulares** y reutilizables
- **Alias de rutas** configurados en TypeScript (`@components/*`, `@layouts/*`, etc.)

---

## 📄 Licencia

Este proyecto está bajo la **MIT License**. Ver el archivo [LICENSE](LICENSE) para más detalles.

Copyright (c) 2026 Jordy Castro

---

## 👨‍💻 Autor

**Jordy Castro**

---

*Hecho con ❤️ usando Astro + Tailwind CSS*
