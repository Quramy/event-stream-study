import { ParseEventStream } from "./ParseEventStream";

describe(ParseEventStream, () => {
  it("transform binary stream to event string", async () => {
    const readable = createTestingBinaryStream([
      "event: hoge\n",
      "id: fuga\n",
      "data: someData\n",
      "data: anotherData\n\n",
    ]);

    const events: string[] = [];
    for await (const event of readable.pipeThrough(new ParseEventStream())) {
      events.push(event);
    }

    expect(events).toEqual([
      "event: hoge\n" + "id: fuga\n" + "data: someData\n" + "data: anotherData",
    ]);
  });

  it("transform binary stream to multiple data", async () => {
    const readable = createTestingBinaryStream([
      "data: someData\n\n",
      "data: anotherData\n\n",
    ]);

    const events: string[] = [];
    for await (const event of readable.pipeThrough(new ParseEventStream())) {
      events.push(event);
    }

    expect(events).toEqual(["data: someData", "data: anotherData"]);
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
      name: "splitted boundary token",
      contents: ["hoge\n", "\nfuga", "\n\n"],
      expected: ["hoge", "fuga"],
    },
    {
      name: "multiple boundaries in one chunk",
      contents: ["hoge\n\nfuga\n\n"],
      expected: ["hoge", "fuga"],
    },
    {
      name: "CRLF as end-of-line token",
      contents: ["hoge\r\n\r\n"],
      expected: ["hoge"],
    },
    {
      name: "CR as end-of-line token",
      contents: ["hoge\r\r"],
      expected: ["hoge"],
    },
    {
      name: "Including utf8 BOM",
      contents: ["\uFEFF", "hoge\n\n"],
      expected: ["hoge"],
    },
  ])("pattern: $name", async ({ contents, expected }) => {
    const readable = createTestingBinaryStream(contents);

    const lines: string[] = [];
    for await (const line of readable.pipeThrough(new ParseEventStream())) {
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
