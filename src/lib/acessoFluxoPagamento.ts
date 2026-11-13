// Relatório de fluxo de pagamento: acesso exclusivo da Larissa Rodovalho.
export const FLUXO_PAGAMENTO_USER_IDS = ["5e6a90fc-c806-4cd9-8dfe-9067126ece93"];
export const podeVerFluxoPagamento = (userId?: string | null) => !!userId && FLUXO_PAGAMENTO_USER_IDS.includes(userId);
