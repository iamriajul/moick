import { Toast, BasicOptions } from "../types";

export const generateId = () =>
  crypto.getRandomValues(new Uint32Array(1))[0].toString();

const basicToast = (title: string, options: Partial<BasicOptions> = {}) => {
  const id = options.id ?? generateId();
  const toast: Toast = { ...options, title, id, type: "normal" };
  document.dispatchEvent(new CustomEvent(DOCUMENT_CUSTOM_EVENT_ADD_TOAST, { detail: toast }));
  return id;
};

interface ToastInstance {
  success: (title: string, options?: Partial<BasicOptions>) => string;
  error: (title: string, options?: Partial<BasicOptions>) => string;
  dismiss: (id: string) => void;
}

export const DOCUMENT_CUSTOM_EVENT_ADD_TOAST = 'moick_qwik_fixed_add_toast';
export const DOCUMENT_CUSTOM_EVENT_REMOVE_TOAST = 'moick_qwik_fixed_remove_toast';

export const toast = Object.assign(basicToast, {
  success: (title, options = {}) => {
    const id = options.id ?? generateId();
    const toast: Toast = { ...options, title, id, type: "success" };
    document.dispatchEvent(new CustomEvent(DOCUMENT_CUSTOM_EVENT_ADD_TOAST, { detail: toast }));
    return id;
  },
  error: (title, options = {}) => {
    const id = options.id ?? generateId();
    const toast: Toast = { ...options, title, id, type: "error" };
    document.dispatchEvent(new CustomEvent(DOCUMENT_CUSTOM_EVENT_ADD_TOAST, { detail: toast }));
    return id;
  },
  dismiss: (id) => {
    document.dispatchEvent(new CustomEvent(DOCUMENT_CUSTOM_EVENT_REMOVE_TOAST, { detail: id }));
  },
} as ToastInstance);
