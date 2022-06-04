use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("JA7XU4JeTBraEuVthAMRgg2LFc5oBTGfXxuDm1rPzZCZ");

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const BUMP_LENGTH: usize = 1;
const NAME_LENGTH: usize = 64;
const BOOL_LENGTH: usize = 1;

#[program]
pub mod canvas {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn set_authority(_ctx: Context<SetAuthority>) -> Result<()> {
        Ok(())
    }

    pub fn create_canvas_model(
        ctx: Context<CreateCanvasModel>,
        name: String,
        bump: u8,
    ) -> Result<()> {
        if name.len() > NAME_LENGTH {
            return Err(ErrorCode::NameTooLong.into());
        }

        let canvas_model = &mut ctx.accounts.canvas_model;
        let collection_mint = &ctx.accounts.collection_mint;
        let creator = &ctx.accounts.creator;

        canvas_model.creator = creator.key();
        canvas_model.name = name;
        canvas_model.collection_mint = collection_mint.key();
        canvas_model.bump = bump;
        canvas_model.slot_count = 0;

        Ok(())
    }

    pub fn create_canvas_model_slot(
        ctx: Context<CreateCanvasModelSlot>,
        name: String,
        index: u32,
        bump: u8,
    ) -> Result<()> {
        if name.len() > NAME_LENGTH {
            return Err(ErrorCode::NameTooLong.into());
        }

        let canvas_model = &mut ctx.accounts.canvas_model;
        let canvas_model_slot = &mut ctx.accounts.canvas_model_slot;
        let incrementor = &mut ctx.accounts.incrementor;

        incrementor.head += 1;

        if index.ne(&incrementor.head.into()) {
            return Err(ErrorCode::HeadNotAtIndex.into());
        }

        canvas_model_slot.name = name;
        canvas_model.slot_count += 1;
        canvas_model_slot.index = index;
        canvas_model_slot.canvas_model = canvas_model.key();
        canvas_model_slot.bump = bump;

        Ok(())
    }

    pub fn create_canvas_model_slot_incrementor(
        ctx: Context<CreateCanvasModelSlotIncrementor>,
        id: String,
        bump: u8,
    ) -> Result<()> {
        let incrementor = &mut ctx.accounts.incrementor;
        let creator = &ctx.accounts.creator;
        msg!(
            "creating new incrementor for {:?} with id {:?}",
            creator.key(),
            id
        );

        incrementor.head = 0;
        incrementor.bump = bump;
        incrementor.creator = creator.key();

        Ok(())
    }

    pub fn create_canvas_model_slot_mint_association(
        ctx: Context<CreateCanvasModelSlotMintAssociation>,
        _slot_index: u8,
        is_collection: bool,
        bump: u8,
    ) -> Result<()> {
        let canvas_model = &ctx.accounts.canvas_model;
        let canvas_model_slot = &ctx.accounts.canvas_model_slot;
        let mint = &ctx.accounts.associated_mint;
        let sm = &mut ctx.accounts.canvas_model_slot_mint_association;

        sm.canvas_model = canvas_model.key();
        sm.canvas_model_slot = canvas_model_slot.key();
        sm.mint = mint.key();
        sm.is_collection = is_collection;
        sm.bump = bump;

        Ok(())
    }

    pub fn create_canvas(ctx: Context<CreateCanvas>, name: String, bump: u8) -> Result<()> {
        if name.len() > NAME_LENGTH {
            return Err(ErrorCode::NameTooLong.into());
        }
        let canvas_model = &ctx.accounts.canvas_model;
        let canvas = &mut ctx.accounts.canvas;
        let creator = &ctx.accounts.creator;

        canvas.canvas_model = canvas_model.key();
        canvas.creator = creator.key();
        canvas.name = name;
        canvas.bump = bump;

        Ok(())
    }

    pub fn add_token_to_canvas_slot(ctx: Context<AddTokenToCanvasSlot>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct SetAuthority {}

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
    pub collection_mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(id: String)]
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
#[instruction(slot_index: u8)]
pub struct AddTokenToCanvasSlot<'info> {
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
    )
    ]
    canvas: Account<'info, Canvas>,
    #[account(
        seeds = [
            b"canvas_model", 
            creator.key().as_ref(),
            canvas_model.name.as_ref(),
            canvas_model.collection_mint.as_ref()
        ],
        bump
    )]
    canvas_model: Account<'info, CanvasModel>,
    #[account(
        seeds = [
            b"canvas_model_slot",
            creator.key().as_ref(),
            canvas_model.key().as_ref(),
            canvas_model.name.as_ref(),
            &[slot_index]
        ],
        bump,
        has_one = canvas_model
    )]
    canvas_model_slot: Account<'info, CanvasModelSlot>,
    mint: Account<'info, Mint>,
    token_account: Account<'info, TokenAccount>,
    canvas_slot_token_account: Account<'info, TokenAccount>,
    creator: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}
// State Accounts
#[account]
pub struct CanvasModel {
    pub creator: Pubkey,
    pub name: String,
    pub collection_mint: Pubkey,
    pub slot_count: u32,
    pub bump: u8,
}

impl CanvasModel {
    const SLOT_COUNT_LENGTH: usize = 1;
    pub const LENGTH: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + NAME_LENGTH
        + PUBLIC_KEY_LENGTH
        + CanvasModel::SLOT_COUNT_LENGTH
        + BUMP_LENGTH;
}

#[account]
pub struct CanvasModelSlot {
    canvas_model: Pubkey,
    name: String,
    index: u32,
    bump: u8,
}

impl CanvasModelSlot {
    const INDEX_LENGTH: usize = 4;
    const LENGTH: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + NAME_LENGTH
        + CanvasModelSlot::INDEX_LENGTH
        + BUMP_LENGTH;
}

#[account]
pub struct Canvas {
    name: String,
    canvas_model: Pubkey,
    creator: Pubkey,
    bump: u8,
}

impl Canvas {
    const LENGTH: usize =
        DISCRIMINATOR_LENGTH + NAME_LENGTH + PUBLIC_KEY_LENGTH + PUBLIC_KEY_LENGTH;
}

#[account]
pub struct Incrementor {
    creator: Pubkey,
    head: u8,
    bump: u8,
}

impl Incrementor {
    const HEAD_LENGTH: usize = 8;
    const LENGTH: usize =
        DISCRIMINATOR_LENGTH + Incrementor::HEAD_LENGTH + PUBLIC_KEY_LENGTH + BUMP_LENGTH;
}

#[account]
pub struct CanvasModelSlotMintAssociation {
    mint: Pubkey,
    canvas_model: Pubkey,
    canvas_model_slot: Pubkey,
    is_collection: bool,
    bump: u8,
}

impl CanvasModelSlotMintAssociation {
    const LENGTH: usize = DISCRIMINATOR_LENGTH
        + BOOL_LENGTH
        + BUMP_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH;
}

#[error_code]
pub enum ErrorCode {
    NameTooLong,
    HeadNotAtIndex,
}
