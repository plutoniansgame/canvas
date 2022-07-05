pub const DISCRIMINATOR_LENGTH: usize = 8;
pub const PUBLIC_KEY_LENGTH: usize = 32;
pub const BUMP_LENGTH: usize = 1;
pub const NAME_LENGTH: usize = 64;
pub const BOOL_LENGTH: usize = 1;
pub const OPTION_LENGTH: usize = 1;

// This could be an enum but right now
// borsh does not support enum (de)serialization
pub const CREATOR_AUTHORITY_TAG: u8 = 0;
pub const MINT_AUTHORITY_TAG: u8 = 1;
