import { BinToStringLine } from "./BinToStringLine";

describe(BinToStringLine, () => {
  it("transform binary stream whose bounday is two LFs", async () => {
    const readable = createTestingBinaryStream([
      "data: someData\n\n",
      "event: some event\n\n",
      "data: anotherData\n\n",
    ]);

    const lines: string[] = [];
    for await (const line of readable.pipeThrough(new BinToStringLine())) {
      lines.push(line);
    }

    expect(lines).toEqual([
      "data: someData",
      "event: some event",
      "data: anotherData",
    ]);
  });

  test.each([
    { name: "empty", contents: [], expected: [] },
    {
      name: "no boundaries",
      contents: ["hoge"],
      expected: [],
    },
    {
      name: "one line from multiple chunks",
      contents: ["ho", "ge", "\n\n"],
      expected: ["hoge"],
    },
    {
      name: "multiple boundaries in one chunk",
      contents: ["hoge\n\nfuga\n\n"],
      expected: ["hoge", "fuga"],
    },
  ])("pattern: $name", async ({ contents, expected }) => {
    const readable = createTestingBinaryStream(contents);

    const lines: string[] = [];
    for await (const line of readable.pipeThrough(new BinToStringLine())) {
      lines.push(line);
    }

    expect(lines).toEqual(expected);
  });
});

function createTestingBinaryStream(contents: readonly string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(ctrl) {
      for (const content of contents) {
        const value = encoder.encode(content);
        ctrl.enqueue(value);
      }
      ctrl.close();
    },
  });
  return body;
}
