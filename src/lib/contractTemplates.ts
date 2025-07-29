import { supabase } from "@/integrations/supabase/client";
import assetSaleConfig from "../../contracts/templates/asset-sale/config.json" assert { type: "json" };
import assetSaleSchema from "../../contracts/templates/asset-sale/schema.json" assert { type: "json" };
import botLeaseConfig from "../../contracts/templates/bot-lease/config.json" assert { type: "json" };
import botLeaseSchema from "../../contracts/templates/bot-lease/schema.json" assert { type: "json" };
import peerEscrowConfig from "../../contracts/templates/peer-escrow/config.json" assert { type: "json" };
import peerEscrowSchema from "../../contracts/templates/peer-escrow/schema.json" assert { type: "json" };

export type ActionType = "buy" | "sell" | "rent" | "learn";

const templates = {
  "asset-sale": { config: assetSaleConfig, schema: assetSaleSchema },
  "bot-lease": { config: botLeaseConfig, schema: botLeaseSchema },
  "peer-escrow": { config: peerEscrowConfig, schema: peerEscrowSchema },
};

const actionTemplateMap: Record<ActionType, keyof typeof templates> = {
  buy: "asset-sale",
  sell: "asset-sale",
  rent: "bot-lease",
  learn: "peer-escrow",
};

export async function injectContractTemplate(action: ActionType) {
  const key = actionTemplateMap[action];
  const template = templates[key];
  const { config, schema } = template;

  const { error } = await supabase.from("smart_contract_functions").insert({
    function_name: config.function_name,
    contract_type: config.contract_type,
    xrpl_transaction_type: config.xrpl_transaction_type,
    parameters: schema,
    compliance_rules: config.compliance_rules,
    version: config.version,
    deployment_status: "deployed",
  });

  if (error) {
    console.error("Failed to inject contract template", error);
  }
}
