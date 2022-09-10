// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
const {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  Connection,
  clusterApiUrl,
} = require('@solana/web3.js')

import { CanvasSdkClient } from '../../../sdk/src/index'

const loadKeyPairFromFs = (path: string) =>
  Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require('fs').readFileSync(path, {
          encoding: 'utf-8',
        })
      )
    )
  )
const keyPath = `${__dirname}/../../../dev_keys`

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyPath = `${__dirname}/../../../dev_keys`

  const connection = new Connection(clusterApiUrl('devnet'))
  const adminKeypair = loadKeyPairFromFs(`${keyPath}/admin.json`)
  const recipientKeypair = loadKeyPairFromFs(`${keyPath}/recipient.json`)
  const nftCanvas = new CanvasSdkClient({
    wallet: recipientKeypair,
    connection,
  })

  const response = nftCanvas.createNftCanvas({
    canvasModelName: req.body.canvasModelName,
  })

  res.status(200).json(response)
}
