use anchor_lang::prelude::*;

declare_id!("En2Lrpp4Tp5racyLM5RBsHWtnDbRmcwhKboJqwAY3AxX");

#[program]
pub mod reintialization_attack {

    use anchor_lang::{
        solana_program::native_token::LAMPORTS_PER_SOL,
        system_program::{transfer, Transfer},
    };

    use super::*;

    pub fn deposit_user_amount(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let accounts = ctx.accounts;
        let program = &accounts.system_program;

        let cpi_accounts = Transfer {
            from: accounts.user.to_account_info(),
            to: accounts.user_account.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(program.to_account_info(), cpi_accounts);
        transfer(cpi_ctx, amount * LAMPORTS_PER_SOL)?;

        // save the data
        accounts.user_account.user_admin = accounts.user.key();
        accounts.user_account.balance = amount;

        Ok(())
    }
    pub fn withdraw_amount(ctx: Context<WithdrawAmount>) -> Result<()> {
        let lamport_amount = ctx.accounts.user_account.to_account_info().lamports();

        ctx.accounts.user_account.sub_lamports(lamport_amount)?;
        ctx.accounts.user.add_lamports(lamport_amount)?;

        // Now the PDA is unitialized in POV to anchor
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + User::INIT_SPACE,
        seeds = [b"user", user.key().to_bytes().as_ref()],
        bump
    )]
    pub user_account: Account<'info, User>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawAmount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user",user_account.user_admin.to_bytes().as_ref()],
        bump
    )]
    pub user_account: Account<'info, User>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct User {
    pub user_admin: Pubkey,
    pub balance: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Incorrect lamports")]
    InCorrectLAMP,
}
