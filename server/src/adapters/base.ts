import { ChatMessage, ModelAdapter } from '../types/index.js';

export abstract class BaseAdapter implements ModelAdapter {
  abstract id: string;
  abstract displayName: string;

  protected getEnv(name: string): string | undefined {
    const raw = process.env[name];
    if (!raw) return undefined;

    let value = raw.trim();

    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }

    // Support common `.env` pattern: `KEY=value  # comment`
    // (dotenv treats inline comments as part of the value unless quoted).
    const hashIndex = value.search(/\s+#/);
    if (hashIndex !== -1) {
      value = value.slice(0, hashIndex).trim();
    }

    return value || undefined;
  }

  protected requireEnv(name: string): string {
    const value = this.getEnv(name);
    if (!value) {
      throw new Error(
        `Missing/invalid env var ${name}. Check server/.env (avoid inline comments like \`KEY=... # comment\`).`
      );
    }
    return value;
  }

  abstract sendMessage(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    stream: boolean;
  }): AsyncGenerator<string>;
}
