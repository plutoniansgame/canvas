use crate::error::ErrorCode;
use crate::state_accounts::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

// Program Accounts
#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCanvasModel<'info> {
    #[account(
        init,
        space = CanvasModel::LENGTH,
        payer = creator,
        seeds = [
            b"canvas_model",
            creator.key().as_ref(),
            name.as_ref(),
            collection_mint.key().as_ref()
        ],
        bump
    )]
    pub canvas_model: Account<'info, CanvasModel>,
    pub collection_mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCanvasModelSlot<'info> {
    #[account(
        mut,
        has_one = collection_mint,
        seeds = [
            b"canvas_model",
            creator.key().as_ref(),
            canvas_model.name.as_ref(),
            collection_mint.key().as_ref()
        ],
        bump
    )]
    pub canvas_model: Account<'info, CanvasModel>,
    #[account(
        mut,
        seeds = [
            b"incrementor",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            b"canvas_model_slot"
        ],
        bump
    )]
    pub incrementor: Account<'info, Incrementor>,
    #[account(
        init,
        space = CanvasModelSlot::LENGTH,
        payer = creator,
        seeds = [
            b"canvas_model_slot",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            name.as_ref(),
            &(incrementor.head + 1).to_be_bytes()
        ],
        bump
    )]
    pub canvas_model_slot: Account<'info, CanvasModelSlot>,
    pub collection_mint: Account<'info, Mint>, // TODO: used for validation, do we *really* need this?
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateCanvasModelSlotIncrementor<'info> {
    #[account(
        seeds = [
            b"canvas_model",
            creator.key().as_ref(),
            canvas_model.name.as_ref(),
            canvas_model.collection_mint.as_ref()
        ],
        bump
    )]
    pub canvas_model: Account<'info, CanvasModel>,
    #[account(
        init,
        space = Incrementor::LENGTH,
        payer = creator,
        seeds = [
            b"incrementor",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            b"canvas_model_slot"
        ],
        bump
    )]
    pub incrementor: Account<'info, Incrementor>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(slot_index: u8)]
pub struct CreateCanvasModelSlotMintAssociation<'info> {
    #[account(
        mut,
        seeds = [
            b"canvas_model",
            creator.key().as_ref(),
            canvas_model.name.as_ref(),
            canvas_model.collection_mint.key().as_ref()
        ],
        bump
    )]
    pub canvas_model: Account<'info, CanvasModel>,
    #[account(
        seeds = [
            b"canvas_model_slot",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            canvas_model_slot.name.as_ref(),
            &[slot_index]
        ],
        bump
    )]
    pub canvas_model_slot: Account<'info, CanvasModelSlot>,
    #[account(
        init,
        space = CanvasModelSlotMintAssociation::LENGTH,
        payer = creator,
        seeds = [
            b"canvas_model_slot_mint",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            canvas_model_slot.key().as_ref(),
            associated_mint.key().as_ref()
        ],
        bump
    )]
    pub canvas_model_slot_mint_association: Account<'info, CanvasModelSlotMintAssociation>,
    pub associated_mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCanvas<'info> {
    #[account(
        seeds = [
            b"canvas_model",
            creator.key().as_ref(),
            canvas_model.name.as_ref(),
            canvas_model.collection_mint.as_ref()
        ],
        bump
    )]
    pub canvas_model: Account<'info, CanvasModel>,
    #[account(
        init,
        space = Canvas::LENGTH,
        payer = creator,
        seeds = [
            b"canvas",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            name.as_ref()
        ],
        bump
    )]
    pub canvas: Account<'info, Canvas>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(canvas_model: Pubkey)]
pub struct TransferTokenToCanvas<'info> {
    #[account(
        seeds = [
            b"canvas",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            canvas.name.as_ref(),
        ],
        bump,
        has_one = canvas_model,
        has_one = creator
    )]
    pub canvas: Account<'info, Canvas>,
    #[account(
        seeds = [
            b"canvas_model_slot",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            canvas_model_slot.name.as_ref(),
           &canvas_model_slot.index.to_be_bytes()
        ],
        bump,
        has_one = canvas_model
    )]
    pub canvas_model_slot: Account<'info, CanvasModelSlot>,
    #[account(mint::decimals = 0)]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = creator
    )]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = creator,
        token::mint = mint,
        token::authority = canvas,
        seeds = [
            b"canvas_token_account",
            creator.key().as_ref(),
            canvas.key().as_ref(),
            canvas_model.key().as_ref(),
            canvas_model_slot.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub canvas_slot_token_account: Account<'info, TokenAccount>,
    pub canvas_model_slot_mint_association: Account<'info, CanvasModelSlotMintAssociation>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferTokenFromCanvasToAccount<'info> {
    #[account(mut)]
    pub canvas: Account<'info, Canvas>,
    #[account(mut)]
    pub canvas_slot_token_account: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CommitMint<'info> {
    #[account(mut, has_one = canvas_model, has_one = creator)]
    pub canvas: Account<'info, Canvas>,
    pub canvas_model: Account<'info, CanvasModel>,
    /// CHECK: We must deserialize this into a metadata struct instance
    /// at runtime.
    pub metadata_account: UncheckedAccount<'info>,
    // an initialized mint that HAS NOT minted an NFT yet.
    #[account(
        constraint = mint.supply == 0 @ ErrorCode::InvalidMintSupply,
        constraint = mint.mint_authority == Some(canvas.key()).into() @ ErrorCode::InvalidMintAuthority
    )]
    pub mint: Account<'info, Mint>,
    pub creator: Signer<'info>,
    #[account(
        has_one = mint,
        constraint = creator_token_account.owner == creator.key() @ ErrorCode::InvalidUserTokenAccount
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    // pub update_authority: Signer<'info>,
    // pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokenAndClaimCanvasAuthority<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
