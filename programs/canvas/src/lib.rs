mod constants;
mod error;
mod program_accounts;
mod state_accounts;

use anchor_lang::prelude::*;

use constants::*;
use error::ErrorCode;
use program_accounts::*;

declare_id!("BJCgYB56gxD9WsVaQanFoNByarTQm7qhsVLVKT6We8jn");

#[program]
pub mod canvas {
    use anchor_spl::token;
    use mpl_token_metadata::state::Metadata;
    use spl_token::instruction::AuthorityType;

    use super::*;

    pub fn create_canvas_model(
        ctx: Context<CreateCanvasModel>,
        name: String,
        bump: u8,
    ) -> Result<()> {
        // TODO: The canvas model should be the Collection Authority.
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
        index: u8,
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

        canvas.authority = creator.key();
        canvas.authority_tag = USER_AUTHORITY_TAG;
        canvas.canvas_model = canvas_model.key();
        canvas.creator = creator.key();
        canvas.name = name;
        canvas.bump = bump;

        Ok(())
    }

    pub fn transfer_token_to_canvas(
        ctx: Context<TransferTokenToCanvas>,
        canvas_model: Pubkey,
    ) -> Result<()> {
        let creator = &ctx.accounts.creator;
        let _canvas = &ctx.accounts.canvas;
        let canvas_model_slot = &ctx.accounts.canvas_model_slot;
        let canvas_model_slot_mint_association = &ctx.accounts.canvas_model_slot_mint_association;
        let token_account = &mut ctx.accounts.token_account;
        let cs_token_account = &mut ctx.accounts.canvas_slot_token_account;
        let token_program = &ctx.accounts.token_program;

        //TODO: Use anchor constraints.
        if canvas_model_slot_mint_association
            .canvas_model_slot
            .ne(&canvas_model_slot.key())
            || canvas_model_slot_mint_association
                .canvas_model
                .ne(&canvas_model.key())
        {
            msg!("invalid canvas model slot mint association");
            return Err(ErrorCode::InvalidCanvasModelSlotMintAssociation.into());
        }

        if token_account.amount != 1 {
            msg!("users token account balance must equal 1");
            return Err(ErrorCode::InvalidUserTokenAccountBalance.into());
        }

        if cs_token_account.amount != 0 {
            msg!("program token account balance must equal 0");
            return Err(ErrorCode::InvalidProgramTokenAccountBalance.into());
        }

        msg!("checked token balances");

        let cpi_context = CpiContext::new(
            token_program.to_account_info(),
            token::Transfer {
                from: token_account.to_account_info(),
                to: cs_token_account.to_account_info(),
                authority: creator.to_account_info(),
            },
        );

        msg!("preparing to transfer");
        token::transfer(cpi_context, 1).map_err(|_| ErrorCode::FailedToTransfer.into())
    }

