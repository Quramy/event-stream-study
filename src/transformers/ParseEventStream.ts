export class ParseEventStream extends TransformStream<Uint8Array, string> {
  #buf = "";
  #decoder = new TextDecoder("utf8");
  #receivedFirstChunk = false;
  constructor() {
    const BOM = "\u{FEFF}";
    const CRLFCRLF = "\r\n\r\n";
    const LFLF = "\n\n";
    const CRCR = "\r\r";
    super({
      transform: (chunk, ctrl) => {
        this.#buf += this.#decoder.decode(chunk, { stream: true });
        if (!this.#receivedFirstChunk && this.#buf.length > 0) {
          this.#receivedFirstChunk = true;
          if (this.#buf[0] === BOM) this.#buf = this.#buf.slice(1);
        }
        while (true) {
          let idx = -1;
          if ((idx = this.#buf.indexOf(CRLFCRLF)) >= 0) {
            ctrl.enqueue(this.#buf.slice(0, idx));
            this.#buf = this.#buf.slice(idx + CRLFCRLF.length);
            continue;
          } else if ((idx = this.#buf.indexOf(LFLF)) >= 0) {
            ctrl.enqueue(this.#buf.slice(0, idx));
            this.#buf = this.#buf.slice(idx + LFLF.length);
            continue;
          } else if ((idx = this.#buf.indexOf(CRCR)) >= 0) {
            ctrl.enqueue(this.#buf.slice(0, idx));
            this.#buf = this.#buf.slice(idx + CRCR.length);
            continue;
          }
          break;
        }
      },
    });
  }
}
