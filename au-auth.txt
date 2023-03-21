// Да, вы можете реализовать аутентификацию с NextAuth.js, даже если у вас уже есть существующий серверный роут /api/users/login, который возвращает токен. Вам потребуется настроить NextAuth.js с использованием кастомного провайдера аутентификации. Вот шаги, которые вам нужно выполнить:

// Установите NextAuth.js, выполнив следующую команду:
// python
// Copy code
// npm install next-auth
// или

// python
// Copy code
// yarn add next-auth
// Создайте файл [...nextauth].js внутри каталога pages/api/auth. Это станет файлом конфигурации NextAuth.js.

// В файле конфигурации импортируйте NextAuth и ваш кастомный провайдер. Реализуйте кастомный провайдер, используя ваш существующий роут /api/users/login для аутентификации:

// javascript
// Copy code
import NextAuth from "next-auth";
import { Provider, signIn, signOut, useSession } from "next-auth/client";
import Providers from "next-auth/providers";

const customProvider = Providers.Credentials({
  name: "Custom Provider",
  credentials: {
    username: { label: "Username", type: "text" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (credentials) => {
    const response = await fetch("https://your-domain.com/api/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok && data.token) {
      return { id: data.id, email: data.email, token: data.token };
    } else {
      return null;
    }
  },
});

export default NextAuth({
  providers: [customProvider],
  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = user.token;
      }
      return token;
    },
    async session(session, token) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
// Обновите файлы вашего приложения, чтобы использовать функции аутентификации NextAuth.js, такие как useSession и signIn.
// После выполнения этих шагов NextAuth.js будет использовать ваш существующий роут для аутентификации, и ваше приложение будет иметь доступ к функциям аутентификации и управления сессиями, предоставляемым NextAuth.js.

// Конечно, вот примеры использования функций useSession и signIn с NextAuth.js в вашем приложении.

// Создайте файл _app.js внутри каталога pages, если у вас его еще нет:
// javascript
// Copy code

function MyApp({ Component, pageProps }) {
  return (
    <Provider session={pageProps.session}>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
// В файле компонента (например, pages/index.js), используйте useSession и signIn для отображения состояния аутентификации и обработки входа в систему:
// javascript
// Copy code

export default function Home() {
  const [session, loading] = useSession();

  return (
    <div>
      {!session && (
        <>
          <p>Вы не авторизованы.</p>
          <button onClick={() => signIn("credentials")}>Войти</button>
        </>
      )}
      {session && (
        <>
          <p>Добро пожаловать, {session.user.email}!</p>
          <button onClick={() => signOut()}>Выйти</button>
        </>
      )}
    </div>
  );
}
// В этом примере мы используем useSession для отслеживания состояния сессии пользователя и signIn для входа в систему с нашим кастомным провайдером. Когда пользователь не авторизован, отображается кнопка "Войти". После успешного входа в систему, отображается приветственное сообщение с адресом электронной почты пользователя и кнопкой "Выйти" для выхода из системы.

// Обратите внимание, что в примере используется signIn('credentials'), так как мы создали кастомный провайдер на основе учетных данных (Credentials Provider). Если вы используете другой тип провайдера, замените 'credentials' на соответствующий идентификатор провайдера.

// Пример настройки времени жизни сессии и куки:

// javascript
// Copy code
// В файле [...nextauth].js

export default NextAuth({
  providers: [customProvider],
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  cookies: {
    sessionToken: {
      maxAge: 30 * 24 * 60 * 60, // 30 дней
    },
  },
  callbacks: {
    // ...
  },
});
