import React, { useEffect, useState } from "react";
import BlockchainManager from "@/components/BlockchainManager";

interface XRPLStatus {
  ledgerIndex?: number;
  validators?: number;
  tps?: number;
}

const Blockchain = (): JSX.Element => {
  const [status, setStatus] = useState<XRPLStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("https://api.xrpl.org/api/v1/server_info");
        const data = await response.json();
        const info = data?.result?.info;

        setStatus({
          ledgerIndex:
            info?.validated_ledger?.seq ?? info?.validated_ledger?.ledger_index,
          validators: info?.validation_quorum,
          tps: info?.load_factor,
        });
      } catch (error) {
        console.error("Error fetching XRPL status", error);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div>
      <BlockchainManager />
      {status && (
        <div className="mt-4 text-sm">
          {status.ledgerIndex !== undefined && (
            <p>Ledger Index: {status.ledgerIndex}</p>
          )}
          {status.validators !== undefined && (
            <p>Validators: {status.validators}</p>
          )}
          {status.tps !== undefined && <p>TPS: {status.tps}</p>}
        </div>
      )}
    </div>
  );
};

export default Blockchain;
