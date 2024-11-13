export class StringLineToDataJSON<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends TransformStream<string, T> {
  constructor({ onError }: { readonly onError?: (err: unknown) => void } = {}) {
    super({
      transform: (chunk, ctrl) => {
        const trimmed = chunk.trim();
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice("data:".length);
          try {
            const value = JSON.parse(jsonStr) as T;
            ctrl.enqueue(value);
          } catch (err) {
            onError?.(err);
          }
        }
      },
    });
  }
}
