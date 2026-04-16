# План рефакторинга `lazy-blog-front`

Проект какое-то время не поддерживался. Этот документ — дорожная карта по выводу его на нормальный уровень.

---

## ✅ Фаза 1 — Экстренные фиксы (DONE)

Цель: починить реально сломанное/опасное. Один маленький PR, минимум риска.

- [x] `tsconfig.json:30` — убрать несуществующий `"src/utils/toasts.tss"`
- [x] `next.config.ts` — убрать `eslint.ignoreDuringBuilds: true`, починить ошибки линтера
- [x] Удалить `console.log` с auth-данными в `src/app/auth/external-callback/page.tsx:19,42`
- [x] Хардкод URL → env vars:
  - `NEXT_PUBLIC_SITE_URL` вместо `https://notlazy.org` в meta-data
  - `NEXT_PUBLIC_GA_ID` вместо `G-MJC16ETF2H` в google-analytics (+ conditional render)
  - `NEXT_PUBLIC_API` в rewrite и external-callback
  - Google OAuth URL — через `window.location.origin` (relative)
- [x] `npm audit fix` + `next` 15.2.6 → 15.5.15 — закрыто **28 уязвимостей**, осталось 0
- [x] Build + lint проходят

**Отложено в Фазу 2**: миграция Tailwind v3-style config → v4 CSS-first (текущий `@config + @import` setup рабочий).

**На деплое**: добавить `NEXT_PUBLIC_SITE_URL` и `NEXT_PUBLIC_GA_ID` в Vercel env.

---

## 🟠 Фаза 2 — App Router правильно (1–2 дня)

Чтобы блог перестал выглядеть как CSR-SPA на Next.js.

**PR #2a — базовая обвязка (DONE):**
- [x] `src/app/error.tsx` — route-level error boundary
- [x] `src/app/global-error.tsx` — для ошибок в root layout
- [x] `src/app/not-found.tsx` — 404 страница
- [x] `src/app/loading.tsx` + `[user]/loading.tsx` + `[user]/[post]/loading.tsx` + `tag/[id]/loading.tsx`
- [x] React Query SSR-safe `QueryClient` (per-request на сервере, singleton в браузере)
- [x] SSR hydration для страницы поста: `HydrationBoundary` + `dehydrate` + `prefetchQuery` через `getPostSSR`
- [x] Типизация params как `Promise<{...}>` в `[user]/[post]/page.tsx`, `[user]/page.tsx`, `tag/[id]/page.tsx` (убрали `any` и eslint-disable)

**PR #2b — SEO:**
- [ ] `src/app/sitemap.ts` — динамический sitemap из постов API
- [ ] `src/app/robots.ts`
- [ ] `src/app/[user]/[post]/opengraph-image.tsx` — dynamic OG-картинки (`@vercel/og`)
- [ ] RSS feed: `src/app/feed.xml/route.ts`
- [ ] SSR prefetch для главной и `[user]/page.tsx` (сейчас flash-of-loading)
- [ ] `notFound()` в server component при отсутствии пользователя/поста (сейчас клиент рендерит ошибку, статус 200)
- [ ] Миграция Tailwind v3-style config → v4 CSS-first (`@theme` в `globals.css`)

---

## 🟡 Фаза 3 — Производительность и чистка (1 день)

- [ ] Dynamic import тяжёлых клиентских либ:
  - `@mdxeditor/editor` (~1.2MB) → `next/dynamic({ ssr: false })` в `/create` и `/edit`
  - `@uiw/react-markdown-preview` → на странице поста
  - `emoji-picker-react`, `react-advanced-cropper` → по клику
- [ ] Удалить неиспользуемое: `@milkdown/*` (5 пакетов, ~400KB), компонент `milkdown-crepe.tsx` заброшен
- [ ] Удалить/заменить `lodash` (1–2 функции в коде)
- [ ] Minor upgrades (безопасно):
  - `@heroui/react` 2.8.3 → 2.8.10
  - `@tanstack/react-query` 5.66 → 5.99
  - `react-hook-form` 7.54 → 7.72
  - `framer-motion` 12.23 → 12.38
  - `@mdxeditor/editor` 3.24 → 3.54
  - `sass`, `date-fns`, `emoji-picker-react`, `react-haiku`, `react-markdown` и др.
- [ ] Major upgrades — **отдельным PR**: HeroUI 2→3, Next 15→16, ESLint 9→10

---

## 🟢 Фаза 4 — DX и инфраструктура (0.5 дня)

- [ ] Prettier config + форматирование репо
- [ ] Husky + lint-staged для pre-commit
- [ ] `.nvmrc`, `.editorconfig`
- [ ] Scripts в `package.json`: `typecheck`, `format`, `format:check`
- [ ] GitHub Actions: `.github/workflows/ci.yml` — typecheck + lint + build на PR
- [ ] Sentry (или аналог) для клиентских ошибок
- [ ] ESLint FSD-плагин: `eslint-plugin-boundaries` или `@feature-sliced/eslint-config`

---

## 🔵 Фаза 5 — UX / фичи (итерациями)

- [ ] Skeleton-лоадеры: `PostsList`, `PostView`, `TagsList`, `Comments`
- [ ] Empty states: "нет постов", "нет комментариев", "ничего не найдено"
- [ ] Пагинация / "Load more" UI (infinite query есть, UI нет) — `src/features/post/ui/posts-list.tsx`
- [ ] Поиск постов
- [ ] Черновики: список черновиков автора (backend фильтрует, UI не показывает)
- [ ] Безопасность токенов: `accessToken`/`refreshToken` из `localStorage` → HttpOnly cookies (требует доработки backend)
- [ ] A11y: адекватный `alt` в `header.tsx:50`, `aria-label` у icon-кнопок
- [ ] Валидация: длина комментариев, размер/mimetype загружаемых картинок (`post-image-uploader.tsx`)
- [ ] Защищённые роуты: middleware или layout-guard для `/create`, `/profile` (сейчас мелькание через `useUserById("")`)
- [ ] Удалить inline `style={{ marginBottom: "0.125rem" }}` в `post-form.tsx:131`

---

## 🧪 Фаза 6 — Тесты (параллельно с Фазой 5)

- [ ] Vitest + React Testing Library (0 тестов сейчас)
- [ ] Критичный минимум: auth-flow, `post-form` submit, markdown render
- [ ] Playwright: e2e главных сценариев (логин, создать пост, коммент)

---

## Порядок мёрджа PR

- **PR #1** — Фаза 1 (DONE)
- **PR #2** — Фаза 2 (App Router + SEO)
- **PR #3** — Фаза 3 (перф + cleanup + minor upgrades)
- **PR #4** — Фаза 4 (DX infra)
- **PR #5** — Major upgrades (Next 16, HeroUI 3) — отдельно, чтобы откатить при багах
- Далее — Фазы 5 и 6 итеративно
