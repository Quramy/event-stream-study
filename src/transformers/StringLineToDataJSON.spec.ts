import { StringLineToDataJSON } from "./StringLineToDataJSON";

describe(StringLineToDataJSON, () => {
  it("works", async () => {
    const readable = new ReadableStream<string>({
      start(ctrl) {
        ctrl.enqueue(`data: {"a":0}`);
        ctrl.close();
      },
    });

    const onError = jest.fn();
    const jsonStreamReader = readable
      .pipeThrough(new StringLineToDataJSON({ onError }))
      .getReader();

    // Act
    const { value, done } = await jsonStreamReader.read();

    // Assert
    expect(done).toBeFalsy();
    expect(value).toEqual({ a: 0 });
    expect(onError).not.toHaveBeenCalled();
  });
});
