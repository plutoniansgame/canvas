use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
    NameTooLong,
    HeadNotAtIndex,
    InvalidUserTokenAccount,
    InvalidUserTokenAccountBalance,
    InvalidProgramTokenAccountBalance,
    InvalidCanvasModelSlotMintAssociation,
    InvalidPDA,
    InvalidCanvasAuthority,
    InvalidMetadataAccount,
    InvalidMint,
    InvalidMintSupply,
    InvalidMintAuthority,
    InvalidCollection,
    FailedToTransfer,
}