    pub fn transfer_token_from_canvas_to_account(
        ctx: Context<TransferTokenFromCanvasToAccount>,
    ) -> Result<()> {
        let _authority = &ctx.accounts.authority;
        let canvas = &ctx.accounts.canvas;
        let token_account = &ctx.accounts.token_account;
        let canvas_slot_token_account = &ctx.accounts.canvas_slot_token_account;
        let token_program = &ctx.accounts.token_program;
        let mint = &ctx.accounts.mint;

        let bump_vector = canvas.bump.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"canvas".as_ref(),
            canvas.creator.as_ref(),
            canvas.canvas_model.as_ref(),
            canvas.name.as_bytes(),
            bump_vector.as_ref(),
        ]];

        match canvas.authority_tag {
            USER_AUTHORITY_TAG => {}
            MINT_AUTHORITY_TAG => {
                let associated_mint_pubkey = canvas
                    .associated_mint
                    .ok_or(ErrorCode::InvalidCanvasAuthority)?;

                if mint.key().ne(&associated_mint_pubkey) {
                    msg!(
                        "mint account must match stored canvas authority\ngot: {}\n expected: {}",
                        mint.key(),
                        associated_mint_pubkey
                    );
                    return Err(ErrorCode::InvalidMint.into());
                }
                if token_account.mint.ne(&mint.key()) {
                    msg!("invalid token account for mint {}", mint.key());
                    return Err(ErrorCode::InvalidMint.into());
                }
                if canvas.associated_mint.ne(&Some(mint.key())) {
                    msg!("mint account must be the canvas' associated mint");
                    return Err(ErrorCode::InvalidMintAuthority.into());
                }
                if token_account.amount.ne(&1) {
                    msg!("token account must hold exactly 1 token");
                    return Err(ErrorCode::InvalidUserTokenAccountBalance.into());
                }
                if mint.supply.ne(&1) {
                    msg!("only one token may exist");
                    return Err(ErrorCode::InvalidMintSupply.into());
                }
            }
            _ => return Err(ErrorCode::InvalidCanvasAuthority.into()),
        }

        let cpi_context = CpiContext::new_with_signer(
            token_program.to_account_info(),
            token::Transfer {
                from: canvas_slot_token_account.to_account_info(),
                to: token_account.to_account_info(),
                authority: canvas.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(cpi_context, 1).map_err(|_| ErrorCode::FailedToTransfer.into())
    }

    pub fn burn_token_and_claim_canvas_authority(
        ctx: Context<BurnTokenAndClaimCanvasAuthority>,
    ) -> Result<()> {
        let authority = &ctx.accounts.authority;
        let canvas_model = &ctx.accounts.canvas_model;
        let canvas = &mut ctx.accounts.canvas;
        let mint = &ctx.accounts.mint;
        let token_account = &ctx.accounts.token_account;
        let unchecked_metadata = &ctx.accounts.metadata;
        let token_program = &ctx.accounts.token_program;
        // authenticate the token holder:
        // make sure the canvas authority type is mint.
        if canvas.authority_tag.ne(&MINT_AUTHORITY_TAG) {
            return Err(ErrorCode::InvalidCanvasAuthority.into());
        }
        // make sure the mint exists.
        // make sure the mint has no mint authority
        if mint.mint_authority.is_some() {
            return Err(ErrorCode::InvalidMint.into());
        }
        // make sure they have a token account for the mint
        // make sure the token account holds one token
        if token_account.amount.ne(&1) {
            return Err(ErrorCode::InvalidUserTokenAccountBalance.into());
        }
        // make sure the signer has authority over the token account
        // make sure the nft metadata says the nft belongs to the canvas' collection_mint.
        let metadata = Metadata::from_account_info(&unchecked_metadata.to_account_info())
            .or_else(|_| Err(ErrorCode::InvalidMetadataAccount))?;

        if let None = metadata.collection {
            return Err(ErrorCode::InvalidCollection.into());
        }

        let metadata_collection = metadata.collection.unwrap();
        if !metadata_collection.verified
            || metadata_collection.key.ne(&canvas_model.collection_mint)
        {
            return Err(ErrorCode::InvalidCollection.into());
        }

        // burn the token
        let cpi_context = CpiContext::new(
            token_program.to_account_info(),
            token::Burn {
                mint: mint.to_account_info(),
                from: token_account.to_account_info(),
                authority: authority.to_account_info(),
            },
        );

        token::burn(cpi_context, 1)?;

        // close the associated token account
        let cpi_context_2 = CpiContext::new(
            token_program.to_account_info(),
            token::CloseAccount {
                account: token_account.to_account_info(),
                destination: authority.to_account_info(),
                authority: authority.to_account_info(),
            },
        );

        token::close_account(cpi_context_2)?;
        // change the authority type to user
        // change the authority to the user
        canvas.authority_tag = USER_AUTHORITY_TAG;
        canvas.authority = authority.key();

        Ok(())
    }

    pub fn commit_mint(ctx: Context<CommitMint>) -> Result<()> {
        let canvas = &mut ctx.accounts.canvas;
        let canvas_model = &ctx.accounts.canvas_model;
        let creator_token_account = &ctx.accounts.creator_token_account;
        let mint = &ctx.accounts.mint;
        let unchecked_metadata = &ctx.accounts.metadata_account;
        let token_program = &ctx.accounts.token_program;

        // metadata account should deserialize.
        let metadata = Metadata::from_account_info(&unchecked_metadata.to_account_info())
            .or_else(|_| Err(ErrorCode::InvalidMetadataAccount))?;
        // collection sould match the collection specified during the creation of the CanvasModel account.
        let collection = metadata.collection.ok_or(ErrorCode::InvalidCollection)?;

        if collection.key != canvas_model.collection_mint {
            return Err(ErrorCode::InvalidCollection.into());
        }

        let bump_vector = canvas.bump.to_le_bytes();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"canvas".as_ref(),
            canvas.creator.as_ref(),
            canvas.canvas_model.as_ref(),
            canvas.name.as_bytes(),
            bump_vector.as_ref(),
        ]];

        let mint_to_context = CpiContext::new_with_signer(
            token_program.to_account_info(),
            token::MintTo {
                mint: mint.to_account_info(),
                to: creator_token_account.to_account_info(),
                authority: canvas.to_account_info(),
            },
            signer_seeds,
        );

        // TODO: sign this new NFT in as a member of the collection.

        token::mint_to(mint_to_context, 1)?;
        // one nft should be minted to the user.
        // the mint authority should be disabled after.

        let set_authority_context = CpiContext::new_with_signer(
            token_program.to_account_info(),
            token::SetAuthority {
                current_authority: canvas.to_account_info(),
                account_or_mint: mint.to_account_info(),
            },
            signer_seeds,
        );

        token::set_authority(set_authority_context, AuthorityType::MintTokens, None)?;

        canvas.authority = mint.key();
        canvas.authority_tag = MINT_AUTHORITY_TAG;
        canvas.associated_mint = Some(mint.key());

        Ok(())
    }
}
