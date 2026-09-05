import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

import { gatewayModel } from "./ai-gateway.server";
import {
  AUDIENCES,
  EMAIL_SYSTEM_PROMPT,
  MEETING_SYSTEM_PROMPT,
  RESEARCH_SYSTEM_PROMPT,
  TONES,
} from "./prompts";

async function run(system: string, prompt: string) {
  const result = streamText({
    model: gatewayModel(),
    system,
    prompt,
  });
  // Streaming on the wire keeps long generations alive; we return the final text.
  return { text: (await result.text).trim() };
}

const EmailInput = z.object({
  brief: z.string().min(1).max(8000),
  tone: z.enum(TONES),
  audience: z.enum(AUDIENCES),
  sender: z.string().max(200).optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const prompt = [
      `TONE: ${data.tone}`,
      `AUDIENCE: ${data.audience}`,
      data.sender ? `SIGN OFF AS: ${data.sender}` : null,
      "",
      "BRIEF:",
      data.brief,
    ]
      .filter(Boolean)
      .join("\n");

    return run(EMAIL_SYSTEM_PROMPT, prompt);
  });

const NotesInput = z.object({
  notes: z.string().min(1).max(60000),
  context: z.string().max(500).optional(),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NotesInput.parse(input))
  .handler(async ({ data }) => {
    const prompt = [
      data.context ? `MEETING CONTEXT: ${data.context}` : null,
      "",
      "RAW NOTES / TRANSCRIPT:",
      data.notes,
    ]
      .filter(Boolean)
      .join("\n");

    return run(MEETING_SYSTEM_PROMPT, prompt);
  });

const ResearchInput = z.object({
  source: z.string().min(1).max(60000),
  goal: z.string().max(500).optional(),
});

export const researchBrief = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) => {
    const prompt = [
      data.goal ? `READER'S GOAL: ${data.goal}` : null,
      "",
      "SOURCE TEXT OR TOPIC:",
      data.source,
    ]
      .filter(Boolean)
      .join("\n");

    return run(RESEARCH_SYSTEM_PROMPT, prompt);
  });
