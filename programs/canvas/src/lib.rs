use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

declare_id!("JA7XU4JeTBraEuVthAMRgg2LFc5oBTGfXxuDm1rPzZCZ");

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const BUMP_LENGTH: usize = 1;
const NAME_LENGTH: usize = 64;

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
pub struct CanvasModelSlotMint {
    component_slot: Pubkey,
    mint: Pubkey,
    is_collection: bool,
}

#[account]
pub struct Canvas {
    canvas_model: Pubkey,
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

#[error_code]
pub enum ErrorCode {
    NameTooLong,
}
