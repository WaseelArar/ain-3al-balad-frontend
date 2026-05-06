import { writable } from "svelte/store";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const items = writable<ToastItem[]>([]);

const remove = (id: number) => {
  items.update((current) => current.filter((item) => item.id !== id));
};

const push = (message: string, type: ToastType) => {
  const id = Date.now() + Math.random();
  items.update((current) => [...current, { id, message, type }]);

  if (typeof window !== "undefined") {
    window.setTimeout(() => remove(id), 4200);
  }
};

export const toast = {
  subscribe: items.subscribe,
  success: (message: string) => push(message, "success"),
  error: (message: string) => push(message, "error"),
  dismiss: remove,
};
