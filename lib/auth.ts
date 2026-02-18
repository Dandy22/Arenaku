import jwt from "jsonwebtoken";

const SECRET = "SECRET_KEY";

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as {
      userId: string;
      role: string;
    };
  } catch (error) {
    return null;
  }
}

export async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    throw new Error("No token provided");
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);

  if (!user) {
    throw new Error("Invalid token");
  }

  return user;
}
