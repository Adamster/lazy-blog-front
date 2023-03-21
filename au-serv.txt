// Вот пример проверки аутентификации на сервере с использованием getServerSideProps:

// Установите необходимые зависимости:
// Copy code
// npm install jsonwebtoken
// Создайте функцию для проверки JWT-токена. В каталоге utils создайте файл auth.ts:
// typescript

import jwt from "jsonwebtoken";
import { GetServerSideProps, NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../utils/auth";
import { verifyToken } from "../utils/auth";

export function verifyToken(token: string, secret: string) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

export function withAuth(handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env.JWT_SECRET;
    const decodedToken = verifyToken(token, secret);

    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = decodedToken;
    return handler(req, res);
  };
}

// Используйте функцию withAuth для защиты API-маршрутов. В файле pages/api/protected.ts:
// typescript

async function protectedRoute(req: NextApiRequest, res: NextApiResponse) {
  // Ваша бизнес-логика
  res.status(200).json({ message: "Protected route" });
}

export default withAuth(protectedRoute);
// Используйте getServerSideProps для проверки аутентификации перед отображением страницы:
// jsx

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const token = req.cookies.token || req.headers.cookie.split("=")[1];

  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const secret = process.env.JWT_SECRET;
  const decodedToken = verifyToken(token, secret);

  if (!decodedToken) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
};

export default function ProtectedPage() {
  return <div>Protected content</div>;
}
