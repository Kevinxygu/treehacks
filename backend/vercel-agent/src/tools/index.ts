import { medicationTools } from "./medication.js";
import { contactTools } from "./contacts.js";
import { billTools } from "./bills.js";
import { weatherTools } from "./weather.js";
import { appointmentTools } from "./appointments.js";
import { emailTools } from "./email.js";
import { rideTools } from "./rides.js";

/**
 * All tools available to the agent.
 * The AI SDK will expose these to the model for function-calling.
 */
export const allTools = {
  // MongoDB-backed tools
  ...medicationTools,
  ...contactTools,
  ...billTools,

  // External API tools
  ...weatherTools,
  ...appointmentTools,
  ...emailTools,

  // Browserbase-powered tools
  ...rideTools,
};

export type AllTools = typeof allTools;

export { getRemoteTools } from "./remoteTools.js";
