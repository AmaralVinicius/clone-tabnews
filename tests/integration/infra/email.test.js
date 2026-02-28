import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "CursoDev <contato@curso.dev>",
      to: "contato@node.js",
      subject: "Email test",
      text: "Body test",
    });

    await email.send({
      from: "CursoDev <contato@curso.dev>",
      to: "contato@node.js",
      subject: "Second email test",
      text: "Second body test",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@curso.dev>");
    expect(lastEmail.recipients[0]).toBe("<contato@node.js>");
    expect(lastEmail.subject).toBe("Second email test");
    expect(lastEmail.text).toBe("Second body test\n");
  });
});
