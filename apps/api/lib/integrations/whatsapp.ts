import { prisma } from "../prisma";
import { env } from "../env";

export type WhatsAppTemplate =
  | "rider_assigned"
  | "customer_order_placed"
  | "customer_order_confirmed"
  | "out_for_delivery"
  | "delivered"
  | "subscription_reminder"
  | "custom_request_approved"
  | "custom_request_rejected";

export interface WhatsAppProvider {
  sendMessage(toPhone: string, template: WhatsAppTemplate, payload: Record<string, unknown>): Promise<void>;
}

export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(toPhone: string, template: WhatsAppTemplate, payload: Record<string, unknown>) {
    await prisma.notificationLog.create({
      data: {
        channel: "WHATSAPP",
        template,
        payload: payload as object,
        status: "MOCK_SENT",
        error: null,
      },
    });
  }
}

class HttpWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(toPhone: string, template: WhatsAppTemplate, payload: Record<string, unknown>) {
    const e = env();
    const url = e.WHATSAPP_API_URL;
    const token = e.WHATSAPP_API_TOKEN;
    if (!url || !token) throw new Error("WHATSAPP_NOT_CONFIGURED");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: toPhone, template, payload }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WhatsApp HTTP ${res.status}: ${text}`);
    }
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  try {
    const e = env();
    if (e.WHATSAPP_PROVIDER === "http" && e.WHATSAPP_API_URL && e.WHATSAPP_API_TOKEN) {
      return new HttpWhatsAppProvider();
    }
  } catch {
    /* env not loaded in tests */
  }
  return new MockWhatsAppProvider();
}
