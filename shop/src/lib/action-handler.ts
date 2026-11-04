export type ActionResult<T = void> =
  | ({ success: true } & (T extends void ? {} : T))
  | { success: false; error: string };

/**
 * Standard server action result wrapper.
 * Traps errors on the server so meaningful messages reach the client
 * instead of Next.js obscuring them with generic production error digests.
 */
export async function handleAction<T = void>(
  actionName: string,
  fn: () => Promise<T>,
  fallbackMessage = "An unexpected error occurred. Please try again."
): Promise<ActionResult<T>> {
  try {
    const res = await fn();
    if (res && typeof res === "object") {
      if ("success" in res) {
        return res as ActionResult<T>;
      }
      return { success: true, ...res } as ActionResult<T>;
    }
    return { success: true } as ActionResult<T>;
  } catch (err: any) {
    console.error(`[${actionName}] failed:`, err);
    return {
      success: false,
      error: err?.message || fallbackMessage,
    };
  }
}
