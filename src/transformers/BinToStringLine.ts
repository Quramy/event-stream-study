export class BinToStringLine extends TransformStream<Uint8Array, string> {
  #buf: string = "";
  #decoder = new TextDecoder("utf8");
  constructor() {
    super({
      transform: (chunk, ctrl) => {
        this.#buf += this.#decoder.decode(chunk, { stream: true });
        while (true) {
          const idx = this.#buf.indexOf("\n\n");
          if (idx === -1) break;
          const lineChunk = this.#buf.slice(0, idx);
          ctrl.enqueue(lineChunk);
          this.#buf = this.#buf.slice(idx + "\n\n".length);
        }
      },
    });
  }
}
