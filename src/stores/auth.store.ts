// src/stores/user.ts
import { writable } from "svelte/store";

export interface User {
  usersId: number;
  username: string;
  phone: string;
  role: "USER" | "ADMIN" | "MUNICIPAL";
  regionsId?: number;
  regionsName?: string;
  regionsImage?: string; // صورة المعلم التاريخي للمنطقة
  token: string;
}

const shouldPersistImage = (image?: string) =>
  Boolean(image && !image.startsWith("data:") && image.length <= 8000);

const toPersistedUser = (userData: User): User => {
  const persisted = { ...userData };
  if (!shouldPersistImage(persisted.regionsImage)) {
    delete persisted.regionsImage;
  }
  return persisted;
};

const readStoredUser = (): User | null => {
  if (typeof localStorage === "undefined") return null;

  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    const parsed = JSON.parse(storedUser) as User;
    if (parsed.token && parsed.token.length > 8000) {
      localStorage.removeItem("user");
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const user = writable<User | null>(readStoredUser());

export const setUser = (userData: User) => {
  user.set(userData);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("user", JSON.stringify(toPersistedUser(userData)));
  }
};

export const clearUser = () => {
  user.set(null);
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("user");
  }
};
