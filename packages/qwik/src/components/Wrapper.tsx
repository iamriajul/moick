import {
  $,
  component$,
  useOnDocument,
  useSignal,
  useStore,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import {
  GAP,
  TOAST_WIDTH,
  DEFAULT_WRAPPER_OPTIONS,
  createOptionsObject,
} from "../utils";
import { State, Theme, ToasterProps, type Toast as ToastType } from "../types";
import { Toast } from "./Toast";
import styles from "./styles.css?inline";
import {DOCUMENT_CUSTOM_EVENT_ADD_TOAST, DOCUMENT_CUSTOM_EVENT_REMOVE_TOAST} from "./state";
import {isServer} from "@builder.io/qwik/build";

export const Toaster = component$<ToasterProps>((props) => {
  const opts = createOptionsObject<Required<ToasterProps>>(
    DEFAULT_WRAPPER_OPTIONS,
    props
  );
  useStyles$(styles);

  const wrapperRef = useSignal<HTMLOListElement>();
  const state = useStore<State>({
    toasts: [],
    expanded: opts.expand,
    heights: [],
    interacting: false,
    theme: opts.theme,
  });

  const [y, x] = opts.position.split("-");
  const keyShortcut = opts.hotkey
    .join(" + ")
    .replace(/Key/g, "")
    .replace(/Digit/g, "");
  const offset = typeof opts.offset === "number" ? `${opts.offset}px` : opts.offset;

  const addToastEventRegistered = useSignal(false);
  useOnDocument(DOCUMENT_CUSTOM_EVENT_ADD_TOAST, $((ev) => {
    // There is some weird behavior with the useOnDocument hook
    // discussed here: https://discord.com/channels/842438759945601056/1179378981976416299
    if (addToastEventRegistered.value) return;
    addToastEventRegistered.value = true;

    const onEvent = (ev: Event) => {
      if (!(ev instanceof CustomEvent)) return;
      const toast = ev.detail as ToastType;
      state.toasts = [toast, ...state.toasts];
    }
    onEvent(ev);

    document.addEventListener(DOCUMENT_CUSTOM_EVENT_ADD_TOAST, onEvent);
  }));

  const removeToastEventRegistered = useSignal(false);
  useOnDocument(DOCUMENT_CUSTOM_EVENT_REMOVE_TOAST, $((ev) => {
    // There is some weird behavior with the useOnDocument hook
    // discussed here: https://discord.com/channels/842438759945601056/1179378981976416299
    if (removeToastEventRegistered.value) return;
    removeToastEventRegistered.value = true;

    const onEvent = (ev: Event) => {
      if (!(ev instanceof CustomEvent)) return;
      const toastId = ev.detail as string;
      state.toasts = state.toasts.map(type => {
        if (type.id === toastId) {
          return {
            ...type,
            dismiss: true,
          };
        }
        return type;
      });
    }
    onEvent(ev);

    document.addEventListener(DOCUMENT_CUSTOM_EVENT_REMOVE_TOAST, onEvent);
  }));

  // handle user color theme preference
  useTask$(({ track }) => {
    const theme = track(() => opts.theme);

    if (theme !== Theme.system) {
      state.theme = theme;
      return;
    }

    if (isServer) return;

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches }) => {
        state.theme = matches ? Theme.dark : Theme.light;
      });
  });

  // Ensure expanded prop is always false when no toasts are present or only one left
  useTask$(({ track }) => {
    track(() => state.toasts);
    if (state.toasts.length <= 1) {
      state.expanded = false;
    }
  });

  // Create shortcut to expand the toaster
  useOnDocument(
    "keydown",
    $((event: any) => {
      // Check if all hotkeys are pressed
      const isHotkeyPressed = opts.hotkey.every(
        (key) => (event as any)[key] || event.code === key
      );

      // If the key shortcut is pressed, expand the toaster
      if (isHotkeyPressed) {
        state.expanded = true;
        wrapperRef.value?.focus();
      }

      // Then, if user presses escape, close the toaster
      if (
        event.code === "Escape" &&
        (document.activeElement === wrapperRef.value ||
          wrapperRef.value?.contains(document.activeElement))
      ) {
        state.expanded = false;
      }
    })
  );

  // There are no toasts to show = no need to render
  if (!state.toasts.length) return <></>

  // render the toasts
  return (
    <section aria-label={`Notifications ${keyShortcut}`} tabIndex={-1}>
      <ol
        ref={wrapperRef}
        class={opts.class}
        tabIndex={-1}
        moick-data-theme={state.theme}
        moick-rich-colors={`${opts.richColors}`}
        moick-y-position={y}
        moick-x-position={x}
        moick-toaster-wrapper
        style={{
          "--front-toast-height": `${state.heights[0]?.height}px`,
          "--offset": `${offset}`,
          "--width": `${TOAST_WIDTH}px`,
          "--gap": `${GAP}px`,
          ...opts.style,
        }}
        onMouseEnter$={() => (state.expanded = true)}
        onMouseMove$={() => (state.expanded = true)}
        onMouseLeave$={() => {
          if (!state.interacting) {
            state.expanded = false;
          }
        }}
        onPointerDown$={() => {
          state.interacting = true;
        }}
        onPointerUp$={() => (state.interacting = false)}
      >
        {state.toasts.map((t, i) => {
          return (
            <Toast
              key={t.id}
              removeToast={$(() => {
                state.toasts = state.toasts.filter(
                  (toast) => toast.id !== t.id
                );
              })}
              toast={t}
              index={i}
              expandByDefault={opts.expand}
              position={opts.position}
              visibleToasts={opts.visibleToasts}
              closeButton={opts.closeButton}
              state={state}
              duration={opts.duration}
              class={opts.toastOptions.class}
              descriptionClassName={opts.toastOptions.descriptionClassName}
              style={opts.toastOptions.style}
            />
          );
        })}
      </ol>
    </section>
  );
});
