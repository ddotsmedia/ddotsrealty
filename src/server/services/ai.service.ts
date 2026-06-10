import { anthropic, aiConfigured, pickModel } from "@/lib/ai";

export interface PropertyDescriptionInput {
  title: string;
  type: string;
  bedrooms?: number | null;
  community?: string | null;
  price?: number | null;
}

export async function generatePropertyDescription(
  input: PropertyDescriptionInput,
): Promise<string> {
  if (!aiConfigured || !anthropic) {
    return (
      `${input.title} - ${input.type}` +
      (input.bedrooms ? ` ${input.bedrooms}BR` : "") +
      (input.community ? ` in ${input.community}` : "") +
      (input.price ? ` - AED ${input.price}` : "")
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: pickModel("property_description"),
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Write a compelling UAE real estate listing description for: ${JSON.stringify(input)}`,
        },
      ],
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === "text") {
      return firstBlock.text;
    }

    return `${input.title} - ${input.type}`;
  } catch (error) {
    console.error("[ai] generatePropertyDescription failed:", error);
    return `${input.title} - ${input.type}`;
  }
}

export interface LeadReplyInput {
  leadName: string;
  enquiry: string;
}

export async function generateLeadReply(input: LeadReplyInput): Promise<string> {
  if (!aiConfigured || !anthropic) {
    return `Thank you for your enquiry, ${input.leadName}. We will get back to you shortly.`;
  }

  try {
    const response = await anthropic.messages.create({
      model: pickModel("lead_reply"),
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Generate a professional reply to this real estate enquiry from ${input.leadName}: "${input.enquiry}"`,
        },
      ],
    });

    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === "text") {
      return firstBlock.text;
    }

    return `Thank you for your enquiry, ${input.leadName}. We will get back to you shortly.`;
  } catch (error) {
    console.error("[ai] generateLeadReply failed:", error);
    return `Thank you for your enquiry, ${input.leadName}. We will get back to you shortly.`;
  }
}
