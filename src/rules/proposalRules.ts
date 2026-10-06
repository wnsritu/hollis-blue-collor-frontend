export interface ProposalCreateParams {
  hasCapability: boolean;
  existingProposal?: any | null;
  projectStatus?: string;
}

export interface ProposalEditParams {
  hasCapability: boolean;
  proposal?: any | null;
}

export interface ProposalWithdrawParams {
  proposal?: any | null;
}

export const proposalRules = {
  /**
   * Evaluates if a provider can create a proposal for a project.
   * Requires:
   * 1. Global capability: can("createProposal")
   * 2. Business condition: No existing active proposal from this provider
   * 3. Business condition: Project status is open / quote_pending / requested
   */
  canCreate: ({
    hasCapability,
    existingProposal = null,
    projectStatus = "open",
  }: ProposalCreateParams): boolean => {
    if (!hasCapability) return false;
    if (existingProposal) return false;
    const allowedStatuses = ["open", "matching", "proposals_received", "quote_pending", "requested", "submitted", "active"];
    return allowedStatuses.includes((projectStatus || "open").toLowerCase());
  },

  /**
   * Evaluates if a proposal can be edited.
   * Editing an existing proposal is allowed if status is draft or submitted.
   */
  canEdit: ({
    hasCapability = true,
    proposal = null,
  }: ProposalEditParams): boolean => {
    if (!hasCapability) return false;
    if (!proposal) return false;
    const editableStatuses = ["draft", "submitted"];
    return editableStatuses.includes((proposal.status || "").toLowerCase());
  },

  /**
   * Evaluates if a proposal can be withdrawn by provider.
   */
  canWithdraw: ({ proposal = null }: ProposalWithdrawParams): boolean => {
    if (!proposal) return false;
    return (proposal.status || "").toLowerCase() === "submitted";
  },
};

export default proposalRules;
