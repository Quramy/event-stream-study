export class UnparseEventStream extends TransformStream<
  Record<string, unknown>,
  Uint8Array
> {
  #encoder = new TextEncoder();
  constructor() {
    super({
      transform: (chunk, ctrl) => {
        const value = this.#encoder.encode(
          "data: " + JSON.stringify(chunk) + "\n\n",
        );
        ctrl.enqueue(value);
      },
    });
  }
}
