import {
  BinToStringLine,
  StringLineToDataJSON,
  DataJSONToBin,
} from "./transformers";

describe("integration", () => {
  test("Boxing data payload", async () => {
    const body = createTestingStream([
      { value: null },
      { value: 100 },
      { value: "hoge" },
      { value: false },
    ])
      .pipeThrough(new BinToStringLine())
      .pipeThrough(new StringLineToDataJSON<{ readonly value: unknown }>())
      .pipeThrough(
        new TransformStream<
          { readonly value: unknown },
          { readonly wrapped: { readonly value: unknown } }
        >({
          transform({ value }, ctrl) {
            ctrl.enqueue({ wrapped: { value } });
          },
        }),
      )
      .pipeThrough(new DataJSONToBin());

    const concatBin = new ConcatBinary();

    await body.pipeTo(concatBin);

    expect(Buffer.from(concatBin.toTypedArray()).toString()).toBe(
      'data: {"wrapped":{"value":null}}\n\n' +
        'data: {"wrapped":{"value":100}}\n\n' +
        'data: {"wrapped":{"value":"hoge"}}\n\n' +
        'data: {"wrapped":{"value":false}}\n\n',
    );
  });
});

class ConcatBinary extends WritableStream<Uint8Array> {
  #buf = new Uint8Array(0);
  constructor() {
    super({
      write: (chunk, ctrl) => {
        const newBuf = new Uint8Array(this.#buf.length + chunk.length);
        newBuf.set(this.#buf);
        newBuf.set(chunk, this.#buf.length);
        this.#buf = newBuf;
      },
    });
  }
  toTypedArray() {
    return this.#buf;
  }
}

function createTestingStream(contents: readonly Record<string, unknown>[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(ctrl) {
      for (const content of contents) {
        const value = encoder.encode(
          "data: " + JSON.stringify(content) + "\n\n",
        );
        ctrl.enqueue(value);
      }
      ctrl.close();
    },
  });
  return body;
}
