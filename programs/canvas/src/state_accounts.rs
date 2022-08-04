use crate::constants::*;
use anchor_lang::prelude::*;

// State Accounts
#[account]
pub struct CanvasModel {
    pub creator: Pubkey,
    pub name: String,
    pub collection_mint: Pubkey,
    pub slot_count: u8,
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
    pub canvas_model: Pubkey,
    pub name: String,
    pub index: u8,
    pub bump: u8,
}

impl CanvasModelSlot {
    const INDEX_LENGTH: usize = 1;
    pub const LENGTH: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + NAME_LENGTH
        + CanvasModelSlot::INDEX_LENGTH
        + BUMP_LENGTH;
}

#[account]
pub struct Canvas {
    pub name: String,
    pub canvas_model: Pubkey,
    pub creator: Pubkey,
    pub authority: Pubkey,
    pub authority_tag: u8,
    pub associated_mint: Option<Pubkey>,
    pub bump: u8,
}

impl Canvas {
    pub const LENGTH: usize = DISCRIMINATOR_LENGTH
        + NAME_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH
        + OPTION_LENGTH
        + PUBLIC_KEY_LENGTH
        + 1; // one byte for the authority tag.
}

#[account]
pub struct Incrementor {
    pub creator: Pubkey,
    pub head: u8,
    pub bump: u8,
}

impl Incrementor {
    const HEAD_LENGTH: usize = 8;
    pub const LENGTH: usize =
        DISCRIMINATOR_LENGTH + Incrementor::HEAD_LENGTH + PUBLIC_KEY_LENGTH + BUMP_LENGTH;
}

#[account]
pub struct CanvasModelSlotMintAssociation {
    pub mint: Pubkey,
    pub canvas_model: Pubkey,
    pub canvas_model_slot: Pubkey,
    pub is_collection: bool,
    pub bump: u8,
}

impl CanvasModelSlotMintAssociation {
    pub const LENGTH: usize = DISCRIMINATOR_LENGTH
        + BOOL_LENGTH
        + BUMP_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH
        + PUBLIC_KEY_LENGTH;
}
