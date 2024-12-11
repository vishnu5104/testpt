'use client';
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
} from '@burnt-labs/abstraxion';
import { Button } from '@burnt-labs/ui';
import { useEffect, useState } from 'react';
import type { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { CONTRACTS, POTATO_ID, TREASURY } from '@/utils/constants';
import type { GranteeSignerClient } from '@burnt-labs/abstraxion-core';

type ExecuteResultOrUndefined = ExecuteResult | string | undefined;

async function write(
  client: GranteeSignerClient | undefined,
  msg: unknown,
  sender: string,
  contract: string
) {
  if (!client) return;
  return client.execute(
    sender,
    contract,
    msg,
    {
      amount: [{ amount: '1', denom: 'uxion' }],
      gas: '500000',
      granter: TREASURY.treasury,
    },
    '',
    []
  );
}

async function read(
  client: GranteeSignerClient | undefined,
  msg: unknown,
  contract: string
) {
  if (!client) return;
  return client.queryContractSmart(contract, msg);
}

export default function Page(): JSX.Element {
  // Abstraxion hooks
  const {
    data: { bech32Address },
    isConnected,
    isConnecting,
  } = useAbstraxionAccount();

  // General state hooks
  const [, setShow] = useModal();

  const [executeResult, setExecuteResult] =
    useState<ExecuteResultOrUndefined>(undefined);
  const [ownerOfPotato, setOwnerOfPotato] = useState<string | undefined>();
  const [transferTo, setTransferTo] = useState<string>('');
  const { client } = useAbstraxionSigningClient();

  // to display loading state while the function executes
  const [loading, setLoading] = useState(false);

  const execute = async (type: 'read' | 'write', msg: unknown) => {
    setLoading(true);
    setExecuteResult(undefined);

    try {
      if (type === 'write') {
        const res = await write(client, msg, bech32Address, CONTRACTS.potato);
        setExecuteResult(res);
      }

      if (type === 'read') {
        const res = await read(client, msg, CONTRACTS.potato);

        setExecuteResult(res);
      }
    } catch (err) {
      setExecuteResult('there was an error, check logs');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // watch isConnected and isConnecting
  // only added for testing
  useEffect(() => {
    console.log({ isConnected, isConnecting });
  }, [isConnected, isConnecting]);

  const getPotatoOwner = async () => {
    setOwnerOfPotato('Loading...');
    const msg = { owner_of: { token_id: POTATO_ID } };
    try {
      const res = await read(client, msg, CONTRACTS.potato);
      setOwnerOfPotato(res['owner']);
    } catch (err) {
      console.log(err);
      setOwnerOfPotato(undefined);
    }
  };
  useEffect(() => {
    if (!client) return;
    getPotatoOwner();
  }, [client, executeResult]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 w-full px-12">
      <h1 className="text-2xl font-bold tracking-tighter text-black dark:text-white">
        Potato 🥔
      </h1>
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-row w-full gap-6">
          <Button
            fullWidth
            onClick={() => {
              setShow(true);
            }}
            structure="base"
          >
            {bech32Address ? (
              <div className="flex items-center justify-center">
                VIEW ACCOUNT
              </div>
            ) : (
              'CONNECT'
            )}
          </Button>
          <Button
            disabled={loading || !bech32Address}
            fullWidth
            onClick={() => setExecuteResult(undefined)}
            structure="base"
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-col w-full gap-6">
          <div className="flex flex-row w-full gap-6">
            <Button
              disabled={loading || !bech32Address}
              fullWidth
              onClick={() => execute('read', { minter: {} })}
              structure="base"
            >
              Read Minter
            </Button>
            <Button
              disabled={loading || !bech32Address}
              fullWidth
              onClick={() => execute('read', { contract_info: {} })}
              structure="base"
            >
              Read Contract Info
            </Button>
          </div>
          <div className="flex flex-row w-full gap-6">
            {/* WRITE functions */}
            <Button
              disabled={loading || !bech32Address || !!ownerOfPotato}
              onClick={() =>
                execute('write', {
                  mint: {
                    token_id: POTATO_ID,
                    owner: bech32Address,
                    token_uri: null,
                    extension: {},
                  },
                })
              }
              structure="base"
              className="w-[50%]"
            >
              Execute Mint
            </Button>
            <div className="flex flex-row gap-2 w-[50%]">
              <input
                type="text"
                name="recipient"
                id="recipient"
                className="grow rounded-md text-black bg-primary border-2 border-foreground ring-0 active:ring-0"
                disabled={ownerOfPotato !== bech32Address}
                value={transferTo}
                onChange={(v) => setTransferTo(v.target.value)}
              />
              <Button
                disabled={
                  loading || !bech32Address || ownerOfPotato !== bech32Address
                }
                onClick={() =>
                  execute('write', {
                    transfer_nft: {
                      token_id: '1',
                      recipient: transferTo,
                    },
                  })
                }
                structure="base"
              >
                Transfer
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-2 border-primary rounded-md p-4 grid grid-cols-[30%_70%] grid-flow-row gap-4 w-full">
        <div>your account address</div>
        <pre className="w-full overflow-auto p-2 text-wrap">
          {bech32Address}
        </pre>
        <div>potato contract</div>
        <pre className="w-full overflow-auto p-2 text-wrap">
          {CONTRACTS.potato}
        </pre>
        <div>Potato ID</div>
        <pre>{POTATO_ID}</pre>
        <div>Potato Current Owner</div>
        <pre>
          {/* query the contract */}
          {ownerOfPotato || 'Owner undefined'}
          {ownerOfPotato === bech32Address && ` (You! 🫵)`}
        </pre>
        <div>execution result</div>
        <pre className="w-full overflow-auto p-2 h-60 text-wrap">
          {loading
            ? 'Loading...'
            : JSON.stringify(executeResult, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
              )}
        </pre>
      </div>
      <Abstraxion onClose={() => setShow(false)} />
    </main>
  );
}
