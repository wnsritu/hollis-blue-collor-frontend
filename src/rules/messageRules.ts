export interface MessageSendParams {
  hasCapability: boolean;
  project?: any | null;
  booking?: any | null;
  providerId?: number | string | null;
}

export const messageRules = {
  /**
   * Evaluates if provider can send a message to customer.
   */
  canSend: ({
    hasCapability,
    project = null,
    booking = null,
  }: MessageSendParams): boolean => {
    if (!hasCapability) return false;
    if (project && (project.status === "cancelled" || project.status === "closed")) {
      return false;
    }
    if (booking && booking.status === "CANCELLED") {
      return false;
    }
    return true;
  },

  /**
   * Evaluates if attachments can be sent.
   */
  canSendAttachment: (hasAttachmentCapability: boolean): boolean => {
    return hasAttachmentCapability;
  },
};

export default messageRules;
