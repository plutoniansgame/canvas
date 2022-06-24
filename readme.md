![](logo.jpg)

# NFT Canvas :construction: WIP :sparkles:

NFT Canvas is a Solana Protocol that facilitates two main objectives.

1. "Composing" nfts and generating a new NFT.
1. "Deconstructing" a composed NFT and allowing the holder of the deconstructed
   NFT to redeem the original NFTs that were used to create it.

## Proposed flow

Calls to this contract will be made to initialize an account that will hold
information on what NFTs may be inputs.

1. (authority) - create the nft canvas model. this is the top level structure.
   this basically represents that nfts of a new type will be minted based on
   users' assosiations that they create in their own instances of this model.
   This may be the point at which a new mint account is created to represent the
   collection of nfts minted as the product of this model.
1. (authority) - declare slots. the program doesn't need to know how many there
   are.
1. (authority) - associate mints with slots
1. (authority) - declare canvas model as ready
1. (user) - create canvas instance. whover creates the nft canvas instance will
   be its authority, once the user commits the canvas, an authorized mint will
   be created. whomever has a token account with a balance of 1 of this mint
   will be able to burn the NFT to redeem it for the nfts that were deposited.
1. (user) - deposit NFT and associate it with a slot on their canvas instance.
   This will mean that the nft canvas instance will require an associated token
   account that matches the mint of the deposited nft each time this is done.
1. (user) - remove NFT and disassociate it from their canvas instance. This
   should close the associated token account owned by the program.
1. (user) - commit their NFT canvas, locking the nft components in a vault,
   minting a new NFT. This will mark the nft canvas instance as committed and
   change the authority of the canvas to whomever holds the token minted when
   this canvas instance was committed.
1. (user) - deconstruct (burn) a composed NFT and redeem its original parts.
